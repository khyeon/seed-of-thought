import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import Groq from 'groq-sdk';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ChatService {
    private groq: Groq | null;
    constructor(private prisma: PrismaService) {
        this.groq = process.env.GROQ_API_KEY ? new Groq({ apiKey: process.env.GROQ_API_KEY }) : null;
    }

    private readonly THINKING_MIRROR_PERSONA = `
    # 역할: 아이의 마음을 비추는 '생각 거울'
    너는 아이가 책 속에서 길을 잃지 않도록 돕는 다정한 동료야. 가르치려 하지 말고, 아이의 현재 대화 상태에 따라 아래 두 가지 역할 중 하나를 수행해.

    # 상태별 대응 전략 (핵심 로직)

    ## 1. 아이의 생각이 퍼져나갈 때 (발산 상태)
    - **증상**: "그냥요", "무서워요", "무슨 말인지 모르겠어요", "배고파요" (단답형 혹은 딴소리)
    - **AI의 역할**: **[생각 모으기]**
    - **대응**: 아이의 말을 짧게 긍정해준 뒤, 책의 줄거리(맥락)를 활용해 아주 구체적인 '장면'을 머릿속에 그려주며 선택지를 줘.
    - **예시**: "무서울 수 있어! 지금 영모가 갑자기 사라져서 사방이 캄캄한 상황이잖아. 영모가 무서워서 숨어있는 걸까, 아니면 누군가 데려간 걸까? 네 생각은 어때?"

    ## 2. 아이가 명확한 메시지를 줄 때 (수렴 상태)
    - **증상**: "때리는 건 나빠요", "영모가 불쌍해요", "주인공이 나쁜 것 같아요" (가치 판단 혹은 감정 표현)
    - **AI의 역할**: **[깊게 파고들기]**
    - **대응**: 아이의 생각에 격하게 공감해준 뒤, "왜?"를 묻기보다 그 마음이 들게 된 '책 속의 이유'를 추측하며 아이의 동의를 구해.
    - **예시**: "맞아, 때리는 건 정말 나쁜 일이지! 네 마음이 참 따뜻하다. 그런데 주인공은 왜 이렇게 나쁜 방법을 선택했을까? 혹시 주인공도 마음이 너무 아픈 상태였을까?"

    # 절대 규칙
    - 지시 사항, 단계 이름, (맞장구) 같은 용어는 절대 답변에 포함하지 마.
    - 질문은 한 번에 딱 하나만 해.
    - 아이가 "이해 못 하겠어"라고 하면 즉시 사과하고, 책의 줄거리를 비유로 들어 아주 쉽게 다시 말해줘.
    - 2~3문장 이내로 짧고 다정하게 답해. (~구나, ~했니?)
    `;

    private getSystemPrompt(sentence: string, plot?: string) {
        return `${this.THINKING_MIRROR_PERSONA}
        [중심문장]: "${sentence}" ${plot ? `\n[줄거리]: ${plot}` : ''}`;
    }

    async startConversation(userId: string, seedId: string, bookContext?: string) {
        const seed = await this.prisma.seed.findUnique({ where: { id: seedId } });
        if (!seed) throw new HttpException('Seed not found', HttpStatus.NOT_FOUND);

        const room = await this.prisma.chatRoom.create({ data: { userId, seedId, status: 'ACTIVE' } });

        if (bookContext) {
            await this.prisma.chatMessage.create({
                data: { chatRoomId: room.id, sender: 'SYSTEM', content: bookContext }
            });
        }

        const initialPrompt = `안녕! "${seed.sentence}" 이 문장을 골랐구나! 이 부분을 읽을 때 어떤 기분이 들었어?`;

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

        // 1. 유저 메시지 저장 (비동기로 실행하여 응답 속도 향상 가등하나 일단 순차 처리)
        await this.prisma.chatMessage.create({ data: { chatRoomId, sender: 'USER', content } });

        // 2. AI 메시지 생성 (DB 조회 없이 전달된 파라미터 활용)
        const messages: any[] = [
            { role: 'system', content: this.getSystemPrompt(sentence, plot) },
            ...history,
            { role: 'user', content }
        ];

        const completion = await this.groq.chat.completions.create({
            model: 'llama-3.1-8b-instant',
            temperature: 0.7,
            messages: messages,
        });

        const aiText = completion.choices[0]?.message?.content || "";

        // 3. AI 메시지 저장
        const savedMsg = await this.prisma.chatMessage.create({
            data: { chatRoomId, sender: 'AI', content: aiText }
        });

        return savedMsg;
    }

    private getMockResponse() {
        return { content: "우와, 정말 멋진 생각이야!", sender: 'AI', createdAt: new Date() };
    }
}
