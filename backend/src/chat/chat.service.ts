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

    # 대화 운영 원칙
    1. **공감적 반영**: 아이의 말속에 담긴 감정과 키워드를 캐치해서 네 문장에 녹여줘.
    2. **직관 지지**: 아이가 논리적인 이유를 대지 못하더라도, 그 선택이 얼마나 멋진지 지지해줘.
    3. **자아 연결**: 책의 상황을 아이의 일상이나 경험으로 부드럽게 가져와서 '나의 이야기'가 되게 해줘.
    4. **나의 감상 공유**: 질문만 하지 말고, 너도 그 문장을 보고 느낀 점을 짧게 들려줘.
    5. **질문 강박 탈출**: 대화의 끝은 반드시 질문일 필요는 없어. 따뜻한 마침표나 감탄으로 끝내줘.

    # 답변 필수 규칙
    - 반드시 **순수 한국어**로만 답변해. 한자(心里 등)나 영어 단어(Wondered 등)를 절대 섞지 마.
    - 7~10세 어린이가 이해할 수 있는 아주 쉽고 예쁜 한글 단어만 사용해.
    - **추상적인 단어(욕망, 허탈함 등)가 나오면 풍선, 날씨, 솜사탕 같은 쉬운 사물에 비유해서 설명해줘.**
    - 질문을 던질 때는 "어디에" 같은 막연한 질문보다, **"아이의 일상(장난감, 친구, 음식)"**과 관련된 구체적인 상황을 예로 들어줘.
    - 줄거리를 요약하거나 설명하려 하지 마.
    - 한 번에 하나의 주제만 다뤄. 문장은 2~3줄로 짧고 다정하게 작성해.
    - 교사 말투는 절대 금지야. (~구나, ~했니?, ~인 것 같아 사용)
    `;

    private readonly NUDGE_GUIDES = {
        selfEfficacyXP: "아이의 선택에 '확신'의 언어를 더해줘. (예: 네가 이걸 골랐다니 안목이 멋지구나!)",
        emotionalIQXP: "상황에 맞는 풍부한 감정 단어를 네가 먼저 사용해줘. (예: 내 마음이 솜사탕처럼 포근해져!)",
        logicalFrameXP: "인과관계('때문에', '그래서')를 담은 문장을 먼저 들려줘. (예: 날씨가 추워져서 나무가 잠이 들었나 봐.)",
        socialValueXP: "다른 사람이나 동물의 입장을 헤아리는 말을 섞어줘. (예: 혼자 있을 때 조금 외로웠을 것 같아.)",
        creativeInsightXP: "엉뚱하거나 새로운 가설을 던져봐. (예: 만약 주인공이 구름을 타고 날아간다면 어떨까?)",
    };

    private async getUserStat(userId: string) {
        let stat = await this.prisma.userStat.findUnique({ where: { userId } });
        if (!stat) {
            stat = await this.prisma.userStat.create({ data: { userId } });
        }
        return stat;
    }

    private getLowestCompetency(stat: any): string {
        const competencies = [
            { key: 'selfEfficacyXP', val: stat.selfEfficacyXP },
            { key: 'emotionalIQXP', val: stat.emotionalIQXP },
            { key: 'logicalFrameXP', val: stat.logicalFrameXP },
            { key: 'socialValueXP', val: stat.socialValueXP },
            { key: 'creativeInsightXP', val: stat.creativeInsightXP },
        ];
        return competencies.sort((a, b) => a.val - b.val)[0].key;
    }

    private async getSystemPrompt(userId: string, sentence: string, plot?: string) {
        const stat = await this.getUserStat(userId);
        const lowestKey = this.getLowestCompetency(stat);
        const nudgeInstruction = this.NUDGE_GUIDES[lowestKey];

        return `${this.GEM_FINDER_PERSONA}
        
        # 오늘 대화의 특별 지침 (소프트 너지)
        - 다음 역량이 보완이 필요하므로, 질문을 던지기보다 네가 먼저 다음과 같은 태도로 모델링을 해줘:
        - [보완 목표]: ${nudgeInstruction}

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
                const systemContent = await this.getSystemPrompt(userId, seed.sentence, bookContext);
                const userMessage = `내가 고른 보석(문장)은 이거야: "${seed.sentence}". 
                이 문장에 대해 '생각 동료'로서 첫인사를 다정하게 건네줘. (~했니? ~구나? 말투 사용)`;

                const completion = await this.groq.chat.completions.create({
                    model: 'groq/compound-mini',
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

        // 1. 채팅방 정보 조회 및 유저 메시지 저장
        const room = await this.prisma.chatRoom.findUnique({ where: { id: chatRoomId } });
        if (!room) throw new HttpException('ChatRoom not found', HttpStatus.NOT_FOUND);

        await this.prisma.chatMessage.create({ data: { chatRoomId, sender: 'USER', content } });

        // 2. AI 메시지 생성
        const messages: any[] = [
            {
                role: 'system',
                content: await this.getSystemPrompt(room.userId, sentence, plot) +
                    `\n[추가 지침] 이전의 예시 답변들에 얽매이지 말고, 아이의 최신 대답인 "${content}"에만 집중해서 독창적이고 다정하게 반응해줘.`
            },
            ...history,
            { role: 'user', content }
        ];

        let aiText = "";
        try {
            const completion = await this.groq.chat.completions.create({
                model: 'groq/compound-mini',
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

    async analyzeAndSettleXP(chatRoomId: string) {
        if (!this.groq) return;

        const room = await this.prisma.chatRoom.findUnique({
            where: { id: chatRoomId },
            include: { messages: true, user: true, seed: true }
        });
        if (!room) return;

        // 아이의 메시지만 추출
        const userMessages = room.messages
            .filter(m => m.sender === 'USER')
            .map(m => m.content)
            .join('\n');

        if (!userMessages) return;

        const analysisPrompt = `
        다음은 아이가 AI와 나눈 대화 내용이야. 이 대화를 바탕으로 아이의 5가지 역량(5-Tool)을 분석해서 점수를 매겨줘.
        
        # 분석 대상 대화:
        "${userMessages}"

        # 분석 기준 (5-Tool):
        1. selfEfficacyXP (자아): 자신의 생각에 확신을 가졌는가?
        2. emotionalIQXP (감정): 마음을 풍부하게 표현했는가?
        3. logicalFrameXP (논리): 원인과 결과를 연결했는가?
        4. socialValueXP (사회): 타인의 입장을 헤아렸는가?
        5. creativeInsightXP (창의): 새로운 상상을 했는가?

        # 결과 형식 (반드시 JSON으로만 답변해):
        {
            "analysis": [
                {
                    "category": "selfEfficacyXP",
                    "increment": 0~5,
                    "evidence": "아이의 실제 대답 중 가장 핵심적인 짧은 문구 (예: '내가 할 수 있어요')",
                    "reason": "왜 이 점수를 줬는지 부모님께 드리는 짧은 설명"
                },
                ... (나머지 4개 영역도 동일하게 포함)
            ],
            "overallComment": "부모님께 전달할 이번 활동 총평 (한 문장)"
        }
        `;

        try {
            const completion = await this.groq.chat.completions.create({
                model: 'groq/compound-mini',
                messages: [{ role: 'user', content: analysisPrompt }],
                response_format: { type: 'json_object' }
            });

            const resultData = JSON.parse(completion.choices[0]?.message?.content || "{}");
            const analysis = resultData.analysis || [];

            // 1. 유저 통계 업데이트 (누적 점수)
            const updateData: any = {};
            for (const item of analysis) {
                if (item.increment > 0) {
                    updateData[item.category] = { increment: item.increment };
                }
            }

            if (Object.keys(updateData).length > 0) {
                await this.prisma.userStat.update({
                    where: { userId: room.userId },
                    data: updateData
                });
            }

            // 2. 상세 로그 기록 (어떤 책에서 어떤 말을 했는지)
            for (const item of analysis) {
                if (item.increment > 0) {
                    await (this.prisma as any).userStatLog.create({
                        data: {
                            userId: room.userId,
                            category: item.category,
                            increment: item.increment,
                            evidence: item.evidence,
                            reason: item.reason,
                            bookTitle: room.seed?.bookTitle || '알 수 없는 책',
                        }
                    });
                }
            }

            // 3. TreeState 업데이트 (기능 보존을 위해 유지하되, 나중에 제거 가능)
            const stat = await this.prisma.userStat.findUnique({ where: { userId: room.userId } });
            if (stat) {
                await this.prisma.treeState.upsert({
                    where: { userId: room.userId },
                    create: {
                        userId: room.userId,
                        trunkWidth: 1.0 + (stat.selfEfficacyXP / 100),
                        leafDensity: 0.1 + (stat.emotionalIQXP / 500),
                        branchLength: 0.5 + (stat.logicalFrameXP / 200),
                        soilHealth: 1.0 + (stat.socialValueXP / 300),
                        flowerCount: Math.floor(stat.creativeInsightXP / 10),
                    },
                    update: {
                        trunkWidth: 1.0 + (stat.selfEfficacyXP / 100),
                        leafDensity: 0.1 + (stat.emotionalIQXP / 500),
                        branchLength: 0.5 + (stat.logicalFrameXP / 200),
                        soilHealth: 1.0 + (stat.socialValueXP / 300),
                        flowerCount: Math.floor(stat.creativeInsightXP / 10),
                    }
                });
            }

            return resultData;
        } catch (error) {
            console.error('Analysis Error:', error);
        }
    }

    async getUserStats(userId: string) {
        return this.getUserStat(userId);
    }

    async getUserStatsLog(userId: string) {
        return (this.prisma as any).userStatLog.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: 20
        });
    }

    async getTreeState(userId: string) {
        let tree = await this.prisma.treeState.findUnique({ where: { userId } });
        if (!tree) {
            tree = await this.prisma.treeState.create({ data: { userId } });
        }
        return tree;
    }

    private getMockResponse() {
        return { content: "네 생각이 반짝반짝 빛나고 있어! 더 이야기해줄래?", sender: 'AI', createdAt: new Date() };
    }
}
