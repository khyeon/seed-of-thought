import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    console.log('Seeding data...');

    // 1. Create a common family
    const family = await prisma.family.create({
        data: {
            name: '우리 가족',
        },
    });

    const hashedPassword = await bcrypt.hash('1111', 10);

    // 2. Create the 4 accounts
    const users = [
        { username: '승찬', name: '김승찬', role: 'CHILD', password: hashedPassword },
        { username: '승우', name: '김승우', role: 'CHILD', password: hashedPassword },
        { username: '아빠', name: '아빠', role: 'PARENT', password: hashedPassword },
        { username: '엄마', name: '엄마', role: 'PARENT', password: hashedPassword },
    ];

    for (const userData of users) {
        const user = await prisma.user.upsert({
            where: { username: userData.username },
            update: {
                password: userData.password,
            },
            create: {
                username: userData.username,
                name: userData.name,
                role: userData.role,
                password: userData.password,
                email: `${userData.username}@example.com`,
                familyId: family.id,
            },
        });
        console.log(`Created user: ${user.username} (${user.role})`);
    }

    console.log('Seeding finished!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
