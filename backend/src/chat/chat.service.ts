import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import Groq from 'groq-sdk';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ChatService {
    private groq: Groq;
    constructor(private prisma: PrismaService) {
        this.groq = process.env.GROQ_API_KEY ? new Groq({ apiKey: process.env.GROQ_API_KEY }) : null;
    }

    // 1. 핵심 페르소나 요약
    private getSystemPrompt(sentence: string, plot?: string, isEnd = false) {
        return `너는 아이의 '생각 동료'야. 
        [중심문장]: "${sentence}" ${plot ? `\n[줄거리]: ${plot}` : ''}
        - 2~3문장으로 짧고 다정하게 답해. (~구나, ~했니?)
        - 아이가 딴소리하면 맞장구쳐주고 다시 [중심문장] 이야기로 돌아와.
        - ${isEnd ? '대화를 요약하고 "우리 이 생각을 기록해볼까?"라며 마쳐.' : '만약에~ 상황을 질문해.'}`;
    }

    async startConversation(userId: string, seedId: string, bookContext?: string) {
        const seed = await this.prisma.seed.findUnique({ where: { id: seedId } });
        if (!seed) throw new HttpException('Seed not found', HttpStatus.NOT_FOUND);

        const room = await this.prisma.chatRoom.create({ data: { userId, seedId, status: 'ACTIVE' } });

        // 책의 줄거리 정보를 SYSTEM 메시지로 은밀하게 저장 (대화 맥락 유지용)
        if (bookContext) {
            await this.prisma.chatMessage.create({
                data: { chatRoomId: room.id, sender: 'SYSTEM', content: bookContext }
            });
        }

        // 첫 질문 생성 (AI가 다정하게 인사)
        const initialPrompt = `안녕! "${seed.sentence}" 이 문장을 골랐구나! 이 부분을 읽을 때 어떤 기분이 들었어?`;

        await this.prisma.chatMessage.create({
            data: { chatRoomId: room.id, sender: 'AI', content: initialPrompt }
        });

        return { chatRoomId: room.id, message: { content: initialPrompt, sender: 'AI' } };
    }

    async sendMessage(chatRoomId: string, content: string) {
        const room = await this.prisma.chatRoom.findUnique({
            where: { id: chatRoomId },
            include: { seed: true, messages: { orderBy: { createdAt: 'asc' } } }
        });

        if (!room) throw new HttpException('Room not found', HttpStatus.NOT_FOUND);
        if (!this.groq) return this.getMockResponse();

        // 2. 유저 메시지 저장
        await this.prisma.chatMessage.create({ data: { chatRoomId, sender: 'USER', content } });

        // 3. AI 메시지 생성
        // 시스템 메시지(줄거리) 추출 및 히스토리 정제
        const systemMsg = room.messages.find(m => m.sender === 'SYSTEM');
        const plot = systemMsg?.content;
        const history = room.messages.filter(m => m.sender !== 'SYSTEM');

        const isEnd = history.length >= 6;

        const completion = await this.groq.chat.completions.create({
            model: 'llama-3.1-8b-instant',
            temperature: 0.7,
            messages: [
                { role: 'system', content: this.getSystemPrompt(room.seed.sentence, plot, isEnd) },
                ...history.map(m => ({
                    role: m.sender === 'USER' ? 'user' : 'assistant' as const,
                    content: m.content
                })),
                { role: 'user', content }
            ],
        });

        const aiText = completion.choices[0]?.message?.content || "";
        const savedMsg = await this.prisma.chatMessage.create({
            data: { chatRoomId, sender: 'AI', content: aiText }
        });

        return savedMsg;
    }

    private getMockResponse() {
        return { content: "우와, 정말 멋진 생각이야!", sender: 'AI', createdAt: new Date() };
    }
}
