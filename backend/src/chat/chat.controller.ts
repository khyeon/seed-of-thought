import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { ChatService } from './chat.service';

@Controller('chat')
export class ChatController {
    constructor(private readonly chatService: ChatService) { }

    @Post('start')
    async startChat(@Body() body: { userId: string; seedId: string; bookContext?: string }) {
        return this.chatService.startConversation(body.userId, body.seedId, body.bookContext);
    }

    @Post(':id/message')
    async sendMessage(
        @Param('id') chatRoomId: string,
        @Body() body: { message: string, history: any[], sentence: string, plot?: string },
    ) {
        return this.chatService.sendMessage(
            chatRoomId,
            body.message,
            body.history,
            body.sentence,
            body.plot
        );
    }

    @Get('stats/:userId')
    async getStats(@Param('userId') userId: string) {
        return this.chatService.getUserStats(userId);
    }

    @Get('stats/:userId/log')
    async getStatsLog(@Param('userId') userId: string) {
        return this.chatService.getUserStatsLog(userId);
    }

    @Get('tree/:userId')
    async getTreeState(@Param('userId') userId: string) {
        return this.chatService.getTreeState(userId);
    }
}
