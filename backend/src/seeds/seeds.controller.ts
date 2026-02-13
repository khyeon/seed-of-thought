import { Controller, Post, Body, Get, Query } from '@nestjs/common';
import { SeedsService } from './seeds.service';

@Controller('seeds')
export class SeedsController {
    constructor(private readonly seedsService: SeedsService) { }

    @Post()
    async create(@Body() body: any) {
        return this.seedsService.createSeed(body);
    }

    @Get()
    async findAll(@Query('userId') userId: string) {
        return this.seedsService.getSeedsByUser(userId);
    }
}
