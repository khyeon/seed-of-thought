import { Controller, Get, Query } from '@nestjs/common';
import { BooksService } from './books.service';

@Controller('books')
export class BooksController {
    constructor(private readonly booksService: BooksService) { }

    @Get('search')
    async search(@Query('query') query: string) {
        return this.booksService.search(query);
    }
}
