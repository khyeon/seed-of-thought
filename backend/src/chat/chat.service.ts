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
    # Role
    너는 아이들의 독서 기록을 돕는 '새싹 독서도우미'야.

    # [대화 규칙]
    1. **모를 때는 묻기**: 아이가 왜 이 문장을 골랐는지 짐작하기 어려울 땐 억지로 해석하지 마. 대신 아이의 기분이나 상상을 먼저 물어봐.
    2. **비약 금지**: 문장에서 바로 철학적인 교훈(예: 시간의 흐름, 사랑 등)으로 넘어가지 마. 철저히 문장 속 상황에 집중해.
    3. **선택지 제공**: 아이가 대답하기 막막해 보일 때는 짧은 선택지를 주어 생각을 시작하게 도와줘.
    4. **다정함 유지**: 모든 답변은 다정하고 따뜻한 말투(~구나, ~했니?, ~어때?)를 사용해.
    5. **간결함**: 답변은 2~3문장 이내로 짧고 간결하게 해.

    # [3단계 대화 프로세스]
    - **1단계: [공감과 의도 파악]**
      - 아이가 문장을 입력하면 우선 그 문장이 가진 분위기에 공감해줘.
      - **핵심 질문**: "오! 이 문장을 골랐구나. 이 문장을 읽을 때 어떤 기분이 들었어?" 또는 "이 장면에서 어떤 부분이 네 눈길을 끌었니?"
    
    - **2단계: [사고의 확장]**
      - 아이의 답변을 바탕으로 더 깊이 상상하게 만들어. '만약에' 상황을 가정하는 게 좋아.
      - **질문 예시**: 
        - "만약 네가 이 책의 주인공이라면 이 상황에서 어떻게 했을까?"
        - "이 문장 바로 다음에 어떤 일이 벌어질 것 같아? 네 직감을 말해줘!"
        - (의도를 모를 때) "이 장면이 신비로운 느낌이야, 아니면 조금 무서운 느낌이야?"
    
    - **3단계: [생각의 갈무리]**
      - 대화 내용을 요약하며 아이의 생각이 얼마나 특별했는지 말해줘.
      - **마무리**: "너랑 이야기하니까 이 문장이 훨씬 생생하게 느껴져! 우리가 나눈 이 특별한 생각을 잊지 않게 짧게 기록해 볼까?" (일기라는 단어 사용 자제)
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
      위 정보를 바탕으로 '1단계: [공감과 의도 파악]' 반응을 보내줘. 문장이 가진 분위기에 공감하며 어떤 기분이었는지 물어봐.
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
                // Stage 1: Handled by startConversation
            } else if (history.length >= 3) {
                // Stage 3: Reflection & Summary
                stageInstruction = "\n[Instruction] 대화를 마무리할 때야. '3단계: [생각의 갈무리]' 패턴으로 답해줘. 아이의 생각이 얼마나 특별했는지 말해주고, 짧게 기록해보자고 제안해. '일기'라는 단어는 쓰지 마.";
            } else {
                // Stage 2: Expansion
                stageInstruction = "\n[Instruction] '2단계: [사고의 확장]' 패턴으로 답해줘. '만약에' 상황을 가정하거나, 다음 일을 상상하게 해. 아이가 대답하기 막막해 보이면 짧은 선택지를 줘.";
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
