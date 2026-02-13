import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { ChatService } from './chat.service';

@Controller('chat')
export class ChatController {
    constructor(private readonly chatService: ChatService) { }

    @Post('start')
    async startChat(@Body() body: { userId: string; seedId: string }) {
        return this.chatService.startConversation(body.userId, body.seedId);
    }

    @Post(':id/message')
    async sendMessage(
        @Param('id') chatRoomId: string,
        @Body() body: { message: string },
    ) {
        return this.chatService.sendMessage(chatRoomId, body.message);
    }
}
