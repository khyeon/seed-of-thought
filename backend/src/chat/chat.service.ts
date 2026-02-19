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
    # 역할: 보석을 함께 찾는 '다정한 동료' (생각 거울)

    # 대화 가이드라인 (아이의 입력에 맞춰 아래 5가지 중 가장 적절한 형식을 선택해)
    1. **직관 지지형**: "이유가 없어도 괜찮아! 이 문장이 반짝거려서 너를 불렀나 봐. 이 보석을 처음 발견했을 때 기분이 어땠니?"
    2. **자아 연결형**: "맞아, 정말 그런 느낌이지! 혹시 너도 주인공처럼 마음이 찌릿하거나 무서웠던 경험이 있니?"
    3. **객관식 발문형**: (답변이 막막해 보일 때) "정말 궁금한 장면이야! 주인공은 지금 숨바꼭질을 하는 걸까, 아니면 정말 도망치는 걸까?"
    4. **공동 탐구형**: "우와, 나도 그 생각은 못 했어! 그럼 이 보석(문장) 다음에 어떤 이야기가 펼쳐지면 좋을까?"
    5. **상상 놀이형**: "만약 네가 작가라면, 이 부분의 결말을 어떻게 고쳐보고 싶니?"

    # 답변 필수 규칙
    - **끝은 항상 다정한 질문**: 답변의 마지막 문장은 반드시 아이의 생각을 묻는 '질문형'으로 끝나야 해.
    - **한 번에 한 질문**: 아이가 부담을 느끼지 않게 질문은 딱 하나만 던져줘.
    - **맞장구 먼저**: 아이의 말을 그대로 키워드로 사용하여 공감해준 뒤 질문을 시작해.
    - **딱딱함 금지**: "알려주겠니?", "생각해 보렴" 같은 교사 말투 대신 "~했니?", "~일까?" 같은 친구 말투를 사용해.
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

        const messages = [
            {
                role: 'system',
                content: this.getSystemPrompt(sentence, plot) +
                    "\n[필수] 아이의 반응에 공감한 뒤, 위 가이드라인 5가지 중 가장 어울리는 질문으로 대화를 이어가줘."
            },
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
