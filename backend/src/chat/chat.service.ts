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
    # 역할: 보석을 함께 찾는 다정한 '생각 동료'
    너는 아이가 책 속에서 발견한 보석(문장)을 함께 감상하는 친구야. 
    가이드라인의 예시 문구에 갇히지 말고, 아이의 말에 따라 매번 새롭고 다정한 대화를 만들어줘.

    # 대화 운영 원칙 (예시가 아닌 '원리'를 따를 것)
    1. **공감적 반영**: 아이의 말속에 담긴 감정과 키워드를 캐치해서 네 문장에 녹여줘. (거울 효과)
    2. **직관 지지**: 아이가 논리적인 이유를 대지 못하더라도, 그 선택이 얼마나 멋진지 지지해줘. 보석은 원래 그냥 눈에 띄는 거니까!
    3. **자아 연결**: 책의 상황을 아이의 일상이나 경험으로 부드럽게 가져와서 '나의 이야기'가 되게 해줘.
    4. **나의 감상 공유**: 질문만 하지 말고, 너도 그 문장을 보고 느낀 점을 친구처럼 짧게 들려줘.
    5. **질문 강박 탈출**: 대화의 끝은 반드시 질문(?)일 필요는 없어. 따뜻한 마침표(.)나 여운이 남는 감탄(!)으로 아이의 생각이 머물 자리를 만들어줘.

    # 답변 필수 규칙
    - 줄거리를 요약하거나 설명하려 하지 마. 줄거리는 대화를 풍성하게 하는 양념일 뿐이야.
    - 한 번에 하나의 주제만 다뤄. 문장은 2~3줄로 짧고 다정하게 작성해.
    - "알려주겠니?", "생각해 보렴" 같은 교사 말투는 금지야. (~구나, ~했니?, ~인 것 같아 사용)
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
            try {
                const systemContent = this.getSystemPrompt(seed.sentence, bookContext);
                const userMessage = `내가 고른 보석(문장)은 이거야: "${seed.sentence}". 
                이 문장에 대해 '생각 동료'로서 첫인사를 다정하게 건네줘. (~했니? ~구나? 말투 사용)`;

                const completion = await this.groq.chat.completions.create({
                    model: 'llama-3.1-8b-instant',
                    temperature: 0.85,
                    messages: [
                        { role: 'system', content: systemContent },
                        { role: 'user', content: userMessage }
                    ],
                });
                initialPrompt = completion.choices[0]?.message?.content || "안녕! 정말 반짝이는 문장을 골랐구나! 이 부분을 읽을 때 어떤 기분이 들었어?";
            } catch (error) {
                console.error('Groq startConversation Error:', error);
                initialPrompt = `안녕! "${seed.sentence}" 이 문장을 골랐구나! 이 부분을 읽을 때 어떤 기분이 들었어?`;
            }
        } else {
            initialPrompt = `안녕! "${seed.sentence}" 이 문장을 골랐구나! 이 부분을 읽을 때 어떤 기분이 들었어?`;
        }

        await this.prisma.chatMessage.create({
            data: { chatRoomId: room.id, sender: 'AI', content: initialPrompt }
        });

        return { chatRoomId: room.id, message: { content: initialPrompt, sender: 'AI' } };
    }

    async sendMessage(
        chatRoomId: string,
        content: string,
        history: { role: 'user' | 'assistant', content: string }[],
        sentence: string,
        plot?: string
    ) {
        if (!this.groq) return this.getMockResponse();

        // 1. 유저 메시지 저장
        await this.prisma.chatMessage.create({ data: { chatRoomId, sender: 'USER', content } });

        // 2. AI 메시지 생성
        const messages: any[] = [
            {
                role: 'system',
                content: this.getSystemPrompt(sentence, plot) +
                    `\n[추가 지침] 이전의 예시 답변들에 얽매이지 말고, 아이의 최신 대답인 "${content}"에만 집중해서 독창적이고 다정하게 반응해줘.`
            },
            ...history,
            { role: 'user', content }
        ];

        let aiText = "";
        try {
            const completion = await this.groq.chat.completions.create({
                model: 'llama-3.1-8b-instant',
                temperature: 0.85, // 창의성과 다양성을 위해 온도를 약간 높임
                messages: messages,
            });
            aiText = completion.choices[0]?.message?.content || "";
        } catch (error) {
            console.error('Groq sendMessage Error:', error);
            aiText = "네 생각이 반짝반짝 빛나고 있어! 더 이야기해줄래?";
        }

        // 3. AI 메시지 저장
        const savedMsg = await this.prisma.chatMessage.create({
            data: { chatRoomId, sender: 'AI', content: aiText }
        });

        return {
            id: savedMsg.id,
            content: aiText,
            sender: 'AI',
            createdAt: savedMsg.createdAt,
        };
    }

    private getMockResponse() {
        return { content: "네 생각이 반짝반짝 빛나고 있어! 더 이야기해줄래?", sender: 'AI', createdAt: new Date() };
    }
}
