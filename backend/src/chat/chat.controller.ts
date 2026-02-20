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
}
