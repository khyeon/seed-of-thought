import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { BooksModule } from './books/books.module';
import { OcrModule } from './ocr/ocr.module';
import { ChatModule } from './chat/chat.module';
import { SeedsModule } from './seeds/seeds.module';
import { DiariesModule } from './diaries/diaries.module';
import { UserBooksModule } from './user-books/user-books.module';

@Module({
  imports: [AuthModule, PrismaModule, BooksModule, OcrModule, ChatModule, SeedsModule, DiariesModule, UserBooksModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
