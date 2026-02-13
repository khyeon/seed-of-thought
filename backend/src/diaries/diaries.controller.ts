import { Controller, Post, Body, Get, Param, Query } from '@nestjs/common';
import { DiariesService } from './diaries.service';

@Controller('diaries')
export class DiariesController {
    constructor(private readonly diariesService: DiariesService) { }

    @Get('draft/:chatRoomId')
    async getDraft(@Param('chatRoomId') chatRoomId: string) {
        return this.diariesService.generateDraft(chatRoomId);
    }

    @Post()
    async save(@Body() body: any) {
        console.log('DiariesController: save called with body keys:', Object.keys(body));
        return this.diariesService.saveDiary(body);
    }

    @Get()
    async findAll(@Query('userId') userId: string) {
        return this.diariesService.getDiariesByUser(userId);
    }

    @Get('report')
    async getReport(
        @Query('userId') userId: string,
        @Query('requesterId') requesterId?: string,
        @Query('year') year?: string,
        @Query('month') month?: string,
    ) {
        return this.diariesService.getReport(
            userId,
            requesterId,
            year ? parseInt(year) : undefined,
            month ? parseInt(month) : undefined
        );
    }

    @Get('family/members')
    async getFamilyMembers(@Query('userId') userId: string) {
        return this.diariesService.getFamilyMembers(userId);
    }
}
