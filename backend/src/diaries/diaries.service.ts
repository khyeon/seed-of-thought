import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import Groq from 'groq-sdk';
import { ChatService } from '../chat/chat.service';

@Injectable()
export class DiariesService {
    private groq: Groq;

    constructor(
        private prisma: PrismaService,
        private chatService: ChatService
    ) {
        if (process.env.GROQ_API_KEY) {
            this.groq = new Groq({
                apiKey: process.env.GROQ_API_KEY,
            });
        }
    }

    async generateDraft(chatRoomId: string) {
        const chatRoom = await this.prisma.chatRoom.findUnique({
            where: { id: chatRoomId },
            include: {
                seed: true,
                messages: {
                    orderBy: { createdAt: 'asc' },
                },
            },
        });

        if (!chatRoom) {
            throw new HttpException('Chat room not found', HttpStatus.NOT_FOUND);
        }

        if (!this.groq) {
            return this.getMockDraft(chatRoom);
        }

        const conversation = chatRoom.messages
            .map((msg) => `${msg.sender}: ${msg.content}`)
            .join('\n');

        const prompt = `
      지금까지의 대화 내용을 분석해서, 아이가 스스로 일기를 쓸 수 있도록 돕는 키워드를 추출해줘.
      일기의 본문(content)은 아이가 직접 쓸 것이므로 빈 문자열로 남겨둬.
      대신, 대화에서 나온 가장 중요한 단어들을 아래 두 가지 범주로 나누어 추출해줘:
      1) 객관적 사실(Fact): 책 내용, 등장인물, 줄거리, 사건 등 (3~4개)
      2) 주관적 생각(Insight): 감정, 깨달음, 다짐, 느낀점 등 (3~4개)
      *모든 키워드는 조사(은,는,이,가 등)를 제외한 5글자 이하의 '명사' 형태로만 작성해.*
      
      [대화 내용]
      ${conversation}
      
      [결과 형식 (JSON)]
      반드시 아래와 같은 JSON 형식으로만 응답해줘. 다른 설명은 하지 마:
      {
        "content": "",
        "emotion": "대표 감정 (기쁨, 슬픔, 깨달음, 신기함 중 하나)",
        "factKeywords": ["키워드1", "키워드2"],
        "insightKeywords": ["키워드3", "키워드4"],
        "summary": "부모님을 위한 1문장 요약"
      }
    `;

        try {
            const completion = await this.groq.chat.completions.create({
                messages: [
                    { role: 'system', content: '너는 아이의 일기 작성을 도와주는 AI 전문가야. 반드시 JSON 형식으로만 응답해야 해.' },
                    { role: 'user', content: prompt }
                ],
                model: 'groq/compound',
                response_format: { type: 'json_object' },
                temperature: 0.6,
            });

            const responseText = completion.choices[0]?.message?.content || "{}";
            const parsed = JSON.parse(responseText);
            return {
                ...parsed,
                messages: chatRoom.messages || [],
            };
        } catch (error) {
            console.error('Groq Diary Generation Error:', error);
            return this.getMockDraft(chatRoom);
        }
    }

    private getMockDraft(chatRoom: any) {
        const bookTitle = chatRoom.seed.bookTitle;
        const sentence = chatRoom.seed.sentence;
        return {
            content: "",
            emotion: "깨달음",
            factKeywords: [bookTitle, "문장", "책"],
            insightKeywords: ["소중함", "생각", "다짐"],
            summary: "아이가 책 속 문장을 통해 주변의 소중함을 다시 한번 생각해보는 뜻깊은 시간을 가졌습니다.",
            messages: chatRoom.messages || [],
        };
    }

    async saveDiary(data: {
        userId: string;
        chatRoomId: string;
        content: string;
        emotion?: string;
        keywords?: string[];
        summary?: string;
        imageUrl?: string;
    }) {
        console.log('DiariesService.saveDiary: Start', data.chatRoomId);

        const user = await this.prisma.user.findUnique({
            where: { id: data.userId },
        });

        if (!user) {
            throw new HttpException('User not found', HttpStatus.NOT_FOUND);
        }

        const existing = await this.prisma.diary.findUnique({
            where: { chatRoomId: data.chatRoomId },
        });

        if (existing) {
            return this.prisma.diary.update({
                where: { chatRoomId: data.chatRoomId },
                data: {
                    content: data.content,
                    emotion: data.emotion,
                    keywords: data.keywords ? JSON.stringify(data.keywords) : null,
                    summary: data.summary,
                    imageUrl: data.imageUrl,
                } as any,
            });
        }

        const diary = await this.prisma.diary.create({
            data: {
                userId: data.userId,
                chatRoomId: data.chatRoomId,
                content: data.content,
                emotion: data.emotion,
                keywords: data.keywords ? JSON.stringify(data.keywords) : null,
                summary: data.summary,
                imageUrl: data.imageUrl,
            } as any,
        });

        // 4. 대화 사후 분석 (비동기로 실행하여 응답 속도 유지)
        this.chatService.analyzeAndSettleXP(data.chatRoomId).catch(err => {
            console.error('Error in post-analysis after diary save:', err);
        });

        return diary;
    }

    async getDiariesByUser(userId: string, bookTitle?: string) {
        const where: any = { userId };
        if (bookTitle) {
            where.chatRoom = {
                seed: {
                    bookTitle: bookTitle,
                },
            };
        }
        return this.prisma.diary.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            include: {
                chatRoom: {
                    include: {
                        seed: true,
                        messages: {
                            orderBy: { createdAt: 'asc' },
                        },
                    },
                },
            },
        });
    }

    async getFamilyMembers(userId: string) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: { family: { include: { members: true } } },
        });

        if (!user || !user.family) return [];

        return user.family.members.filter(m => m.id !== userId);
    }

    async getReport(userId: string, requestedByUserId?: string, year?: number, month?: number) {
        if (requestedByUserId && requestedByUserId !== userId) {
            const requester = await this.prisma.user.findUnique({ where: { id: requestedByUserId } });
            const target = await this.prisma.user.findUnique({ where: { id: userId } });

            if (requester?.role !== 'PARENT' || requester.familyId !== target?.familyId) {
                throw new HttpException('자녀의 리포트만 볼 수 있습니다.', HttpStatus.FORBIDDEN);
            }
        }

        const where: any = { userId };

        if (year && month) {
            const startDate = new Date(year, month - 1, 1);
            const endDate = new Date(year, month, 0, 23, 59, 59, 999);
            where.createdAt = {
                gte: startDate,
                lte: endDate,
            };
        }

        const diaries = await this.prisma.diary.findMany({
            where,
            select: {
                emotion: true,
                keywords: true,
                summary: true,
                createdAt: true,
            },
            orderBy: { createdAt: 'desc' },
        });

        const keywordMap = new Map<string, number>();
        const emotionMap = new Map<string, number>();

        diaries.forEach((d) => {
            const keywords = d.keywords ? JSON.parse(d.keywords) : [];
            keywords.forEach((kw: string) => {
                keywordMap.set(kw, (keywordMap.get(kw) || 0) + 1);
            });
            if (d.emotion) {
                emotionMap.set(d.emotion, (emotionMap.get(d.emotion) || 0) + 1);
            }
        });

        const topKeywords = Array.from(keywordMap.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([text, value]) => ({ text, value }));

        const emotionStats = Array.from(emotionMap.entries()).map(([name, count]) => ({
            name,
            count,
        }));

        return {
            totalDiaries: diaries.length,
            topKeywords,
            emotionStats,
            recentSummary: diaries[0]?.summary || '아직 작성된 일기가 없어요.',
        };
    }
}
