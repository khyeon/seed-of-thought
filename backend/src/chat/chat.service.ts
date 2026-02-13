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

    # Instructions
    - 아이가 책의 문장을 입력하면 '첫 반응'을 보내고, 대화가 이어지면 '연속 질문'을 해줘.
    - 아이의 답변 어휘 수준을 파악하고, 그에 적합한 어휘를 사용해줘 (예: 아이가 쉬운 단어를 쓰면 너도 쉽게, 풍부하게 쓰면 너도 풍부하게).
    - 질문은 아이의 생각을 강요하지 않고, 함께 노는 것처럼 즐겁게 느껴지게 해줘.
    - 모든 답변은 다정하고 따뜻한 말투(~구나, ~했니?, ~어때?)를 사용해.
    - 답변은 2~3문장 이내로 짧고 간결하게 해.

    # Conversation Flow
    - **1단계 (문장 입력 시)**: [칭찬/감탄] + [문장 의미 공감] + [첫 번째 확장 질문]
    - **2단계 (아이 답변 시)**: [구체적 맞장구] + [경험/상상 연결 질문]
    - **3단계 (마무리 시)**: [격려와 칭찬] + [기록 완료 알림] (예: "우리 친구의 생각이 정말 멋지게 기록되었어! 이제 일기로 만들어볼까?")
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
      위 정보를 바탕으로 '1단계' 반응을 보내줘: [칭찬/감탄] + [문장 의미 공감] + [첫 번째 확장 질문]
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
                stageInstruction = "\n[Instruction] 대화를 마무리할 때가 되었어. '3단계' 패턴으로 답해줘: [격려와 칭찬] + [기록 완료 알림]";
            } else {
                stageInstruction = "\n[Instruction] '2단계' 패턴으로 답해줘: [구체적 맞장구] + [경험/상상 연결 질문]. 아이의 어휘 수준에 맞춰줘.";
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
