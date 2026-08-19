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

            [기능 설명: 의미 덩어리(Semantic Chunk) 그룹화]
            * 문장 하나하나를 따로 보지 말고, 의미나 화제가 연결되어 같이 쓰인 2~3개의 문장들을 하나의 덩어리로 묶어서 분석하십시오.
            * 일기 내용 전체가 하나의 흐름일 경우, 전체 일기(모든 문장)를 1개의 덩어리로 묶는 것도 허용합니다.
            * 만약 일기에 마침표(., !, ?)가 전혀 없거나 거의 없는 경우에도 문맥에 따라 어색한 의미 구문 덩어리를 추출하고 startSentenceIndex와 endSentenceIndex를 모두 0으로 반환하십시오.

            위 일기 중 다음 2가지 유형 중 하나에 해당하는 의미 덩어리들을 추출하십시오.
            1. CONTEXT: 행동이나 감정의 이유/배경이 빠져서 이해하기 어려운 덩어리.
            2. LOGIC: 인과 관계가 비약되어 어색한 덩어리.

            *주의: 어색하지 않은 문장이나 덩어리는 결과 리스트에 포함하지 마십시오.
            *조건: 아이에게 지적이나 지시조의 피드백을 주지 마세요. 아주 친절하고 칭찬을 가미해 말하세요.

            반드시 아래와 같은 JSON 형식으로만 응답해야 합니다. 다른 텍스트는 포함하지 마십시오:
            {
              "items": [
                {
                  "startSentenceIndex": 0,
                  "endSentenceIndex": 2,
                  "originalSentence": "오늘 축구를 했다. 너무 신났다. 골을 넣었다.",
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
                    model: 'groq/compound-mini',
                    response_format: { type: 'json_object' },
                    temperature: 0.5,
                });

                const responseText = completion.choices[0]?.message?.content || "{}";
                const parsed = JSON.parse(responseText);

                if (parsed.items && Array.isArray(parsed.items)) {
                    for (const item of parsed.items) {
                        const startIdx = parseInt(item.startSentenceIndex);
                        const endIdx = parseInt(item.endSentenceIndex);
                        
                        if (isNaN(startIdx) || startIdx < 0 || startIdx >= sentences.length) continue;
                        const safeEndIdx = isNaN(endIdx) ? startIdx : Math.min(Math.max(startIdx, endIdx), sentences.length - 1);

                        // If it is multi-sentence range, originalSentence should cover all of them
                        let finalOriginalText = item.originalSentence;
                        if (sentences.length > 1 && startIdx !== safeEndIdx) {
                            finalOriginalText = sentences.slice(startIdx, safeEndIdx + 1).join(' ');
                        }

                        const createdItem = await this.prisma.diaryCorrectionItem.create({
                            data: {
                                correctionId: correction.id,
                                sentenceIndex: startIdx,
                                endSentenceIndex: safeEndIdx,
                                originalSentence: finalOriginalText || sentences[startIdx],
                                correctionType: item.correctionType || 'CONTEXT',
                                issueDescription: item.issueDescription || '이 부분을 조금 더 다듬어 볼까?',
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

        // Fallback dummy item creation
        if (items.length === 0) {
            const lastIdx = sentences.length - 1;
            if (lastIdx >= 0) {
                const fallbackItem = await this.prisma.diaryCorrectionItem.create({
                    data: {
                        correctionId: correction.id,
                        sentenceIndex: 0,
                        endSentenceIndex: lastIdx,
                        originalSentence: diary.content,
                        correctionType: 'CONTEXT',
                        issueDescription: '이 글에 네 생각이나 감정을 조금만 더 자세히 써볼까?',
                        aiQuestion: '이때 어떤 기분이었는지 이야기해 줘!',
                        aiSuggestions: JSON.stringify([
                            `${diary.content.trim()} 왜냐하면 정말 뜻깊은 날이었기 때문이다.`,
                            `${diary.content.trim()} 다음에도 꼭 다시 해보고 싶다.`
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
                endSentenceIndex: data.sentenceIndex, // Default end to start index
                originalSentence: data.originalSentence,
                correctionType: 'MANUAL',
                issueDescription: '이 부분을 우리가 직접 다듬어 보기로 지정했어요.',
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
        let correctedContent = correction.originalContent;

        if (sentences.length <= 1) {
            // Case 1: Diary has no periods/sentences. Use substring replacement.
            correction.items.forEach(item => {
                if (item.status === 'RESOLVED' && item.correctedSentence) {
                    if (correctedContent.includes(item.originalSentence)) {
                        correctedContent = correctedContent.replace(item.originalSentence, item.correctedSentence);
                    } else {
                        // Hard replace if it's the entire content
                        correctedContent = item.correctedSentence;
                    }
                }
            });
        } else {
            // Case 2: Use index-range replacements.
            const resolvedMap = new Map<number, { end: number; text: string }>();
            correction.items.forEach(item => {
                if (item.status === 'RESOLVED' && item.correctedSentence) {
                    const endIdx = item.endSentenceIndex !== null ? item.endSentenceIndex : item.sentenceIndex;
                    resolvedMap.set(item.sentenceIndex, { end: endIdx, text: item.correctedSentence });
                }
            });

            const finalSentences: string[] = [];
            let skipUntil = -1;

            for (let i = 0; i < sentences.length; i++) {
                if (i <= skipUntil) {
                    continue;
                }
                if (resolvedMap.has(i)) {
                    const corr = resolvedMap.get(i)!;
                    finalSentences.push(corr.text);
                    skipUntil = corr.end;
                } else {
                    finalSentences.push(sentences[i]);
                }
            }
            correctedContent = finalSentences.join(' ');
        }

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
                    model: 'groq/compound-mini',
                    temperature: 0.7,
                });
                aiReport = completion.choices[0]?.message?.content || aiReport;
            } catch (error) {
                console.error('Groq Settle Settle Report Error:', error);
            }
        }

        // Update core Diary
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
