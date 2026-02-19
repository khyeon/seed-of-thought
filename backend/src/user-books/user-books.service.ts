import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UserBooksService {
    constructor(private prisma: PrismaService) { }

    async addBook(userId: string, bookData: any) {
        return this.prisma.userBook.upsert({
            where: {
                userId_bookTitle: {
                    userId,
                    bookTitle: bookData.bookTitle,
                },
            },
            update: {
                status: 'READING',
            },
            create: {
                userId,
                bookTitle: bookData.bookTitle,
                author: bookData.author,
                coverImage: bookData.coverImage,
                summary: bookData.summary,
                status: 'READING',
            },
        });
    }

    async getCounts(userId: string) {
        const counts = await this.prisma.userBook.groupBy({
            by: ['status'],
            where: { userId },
            _count: {
                status: true,
            },
        });

        const result = { READING: 0, COMPLETED: 0 };
        counts.forEach(c => {
            result[c.status as 'READING' | 'COMPLETED'] = c._count.status;
        });
        return result;
    }

    async getBooksByStatus(userId: string, status: string) {
        return this.prisma.userBook.findMany({
            where: { userId, status },
            orderBy: { updatedAt: 'desc' },
        });
    }

    async updateStatus(id: string, status: string) {
        return this.prisma.userBook.update({
            where: { id },
            data: { status },
        });
    }
}
