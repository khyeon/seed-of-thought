import { Controller, Post, Body, Get, Query, Patch, Param } from '@nestjs/common';
import { UserBooksService } from './user-books.service';

@Controller('user-books')
export class UserBooksController {
    constructor(private readonly userBooksService: UserBooksService) { }

    @Post()
    async create(@Body() body: { userId: string; bookTitle: string; author?: string; coverImage?: string; summary?: string }) {
        return this.userBooksService.addBook(body.userId, body);
    }

    @Get('counts')
    async getCounts(@Query('userId') userId: string) {
        return this.userBooksService.getCounts(userId);
    }

    @Get('stats')
    async getMonthlyStats(@Query('userId') userId: string) {
        return this.userBooksService.getMonthlyStats(userId);
    }

    @Get()
    async findAll(@Query('userId') userId: string, @Query('status') status: string) {
        return this.userBooksService.getBooksByStatus(userId, status);
    }

    @Patch(':id/status')
    async updateStatus(@Param('id') id: string, @Body('status') status: string) {
        return this.userBooksService.updateStatus(id, status);
    }
}
