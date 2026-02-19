import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import Groq from 'groq-sdk';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ChatService {
    private groq: Groq;

    constructor(private prisma: PrismaService) {
        if (process.env.GROQ_API_KEY) {
            this.groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
        }
    }

    private readonly AI_PERSONA = `
    # 역할 정의
    너는 아이의 독서 탐험을 돕는 다정한 '생각 동료'야. 
    가르치려 하지 말고 아이의 상상력을 자극하는 것이 목표야.

    # 핵심 원칙 (대화 이탈 방지)
    1. **닻 내리기(Anchoring)**: 아이가 질문과 상관없는 말을 하거나 "몰라요"라고 하면, 아이의 말을 친절히 받아준 뒤(수용), 다시 "그런데 우리가 읽은 이 문장 말이야~"라며 원래 문장으로 화제를 돌려줘.
    2. **비약 금지**: 문장에서 바로 철학적 교훈으로 넘어가지 마. 철저히 상황에 집중해.
    3. **직접 대화**: '단계', '질문' 등 지시어나 단계 이름을 답변에 절대 포함하지 마.
    4. **간결함**: 답변은 2~3문장 이내로 짧게 하고 다정한 말투(~구나, ~했니?)를 사용해.

    # 상황별 대응 매뉴얼
    - 아이가 딴소리를 할 때: "오, 그렇구나! (맞장구) 그런데 아까 우리가 본 문장에서..."라고 연결해.
    - 아이가 답답해할 때: 억지로 캐묻지 말고, "혹시 (A)일까, (B)일까?" 같은 쉬운 선택지를 줘.
    - 대화가 산으로 갈 때: 언제든 "우리가 아까 무슨 이야기를 했지? 아! [원래 문장] 이야기였지!"라며 중심을 잡아.
    `;

    async startConversation(userId: string, seedId: string) {
        const seed = await this.prisma.seed.findUnique({ where: { id: seedId } });
        if (!seed) throw new HttpException('Seed not found', HttpStatus.NOT_FOUND);

        const chatRoom = await this.prisma.chatRoom.create({
            data: { userId, seedId, status: 'ACTIVE' },
        });

        // 1단계 시작: 상황 컨텍스트 주입
        const initialContext = `
      [독서 정보]
      - 책 제목: '${seed.bookTitle}'
      - 선택 문장: "${seed.sentence}"
      
      [미션]
      위 문장에 대해 아이에게 다정한 첫마디를 건네줘. 
      문장에 공감하고, 왜 이 문장이 눈길을 끌었는지 궁금해하는 질문을 해줘.
    `;

        const response = await this.sendMessage(chatRoom.id, initialContext);
        return { chatRoomId: chatRoom.id, message: response };
    }

    async sendMessage(chatRoomId: string, prompt: string) {
        try {
            const chatRoom = await this.prisma.chatRoom.findUnique({
                where: { id: chatRoomId },
                include: { seed: true }
            });

            if (!chatRoom) throw new HttpException('Chat room not found', HttpStatus.NOT_FOUND);

            const history = await this.prisma.chatMessage.findMany({
                where: { chatRoomId },
                orderBy: { createdAt: 'asc' },
            });

            const isInitialPrompt = history.length === 0 && prompt.includes('[독서 정보]');

            if (!isInitialPrompt) {
                await this.prisma.chatMessage.create({
                    data: { chatRoomId, sender: 'USER', content: prompt },
                });
            }

            if (!this.groq) return this.getMockResponse(chatRoomId);

            // 단계별 가이드라인 + 문맥 유지(Context Anchoring)
            let stageInstruction = `\n[절대 잊지 마] 지금 대화의 중심 문장은 "${chatRoom.seed.sentence}"이야.`;

            if (history.length === 0) {
                stageInstruction += "\n[지침] 대화 시작: 문장에 공감하고 아이의 첫 느낌을 물어봐.";
            } else if (history.length >= 6) {
                stageInstruction += "\n[지침] 대화 마무리: 아이의 생각을 한 문장으로 요약해 칭찬하고, 기록을 부드럽게 권유해.";
            } else {
                stageInstruction += "\n[지침] 사고 확장: 아이 답변이 엉뚱해도 일단 받아주고, 다시 원래 문장 상황(What-if)으로 유도해. 막막해 보이면 선택지를 줘.";
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
                temperature: 0.6, // 산으로 가지 않도록 온도를 약간 낮춤
                max_tokens: 300,
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
            content: "와, 그 문장을 읽으니 어떤 상상이 드니? 궁금해!",
            sender: 'AI',
            createdAt: new Date(),
        };
    }
}
