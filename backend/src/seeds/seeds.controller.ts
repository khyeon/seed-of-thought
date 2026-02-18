import { Controller, Post, Body, Get, Query } from '@nestjs/common';
import { SeedsService } from './seeds.service';

@Controller('seeds')
export class SeedsController {
    constructor(private readonly seedsService: SeedsService) { }

    @Post()
    async create(@Body() body: any) {
        console.log('SeedsController.create called with:', JSON.stringify(body));
        try {
            const result = await this.seedsService.createSeed(body);
            console.log('SeedsController.create success:', result.id);
            return result;
        } catch (error) {
            console.error('SeedsController.create error:', error);
            throw error;
        }
    }

    @Get()
    async findAll(@Query('userId') userId: string) {
        return this.seedsService.getSeedsByUser(userId);
    }
}
