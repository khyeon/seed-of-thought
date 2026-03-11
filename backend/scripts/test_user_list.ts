import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: process.env.DATABASE_URL,
        },
    },
});

async function main() {
    const users = await prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: { id: true, name: true, role: true }
    });
    console.log('USER_LIST_RESULT:', JSON.stringify(users));
}

main()
    .catch((e) => console.error(e))
    .finally(async () => await prisma.$disconnect());
