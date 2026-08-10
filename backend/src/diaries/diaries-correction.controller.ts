import { Controller, Post, Body, Get, Param, Patch } from '@nestjs/common';
import { DiariesCorrectionService } from './diaries-correction.service';

@Controller('diaries/:diaryId/correction')
export class DiariesCorrectionController {
    constructor(private readonly correctionService: DiariesCorrectionService) {}

    @Post('analyze')
    async analyze(@Param('diaryId') diaryId: string) {
        return this.correctionService.analyzeDiary(diaryId);
    }

    @Post('manual')
    async addManual(
        @Param('diaryId') diaryId: string,
        @Body() body: { sentenceIndex: number; originalSentence: string; userHint: string }
    ) {
        return this.correctionService.addManualCorrection(diaryId, body);
    }

    @Get()
    async get(@Param('diaryId') diaryId: string) {
        return this.correctionService.getCorrection(diaryId);
    }

    @Patch('items/:itemId')
    async updateItem(
        @Param('itemId') itemId: string,
        @Body() body: { correctedSentence: string; status: 'RESOLVED' | 'SKIPPED' }
    ) {
        return this.correctionService.updateCorrectionItem(itemId, body);
    }

    @Post('complete')
    async complete(@Param('diaryId') diaryId: string) {
        return this.correctionService.completeCorrection(diaryId);
    }
}
