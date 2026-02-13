import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import Groq from 'groq-sdk';

@Injectable()
export class DiariesService {
    private groq: Groq;

    constructor(private prisma: PrismaService) {
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
      아래의 대화 내용을 바탕으로 아이가 쓴 것처럼 자연스러운 일기 3~5문장을 만들어줘.
      중요한 점은 아이의 감정과 생각이 잘 드러나야 한다는 거야.
      
      [대화 내용]
      ${conversation}
      
      [결과 형식 (JSON)]
      반드시 아래와 같은 JSON 형식으로만 응답해줘. 다른 설명은 하지 마:
      {
        "content": "일기 내용",
        "emotion": "대표 감정 (기쁨, 슬픔, 깨달음, 신기함 중 하나)",
        "keywords": ["키워드1", "키워드2", "키워드3"],
        "summary": "부모님을 위한 1문장 요약"
      }
    `;

        try {
            const completion = await this.groq.chat.completions.create({
                messages: [
                    { role: 'system', content: '너는 아이의 일기 작성을 도와주는 AI 전문가야. 반드시 JSON 형식으로만 응답해야 해.' },
                    { role: 'user', content: prompt }
                ],
                model: 'llama-3.1-8b-instant',
                response_format: { type: 'json_object' },
                temperature: 0.6,
            });

            const responseText = completion.choices[0]?.message?.content || "{}";
            return JSON.parse(responseText);
        } catch (error) {
            console.error('Groq Diary Generation Error:', error);
            return this.getMockDraft(chatRoom);
        }
    }

    private getMockDraft(chatRoom: any) {
        const bookTitle = chatRoom.seed.bookTitle;
        const sentence = chatRoom.seed.sentence;
        return {
            content: `오늘은 '${bookTitle}'을(를) 읽고 이야기를 나눴어. "${sentence}"라는 문장이 가장 기억에 남았는데, 평소에 소중한 걸 잊고 살았던 건 아닌지 생각해보게 됐어. 앞으로는 내 주변의 소중한 것들을 더 아껴줘야지!`,
            emotion: "깨달음",
            keywords: [bookTitle, "소중함", "생각"],
            summary: "아이가 책 속 문장을 통해 주변의 소중함을 다시 한번 생각해보는 뜻깊은 시간을 가졌습니다."
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

        return this.prisma.diary.create({
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
    }

    async getDiariesByUser(userId: string) {
        return this.prisma.diary.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            include: {
                chatRoom: {
                    include: { seed: true },
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
