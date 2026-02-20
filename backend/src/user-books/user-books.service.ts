import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UserBooksService {
    constructor(private prisma: PrismaService) { }

    async addBook(userId: string, bookData: any) {
        console.log('--- Add Book Attempt ---');
        console.log('UserId:', userId);
        console.log('BookData:', JSON.stringify(bookData));

        try {
            const result = await this.prisma.userBook.upsert({
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
            console.log('UserBook saved successfully:', result.id);
            return result;
        } catch (error: any) {
            console.error('Prisma UserBook Error:', error.message);
            throw error;
        }
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

    async getMonthlyStats(userId: string) {
        const completedBooks = await this.prisma.userBook.findMany({
            where: {
                userId,
                status: 'COMPLETED',
            },
            select: {
                updatedAt: true,
            },
        });

        const stats: { [key: string]: number } = {};
        const now = new Date();

        // Initialize last 6 months
        for (let i = 0; i < 6; i++) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            stats[key] = 0;
        }

        completedBooks.forEach(book => {
            const d = new Date(book.updatedAt);
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            if (stats[key] !== undefined) {
                stats[key]++;
            }
        });

        return Object.entries(stats)
            .map(([month, count]) => ({ month, count }))
            .sort((a, b) => a.month.localeCompare(b.month));
    }
}
