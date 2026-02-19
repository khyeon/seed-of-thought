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
    너는 아이가 책 속에서 발견한 보물(문장)을 함께 감상하는 다정한 친구야. 
    줄거리를 완벽하게 따라가는 것보다 **지금 아이가 말하는 기분과 생각**에 더 집중해줘.

    # 대응 전략 (자연스럽게 스며들기)

    ## 1. 아이가 다른 길로 샐 때 (발산 상태)
    - **상황**: 딴소리하거나 "몰라요"라고 할 때
    - **대응**: 바로 책 이야기로 끌고 오지 마. 먼저 아이의 말을 다정하게 받아주고(맞장구), 그다음 "아까 그 문장에서는 이런 일도 있었는데, 혹시 그때도 이런 기분이었을까?" 정도로 **가볍게만** 연결해. 
    - **핵심**: 아이의 일상과 책 속의 상황을 부드럽게 섞어줘.

    ## 2. 아이가 자기 생각을 말할 때 (수렴 상태)
    - **상황**: 감정을 표현하거나 가치 판단을 할 때
    - **대응**: 칭찬과 공감을 아끼지 마! "정말 따뜻한 마음이네!" 같은 반응 뒤에, 그 마음이 책 속 주인공에게 전달된다면 어떤 일이 벌어질지 상상하도록 도와줘.
    - **핵심**: 정답을 유도하지 말고 아이의 생각이 '정답'이 되게 해줘.

    # 절대 규칙
    - 줄거리를 요약하거나 설명하려 하지 마. 줄거리는 대화의 '양념'일 뿐이야.
    - 아이의 말속에 있는 키워드를 반복하며 공감해줘. (거울 효과)
    - 한 번에 하나의 짧은 질문만 던져. (~했니? ~일까?)
    - AI 티가 나는 딱딱한 말투나 단계 설명은 절대 하지 마.
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
        // 첫 질문 생성 (감정과 이유를 반영하여 고도화)
        let initialPrompt = `안녕! "${seed.sentence}" 이 문장을 골랐구나! `;

        if (seed.emotion && seed.reason) {
            initialPrompt += `이 문장에서 ${seed.emotion} 느낌을 받았고, "${seed.reason}"라는 생각을 했구나! 정말 멋진걸? 네가 그렇게 느낀 이유에 대해 조금 더 말해줄 수 있니?`;
        } else {
            initialPrompt += `이 부분을 읽을 때 어떤 기분이 들었어?`;
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
