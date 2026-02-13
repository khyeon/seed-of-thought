import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SeedsService {
    constructor(private prisma: PrismaService) { }

    async createSeed(data: {
        userId: string;
        bookTitle: string;
        author?: string;
        coverImage?: string;
        sentence: string;
        inputType: 'MANUAL' | 'OCR';
    }) {
        return this.prisma.seed.create({
            data: {
                userId: data.userId,
                bookTitle: data.bookTitle,
                author: data.author,
                coverImage: data.coverImage,
                sentence: data.sentence,
                inputType: data.inputType,
            },
        });
    }

    async getSeedsByUser(userId: string) {
        return this.prisma.seed.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
        });
    }
}
