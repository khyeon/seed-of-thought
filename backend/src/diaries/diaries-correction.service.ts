import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import Groq from 'groq-sdk';

@Injectable()
export class DiariesCorrectionService {
    private groq: Groq;

    constructor(private prisma: PrismaService) {
        if (process.env.GROQ_API_KEY) {
            this.groq = new Groq({
                apiKey: process.env.GROQ_API_KEY,
            });
        }
    }

    // Helper to split text into sentences
    private splitIntoSentences(text: string): string[] {
        if (!text) return [];
        // Matches sentences ending with . ! or ?
        const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
        return sentences.map(s => s.trim()).filter(Boolean);
    }

    async analyzeDiary(diaryId: string) {
        const diary = await this.prisma.diary.findUnique({
            where: { id: diaryId },
        });

        if (!diary) {
            throw new HttpException('Diary not found', HttpStatus.NOT_FOUND);
        }

        // Check if analysis already exists
        const existing = await this.prisma.diaryCorrection.findUnique({
            where: { diaryId },
            include: { items: true },
        });

        if (existing) {
            return existing;
        }

        const sentences = this.splitIntoSentences(diary.content);

        // Create initial correction entry
        const correction = await this.prisma.diaryCorrection.create({
            data: {
                diaryId: diary.id,
                originalContent: diary.content,
                status: 'PENDING',
            },
        });

        if (sentences.length === 0) {
            return correction;
        }

        let items: any[] = [];

        if (this.groq && sentences.length > 0) {
            const sentenceListStr = sentences
                .map((s, index) => `[인덱스 ${index}] ${s}`)
                .join('\n');

            const prompt = `
            목적: 초등학생이 쓴 일기를 분석하여 문맥이나 논리상 어색한 부분을 교정합니다. 맞춤법(스펠링)이나 단순 띄어쓰기 오류는 무시하고 절대 분석 결과에 포함하지 마십시오.
            전체 일기 내용:
            ${diary.content}

            분석할 문장 리스트:
            ${sentenceListStr}

            위 문장 중 다음 2가지 유형 중 하나에 해당하는 문장들을 추출하십시오.
            1. CONTEXT: 행동이나 감정의 이유/배경이 빠져서 이해하기 어려운 문장.
            2. LOGIC: 인과 관계가 비약되어 어색한 문장.

            *주의: 어색하지 않은 문장은 결과 리스트에 포함하지 마십시오.
            *조건: 아이에게 지적이나 지시조의 피드백을 주지 마세요. 아주 친절하고 칭찬을 가미해 말하세요.

            반드시 아래와 같은 JSON 형식으로만 응답해야 합니다. 다른 텍스트는 포함하지 마십시오:
            {
              "items": [
                {
                  "sentenceIndex": 0,
                  "originalSentence": "문장 내용",
                  "correctionType": "CONTEXT 또는 LOGIC",
                  "issueDescription": "아이 눈높이에서의 친절한 피드백 (예: '~해서 이해하기 조금 어려워요')",
                  "aiQuestion": "아이의 생각을 확장해 주는 다정한 질문 (예: '왜 그렇게 생각했어?')",
                  "aiSuggestions": ["추천 예시 문장 1", "추천 예시 문장 2"]
                }
              ]
            }
            `;

            try {
                const completion = await this.groq.chat.completions.create({
                    messages: [
                        { role: 'system', content: '너는 초등학생 글쓰기 지도 전문 교사야. 반드시 JSON 형식으로만 응답해야 해.' },
                        { role: 'user', content: prompt }
                    ],
                    model: 'llama-3.1-8b-instant',
                    response_format: { type: 'json_object' },
                    temperature: 0.5,
                });

                const responseText = completion.choices[0]?.message?.content || "{}";
                const parsed = JSON.parse(responseText);

                if (parsed.items && Array.isArray(parsed.items)) {
                    for (const item of parsed.items) {
                        const sIdx = parseInt(item.sentenceIndex);
                        if (isNaN(sIdx) || sIdx < 0 || sIdx >= sentences.length) continue;

                        const createdItem = await this.prisma.diaryCorrectionItem.create({
                            data: {
                                correctionId: correction.id,
                                sentenceIndex: sIdx,
                                originalSentence: sentences[sIdx],
                                correctionType: item.correctionType || 'CONTEXT',
                                issueDescription: item.issueDescription || '이 문장을 조금 더 다듬어 볼까?',
                                aiQuestion: item.aiQuestion || '어떤 일이 더 있었는지 적어보자.',
                                aiSuggestions: JSON.stringify(item.aiSuggestions || []),
                                status: 'PENDING',
                            },
                        });
                        items.push(createdItem);
                    }
                }
            } catch (error) {
                console.error('Groq Diary Analysis Error:', error);
            }
        }

        // If no AI items were created (e.g. mock or Groq failure/none found)
        if (items.length === 0) {
            // Create at least one dummy/guided item for testing or fallback
            // Let's create a CONTEXT item for the last sentence if there's any
            const lastIdx = sentences.length - 1;
            if (lastIdx >= 0) {
                const fallbackItem = await this.prisma.diaryCorrectionItem.create({
                    data: {
                        correctionId: correction.id,
                        sentenceIndex: lastIdx,
                        originalSentence: sentences[lastIdx],
                        correctionType: 'CONTEXT',
                        issueDescription: '이 문장에 네 마음이나 있었던 일의 이유를 더 써볼까?',
                        aiQuestion: '이때 어떤 기분이었어? 한 번 더 이야기해 줘!',
                        aiSuggestions: JSON.stringify([
                            `${sentences[lastIdx].replace(/[.!?]/g, '')} 왜냐하면 정말 즐거웠기 때문이다.`,
                            `${sentences[lastIdx].replace(/[.!?]/g, '')} 느낌이 너무 신기했다.`
                        ]),
                        status: 'PENDING',
                    },
                });
                items.push(fallbackItem);
            }
        }

        return {
            ...correction,
            items,
        };
    }

    async addManualCorrection(diaryId: string, data: { sentenceIndex: number; originalSentence: string; userHint: string }) {
        const correction = await this.prisma.diaryCorrection.findUnique({
            where: { diaryId },
        });

        if (!correction) {
            throw new HttpException('Correction entry not found. Run analyze first.', HttpStatus.NOT_FOUND);
        }

        return this.prisma.diaryCorrectionItem.create({
            data: {
                correctionId: correction.id,
                sentenceIndex: data.sentenceIndex,
                originalSentence: data.originalSentence,
                correctionType: 'MANUAL',
                issueDescription: '이 문장을 우리가 직접 다듬어 보기로 지정했어요.',
                aiQuestion: data.userHint || '이 문장을 어떻게 바꾸고 싶은가요?',
                aiSuggestions: JSON.stringify([]),
                userHint: data.userHint,
                status: 'PENDING',
            },
        });
    }

    async getCorrection(diaryId: string) {
        const correction = await this.prisma.diaryCorrection.findUnique({
            where: { diaryId },
            include: {
                items: {
                    orderBy: { sentenceIndex: 'asc' },
                },
            },
        });

        if (!correction) {
            throw new HttpException('Correction not found', HttpStatus.NOT_FOUND);
        }

        return correction;
    }

    async updateCorrectionItem(itemId: string, data: { correctedSentence: string; status: 'RESOLVED' | 'SKIPPED' }) {
        return this.prisma.diaryCorrectionItem.update({
            where: { id: itemId },
            data: {
                correctedSentence: data.status === 'RESOLVED' ? data.correctedSentence : null,
                status: data.status,
            },
        });
    }

    async completeCorrection(diaryId: string) {
        const correction = await this.prisma.diaryCorrection.findUnique({
            where: { diaryId },
            include: { items: true },
        });

        if (!correction) {
            throw new HttpException('Correction not found', HttpStatus.NOT_FOUND);
        }

        const sentences = this.splitIntoSentences(correction.originalContent);

        // Map corrected sentences back
        const resolvedItemsMap = new Map<number, string>();
        correction.items.forEach(item => {
            if (item.status === 'RESOLVED' && item.correctedSentence) {
                resolvedItemsMap.set(item.sentenceIndex, item.correctedSentence);
            }
        });

        const finalSentences = sentences.map((s, index) => {
            if (resolvedItemsMap.has(index)) {
                return resolvedItemsMap.get(index)!;
            }
            return s;
        });

        const correctedContent = finalSentences.join(' ');

        // Generate AI report using Groq
        let aiReport = '일기가 더 다채롭고 생각이 풍부하게 완성되었어요! 훌륭합니다. 🌟';
        if (this.groq) {
            const prompt = `
            역할: 초등학생 글쓰기 지도 전문 교사
            일기 원문:
            ${correction.originalContent}

            최종 수정된 일기:
            ${correctedContent}

            위 일기의 변화를 보고 아이를 아낌없이 격려하고 칭찬하는 AI 성찰/칭찬 리포트를 작성하세요.
            - 아이가 생각을 더하고 다듬는 과정을 거쳐 일기가 어떻게 더 멋지게 변했는지 친절하고 다정하게 적어주세요.
            - 리포트는 아이가 쉽게 이해할 수 있는 어조의 한글 문장 3~4줄로 친근하게 작성해 주세요 (예: "~했구나! 정말 대단해!").
            `;

            try {
                const completion = await this.groq.chat.completions.create({
                    messages: [
                        { role: 'system', content: '너는 다정하게 아이를 칭찬하고 격려해 주는 초등학생 독서 상담 교사야.' },
                        { role: 'user', content: prompt }
                    ],
                    model: 'llama-3.1-8b-instant',
                    temperature: 0.7,
                });
                aiReport = completion.choices[0]?.message?.content || aiReport;
            } catch (error) {
                console.error('Groq Settle Settle Report Error:', error);
            }
        }

        // Update the core Diary model's content to the new corrected version as well
        // to maintain backward compatibility, and store the revision status.
        await this.prisma.diary.update({
            where: { id: diaryId },
            data: { content: correctedContent },
        });

        return this.prisma.diaryCorrection.update({
            where: { diaryId },
            data: {
                correctedContent,
                aiReport,
                status: 'COMPLETED',
            },
            include: { items: true },
        });
    }
}
