import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: process.env.DATABASE_URL,
        },
    },
});

async function main() {
    const userId = '9591d2ed-476f-4f54-a4c1-29476953880e'; // 김승우

    // Upsert user stat for testing
    await prisma.userStat.upsert({
        where: { userId },
        create: {
            userId,
            selfEfficacyXP: 50,
            emotionalIQXP: 50,
            logicalFrameXP: 0, // Force lowest for testing Soft-Nudge
            socialValueXP: 50,
            creativeInsightXP: 50,
            totalLevel: 1
        },
        update: {
            logicalFrameXP: 0,
            selfEfficacyXP: 50,
            emotionalIQXP: 50,
            socialValueXP: 50,
            creativeInsightXP: 50,
        }
    });

    console.log('TEST_SETUP_DONE:', userId, 'logicalFrameXP is now 0');
}

main()
    .catch((e) => console.error(e))
    .finally(async () => await prisma.$disconnect());
