import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import Groq from 'groq-sdk';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ChatService {
    private groq: Groq;

    constructor(private prisma: PrismaService) {
        if (process.env.GROQ_API_KEY) {
            this.groq = new Groq({
                apiKey: process.env.GROQ_API_KEY,
            });
        }
    }

    private readonly AI_PERSONA = `
    # 역할 정의
    너는 아이의 독서 탐험을 돕는 다정한 '생각 동료'야. 
    아이의 상상력을 밖으로 꺼내주는 것이 목표야. 절대 선생님처럼 가르치려 하지 마.

    # 대화 규칙 (필수)
    1. **아이에게 직접 말하듯 답변해**: '1단계', '질문' 등의 지시어나 단계 이름을 절대로 답변에 포함하지 마.
    2. **비약 금지**: 문장에서 바로 철학적인 교훈(시간, 사랑 등)으로 넘어가지 마. 철저히 상황에 집중해.
    3. **모를 때는 묻기**: 아이가 왜 이 문장을 골랐는지 모르겠다면 "이 장면을 읽을 때 기분이 어땠어?"라고 먼저 물어봐.
    4. **다정한 말투**: 모든 답변은 다정하게(~구나, ~했니?, ~어때?) 하고, 2~3문장 이내로 짧게 대답해.
    5. **선택지 제공**: 아이가 대답하기 막막해 보이면 2~3개의 쉬운 선택지를 줘.
    `;

    async startConversation(userId: string, seedId: string) {
        const seed = await this.prisma.seed.findUnique({
            where: { id: seedId },
        });

        if (!seed) {
            throw new HttpException('Seed not found', HttpStatus.NOT_FOUND);
        }

        const chatRoom = await this.prisma.chatRoom.create({
            data: { userId, seedId, status: 'ACTIVE' },
        });

        // 1단계: 첫 질문은 '지시'가 아니라 '상황'만 전달하여 AI가 캐릭터에 몰입하게 함
        const initialContext = `
      [책 제목]: '${seed.bookTitle}'
      [선택한 문장]: "${seed.sentence}"
      
      이 문장에 대해 아이에게 다정한 첫마디를 건네줘. 
      문장의 분위기에 공감해주고, 왜 이 부분이 눈길을 끌었니? 라고 궁금해하는 질문을 던져줘.
      절대 지시사항 형식을 출력하지 말고 '대화'만 출력해.
    `;

        const response = await this.sendMessage(chatRoom.id, initialContext);

        return {
            chatRoomId: chatRoom.id,
            message: response,
        };
    }

    async sendMessage(chatRoomId: string, prompt: string) {
        try {
            const history = await this.prisma.chatMessage.findMany({
                where: { chatRoomId },
                orderBy: { createdAt: 'asc' },
            });

            const isInitialPrompt = history.length === 0 && prompt.includes('[책 제목]');

            if (!isInitialPrompt) {
                await this.prisma.chatMessage.create({
                    data: { chatRoomId, sender: 'USER', content: prompt },
                });
            }

            if (!this.groq) return this.getMockResponse(chatRoomId);

            // 단계별 가이드라인 (AI 내부 참고용)
            let stageInstruction = "";
            if (history.length === 0) {
                stageInstruction = "\n[지침] 지금은 대화의 시작이야. 문장에 공감하고 아이의 기분을 물어봐.";
            } else if (history.length >= 6) {
                stageInstruction = "\n[지침] 이제 대화를 아름답게 마무리해. 아이의 생각을 한 문장으로 요약해서 칭찬해주고, '이 소중한 생각을 잊지 않게 살짝 남겨볼까?'라고 부드럽게 권유해줘.";
            } else {
                stageInstruction = "\n[지침] 대화의 중간 단계야. 아이의 답변을 바탕으로 '만약에~' 상황을 상상하게 하거나 직감을 물어보며 질문해줘.";
            }

            const messages: any[] = [
                { role: 'system', content: this.AI_PERSONA + stageInstruction },
            ];

            history.forEach(msg => {
                messages.push({
                    role: msg.sender === 'USER' ? 'user' : 'assistant',
                    content: msg.content
                });
            });

            messages.push({ role: 'user', content: prompt });

            const completion = await this.groq.chat.completions.create({
                messages: messages,
                model: 'llama-3.1-8b-instant',
                temperature: 0.8, // 창의적인 대화를 위해 소폭 상향
                max_tokens: 300,  // 아이용이므로 짧게 유지
            });

            const aiText = completion.choices[0]?.message?.content || "";

            const savedMsg = await this.prisma.chatMessage.create({
                data: { chatRoomId, sender: 'AI', content: aiText },
            });

            return {
                id: savedMsg.id,
                content: aiText,
                sender: 'AI',
                createdAt: savedMsg.createdAt,
            };
        } catch (error) {
            console.error('Groq AI Error:', error);
            return this.getMockResponse(chatRoomId);
        }
    }

    private getMockResponse(chatRoomId: string) {
        return {
            id: Date.now().toString(),
            content: "그 문장을 읽고 어떤 기분이 들었니? 궁금하구나!",
            sender: 'AI',
            createdAt: new Date(),
        };
    }
}
