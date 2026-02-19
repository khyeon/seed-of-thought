import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import Groq from 'groq-sdk';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ChatService {
    private groq: Groq | null;
    constructor(private prisma: PrismaService) {
        this.groq = process.env.GROQ_API_KEY ? new Groq({ apiKey: process.env.GROQ_API_KEY }) : null;
    }

    private readonly GEM_FINDER_PERSONA = `
    # 역할: 아이의 생각을 함께 정리하는 '보석 보관함'

    # 대화 탈출 전략 (뫼비우스 띠 방지)
    1. **의미 부여 (의미화)**: 아이가 대답하면 "왜?"라고 다시 묻지 마. 대신 "네 말을 들으니 이 문장이 더 반짝거려. 영모의 슬픔을 네가 대신 느껴준 거구나"라고 아이의 대답에 가치를 부여해줘.
    2. **질문 대신 제안**: 대화가 3번 이상 오갔다면 질문을 멈추고 제안을 해. "우리 이 멋진 생각을 보석함(기록)에 담아볼까?" 혹은 "이 장면을 그림으로 그린다면 넌 어떤 색을 칠할 것 같아?"
    3. **나의 생각 공유**: "나도 네 말을 듣고 생각났어. 주인공이 참 외로웠을 것 같아." 처럼 AI인 너의 느낌을 먼저 말해서 질문 공세를 멈춰.

    # 답변 구조 (3문장 법칙)
    - 1문장: 아이의 말에 대한 격한 공감과 키워드 반복.
    - 2문장: 그 생각이 책의 맥락에서 왜 중요한지 의미 부여.
    - 3문장: (선택적) 대화를 마무리하거나, 아주 가벼운 상상 하나 던지기.
    `;

    private getSystemPrompt(sentence: string, plot?: string) {
        return `${this.GEM_FINDER_PERSONA}
        [아이의 보석(문장)]: "${sentence}" 
        [책의 맥락(줄거리)]: ${plot || '정보 없음'}`;
    }

    async startConversation(userId: string, seedId: string, bookContext?: string) {
        const seed = await this.prisma.seed.findUnique({ where: { id: seedId } });
        if (!seed) throw new HttpException('Seed not found', HttpStatus.NOT_FOUND);

        const room = await this.prisma.chatRoom.create({ data: { userId, seedId, status: 'ACTIVE' } });

        let initialPrompt = "";
        if (this.groq) {
            const systemContent = this.getSystemPrompt(seed.sentence, bookContext);
            const userMessage = `안녕! 내가 이 보석 같은 문장을 찾았어: "${seed.sentence}"
            내가 왜 이 문장을 골랐는지 몰라도 괜찮다고 말해주면서, 다정하게 첫인사를 건네줘.`;

            const completion = await this.groq.chat.completions.create({
                model: 'llama-3.1-8b-instant',
                temperature: 0.8,
                messages: [
                    { role: 'system', content: systemContent },
                    { role: 'user', content: userMessage }
                ],
            });
            initialPrompt = completion.choices[0]?.message?.content || "반짝이는 보석 같은 문장을 찾았구나! 이 문장이 너를 불렀나 봐. 어떤 기분이 드니?";
        } else {
            initialPrompt = `안녕! "${seed.sentence}" 이 문장은 정말 반짝이는 보석 같아. 이 부분이 왜 네 눈에 띄었을까?`;
        }

        await this.prisma.chatMessage.create({
            data: { chatRoomId: room.id, sender: 'AI', content: initialPrompt }
        });

        return { chatRoomId: room.id, message: { content: initialPrompt, sender: 'AI' } };
    }

    async sendMessage(chatRoomId: string, content: string, history: any[], sentence: string, plot?: string) {
        if (!this.groq) return this.getMockResponse();

        // 유저 메시지 저장
        await this.prisma.chatMessage.create({ data: { chatRoomId, sender: 'USER', content } });

        // 대화 길이에 따라 AI의 태도를 변화시킴 (질문 압박 해제)
        const turnCount = history.length;
        let strategy = "";

        if (turnCount > 6) {
            strategy = "\n[중요] 이제 대화를 마무리할 때야. 아이의 생각을 한 문장으로 멋지게 요약해주고 칭찬해줘. 더 이상 질문하지 마.";
        } else {
            strategy = "\n[중요] 질문을 위한 질문을 하지 마. 아이의 답변을 받아서 '의미'를 찾아주는 말을 해줘.";
        }

        const messages = [
            { role: 'system', content: this.getSystemPrompt(sentence, plot) + strategy },
            ...history,
            { role: 'user', content }
        ];

        const completion = await this.groq.chat.completions.create({
            model: 'llama-3.1-8b-instant',
            temperature: 0.7,
            messages: messages,
        });

        const aiText = completion.choices[0]?.message?.content || "";

        // AI 메시지 저장 및 반환
        return await this.prisma.chatMessage.create({
            data: { chatRoomId, sender: 'AI', content: aiText }
        });
    }

    private getMockResponse() {
        return { content: "네 생각이 반짝반짝 빛나고 있어! 더 이야기해줄래?", sender: 'AI', createdAt: new Date() };
    }
}
