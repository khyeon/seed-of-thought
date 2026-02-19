import { Module } from '@nestjs/common';
import { UserBooksService } from './user-books.service';
import { UserBooksController } from './user-books.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [UserBooksController],
    providers: [UserBooksService],
    exports: [UserBooksService],
})
export class UserBooksModule { }
