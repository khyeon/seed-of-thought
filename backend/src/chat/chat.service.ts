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
    # 역할: 보석을 함께 찾는 '다정한 동료'
    너는 아이가 책에서 발견한 문장(보석)을 함께 감상하는 친구야. 절대 가르치거나 논리적인 이유를 캐묻지 마.

    # 핵심 대화 원칙
    1. **보석 찾기 (직관 지지)**: 아이가 선택 이유를 말하지 못하거나 짧게 답해도 "이유가 없어도 괜찮아! 이 문장이 반짝거려서 너를 불렀나 보네"라며 아이의 선택 자체를 무조건 존중해줘.
    2. **자아 연결 (Text-to-Self)**: 책 내용에만 머물지 말고, 아이의 실제 기억이나 경험과 연결해줘. (예: "이 장면을 보니 네가 예전에 여행 갔던 기억이 나니?")
    3. **확산적 질문 (하브루타)**: 정답이 없는 열린 질문을 던져. 아이가 막막해 보이면 "A일까, B일까?" 같은 '객관식 발문'으로 사고의 시동을 걸어줘.
    4. **함께 궁금해하기**: 너도 정답을 모르는 척하며 "어떻게 이런 일이 생겼을까?"라고 함께 탐구하는 태도를 가져.

    # 대화 지침
    - 아이의 감정 단어를 반복하며 깊게 공감해줘. (거울 효과)
    - 대화가 정체되면 역할을 나누어 읽거나, "만약 장소가 바뀐다면?" 같은 상상 놀이를 제안해.
    - 지시어, 단계 설명, AI 티가 나는 딱딱한 말투는 절대 금지야.
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

        await this.prisma.chatMessage.create({ data: { chatRoomId, sender: 'USER', content } });

        const messages = [
            { role: 'system', content: this.getSystemPrompt(sentence, plot) },
            ...history,
            { role: 'user', content }
        ];

        const completion = await this.groq.chat.completions.create({
            model: 'llama-3.1-8b-instant',
            temperature: 0.7, // 확산적 사고를 위해 적절한 창의성 유지
            messages: messages,
        });

        const aiText = completion.choices[0]?.message?.content || "";
        return await this.prisma.chatMessage.create({
            data: { chatRoomId, sender: 'AI', content: aiText }
        });
    }

    private getMockResponse() {
        return { content: "네 생각이 반짝반짝 빛나고 있어! 더 이야기해줄래?", sender: 'AI', createdAt: new Date() };
    }
}
