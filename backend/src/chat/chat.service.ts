import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import Groq from 'groq-sdk';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ChatService {
    private groq: Groq;

    constructor(private prisma: PrismaService) {
        if (process.env.GROQ_API_KEY) {
            console.log('Groq API Key detected, initializing Groq SDK');
            this.groq = new Groq({
                apiKey: process.env.GROQ_API_KEY,
            });
        } else {
            console.error('CRITICAL: GROQ_API_KEY is missing in process.env');
        }
    }

    private readonly AI_PERSONA = `
    # 역할 정의
    너는 아이의 독서 파트너인 '생각 이끌이'야. 너의 목표는 아이가 선택한 문장을 통해 아이의 머릿속에 있는 상상력과 생각을 밖으로 꺼내주는 거야. 가르치려 하거나 정답을 말하지 말고, 아이의 눈높이에서 호기심 어린 질문을 던져줘.

    # 대화 규칙
    - **모를 때는 묻기**: 아이가 왜 이 문장을 골랐는지 짐작하기 어려울 땐 억지로 해석하지 마. 대신 아이의 기분이나 상상을 먼저 물어봐.
    - **비약 금지**: 문장에서 바로 철학적인 교훈(예: 시간의 흐름, 사랑 등)으로 넘어가지 마. 철저히 문장 속 상황에 집중해.
    - **선택지 제공**: 아이가 대답하기 막막해 보일 때는 짧은 선택지를 주어 생각을 시작하게 도와줘.
    - **어휘 수준 맞춤**: 아이의 답변 어휘 수준을 파악하고, 그에 적합한 어휘를 사용해줘.
    - **다정한 말투**: 모든 답변은 다정하고 따뜻한 말투(~구나, ~했니?, ~어때?)를 사용해.
    - **간결함**: 답변은 2~3문장 이내로 짧고 간결하게 해.

    # 3단계 대화 프로세스
    - **1단계 (공감과 의도 파악)**: 분위기 공감 + "어떤 기분이었니?" 또는 "어떤 부분이 눈길을 끌었니?"와 같은 질문.
    - **2단계 (사고의 확장)**: 아이의 답변을 바탕으로 '만약에' 상황 가정 또는 직감 묻기. 의도를 모를 땐 느낌 선택지 제공.
    - **3단계 (생각의 갈무리)**: 요약 + 특별함 칭찬 + 기록 유도 (일기라는 단어 자제).
  `;

    async startConversation(userId: string, seedId: string) {
        console.log('Starting conversation for user:', userId, 'seed:', seedId);
        const seed = await this.prisma.seed.findUnique({
            where: { id: seedId },
        });

        if (!seed) {
            console.error('Seed not found:', seedId);
            throw new HttpException('Seed not found', HttpStatus.NOT_FOUND);
        }

        const chatRoom = await this.prisma.chatRoom.create({
            data: {
                userId,
                seedId,
                status: 'ACTIVE',
            },
        });
        console.log('Chat room created:', chatRoom.id);

        // Stage 1 Prompt
        const firstPrompt = `
      [Context]
      - Book Title: '${seed.bookTitle}'
      - Chosen Sentence: "${seed.sentence}"
      
      [Instruction]
      위 정보를 바탕으로 '1단계' 반응을 보내줘:
      1. 문장의 분위기에 공감하기
      2. 질문: "이 문장을 읽을 때 어떤 기분이 들었어?" 또는 "어떤 부분이 네 눈길을 끌었니?"
    `;

        const response = await this.sendMessage(chatRoom.id, firstPrompt);

        return {
            chatRoomId: chatRoom.id,
            message: response,
        };
    }

    async sendMessage(chatRoomId: string, prompt: string) {
        console.log('Generating AI Response for chatroom:', chatRoomId);

        try {
            const history = await this.prisma.chatMessage.findMany({
                where: { chatRoomId },
                orderBy: { createdAt: 'asc' },
            });

            // Determine if this is the very first system-initiated prompt
            const isInitialPrompt = history.length === 0 && prompt.includes('[Context]');

            // Save User message if it's not the first system-initiated prompt
            if (!isInitialPrompt) {
                await this.prisma.chatMessage.create({
                    data: {
                        chatRoomId,
                        sender: 'USER',
                        content: prompt,
                    },
                });
            }

            if (!this.groq) {
                return this.getMockResponse(chatRoomId);
            }

            // Determine current flow stage
            let stageInstruction = "";
            if (history.length === 0) {
                // Stage 1 is handled via the prompt itself in startConversation
            } else if (history.length >= 6) {
                stageInstruction = "\n[Instruction] 대화를 마무리할 때가 되었어. '3단계' 패턴으로 답해줘: [내용 요약] + [생각의 특별함 칭찬] + [기록 유도 (예: 우리 이 생각을 잊지 않게 살짝 남겨볼까?)]";
            } else {
                stageInstruction = "\n[Instruction] '2단계' 패턴으로 답해줘: 아이 답변을 바탕으로 '만약에' 상황을 가정하거나 직감을 물어보며 사고를 확장해줘. 답변이 막막해 보이면 짧은 선택지를 줘.";
            }

            // Prepare messages for Groq format
            const messages: any[] = [
                { role: 'system', content: this.AI_PERSONA + stageInstruction },
            ];

            // Add history
            history.forEach(msg => {
                messages.push({
                    role: msg.sender === 'USER' ? 'user' : 'assistant',
                    content: msg.content
                });
            });

            // Add current prompt
            messages.push({ role: 'user', content: prompt });

            const completion = await this.groq.chat.completions.create({
                messages: messages,
                model: 'llama-3.1-8b-instant',
                temperature: 0.7,
                max_tokens: 500,
            });

            const aiText = completion.choices[0]?.message?.content || "";

            // Save AI response
            const savedMsg = await this.prisma.chatMessage.create({
                data: {
                    chatRoomId,
                    sender: 'AI',
                    content: aiText,
                },
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
            content: "정말 멋진 생각이구나! 그 문장이 왜 마음에 들었는지 조금 더 알 수 있을까?",
            sender: 'AI',
            createdAt: new Date(),
        };
    }
}
