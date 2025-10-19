const { PrismaClient } = require('@prisma/client');
const { fakerEN } = require('@faker-js/faker');

const faker = fakerEN;
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

const sdgCategories = [
    { sdg_number: 1, name: 'No Poverty' },
    { sdg_number: 2, name: 'Zero Hunger' },
    { sdg_number: 3, name: 'Good Health and Well-Being' },
    { sdg_number: 4, name: 'Quality Education' },
    { sdg_number: 5, name: 'Gender Equality' },
    { sdg_number: 6, name: 'Clean Water and Sanitation' },
    { sdg_number: 7, name: 'Affordable and Clean Energy' },
    { sdg_number: 8, name: 'Decent Work and Economic Growth' },
    { sdg_number: 9, name: 'Industry, Innovation and Infrastructure' },
    { sdg_number: 10, name: 'Reduced Inequalities' },
    { sdg_number: 11, name: 'Sustainable Cities and Communities' },
    { sdg_number: 12, name: 'Responsible Consumption and Production' },
    { sdg_number: 13, name: 'Climate Action' },
    { sdg_number: 14, name: 'Life Below Water' },
    { sdg_number: 15, name: 'Life on Land' },
    { sdg_number: 16, name: 'Peace, Justice and Strong Institutions' },
    { sdg_number: 17, name: 'Partnerships for the Goals' }
];

async function seedCategories() {
    for (const category of sdgCategories) {
        await prisma.category.upsert({
            where: { name: category.name },
            update: { name: category.name },
            create: { name: category.name, sdg_number: category.sdg_number }
        });
    }
}

const generateUniqueUsername = (existing) => {
    let username;
    do {
        username = faker.internet
            .userName({
                firstName: faker.person.firstName(),
                lastName: faker.person.lastName()
            })
            .replace(/[^a-zA-Z0-9_]/g, '')
            .toLowerCase();
    } while (existing.has(username));

    existing.add(username);
    return username;
};

async function seedUsers(count = 10) {
    const existingUsers = await prisma.user.findMany({ select: { username: true } });
    const usernameSet = new Set(existingUsers.map((user) => user.username));

    const created = [];

    for (let i = 0; i < count; i += 1) {
        const username = generateUniqueUsername(usernameSet);
        const email = faker.internet.email({ firstName: username }).toLowerCase();
        const passwordHash = bcrypt.hashSync('Password123!', 10);

        const user = await prisma.user.upsert({
            where: { email },
            update: {
                username,
                name: faker.person.fullName(),
                password_hash: passwordHash
            },
            create: {
                email,
                username,
                name: faker.person.fullName(),
                password_hash: passwordHash
            }
        });

        created.push(user);
    }

    return created;
}

async function seedThreads(users, count = 20) {
    const categories = await prisma.category.findMany({ select: { id: true } });
    if (!categories.length) {
        throw new Error('Categories must exist before seeding threads');
    }

    const baseThreads = [];
    const allThreads = [];

    for (let i = 0; i < count; i += 1) {
        const author = faker.helpers.arrayElement(users);
        const threadTitle = faker.lorem.sentence({ min: 5, max: 12 });
        const body = faker.lorem
            .paragraphs({ min: 2, max: 4, separator: '\n\n' })
            .slice(0, 5000);
        const tagCount = faker.number.int({ min: 0, max: 5 });
        const rawTags = Array.from({ length: tagCount }, () => faker.hacker.noun());
        const tags = [...new Set(rawTags.map((tag) => tag.toLowerCase()))];

        const selectedCategories = faker.helpers.arrayElements(
            categories,
            faker.number.int({ min: 1, max: 3 })
        );

        const thread = await prisma.thread.create({
            data: {
                author_id: author.id,
                title: threadTitle,
                body,
                tags,
                categories: {
                    create: selectedCategories.map((category) => ({
                        category: { connect: { id: category.id } }
                    }))
                }
            }
        });

        const record = {
            id: thread.id,
            title: threadTitle,
            categories: selectedCategories
        };

        baseThreads.push(record);
        allThreads.push(record);
    }

    // Create replies for a subset of threads
    const replyThreads = [];
    for (const baseThread of baseThreads.slice(0, Math.floor(baseThreads.length / 2))) {
        const replyCount = faker.number.int({ min: 0, max: 5 });
        for (let i = 0; i < replyCount; i += 1) {
            const author = faker.helpers.arrayElement(users);
            const reply = await prisma.thread.create({
                data: {
                    author_id: author.id,
                    parent_thread_id: baseThread.id,
                    title: `Re: ${baseThread.title}`,
                    body: faker.lorem.paragraphs({ min: 1, max: 2, separator: '\n\n' }).slice(0, 3000),
                    tags: [],
                    categories: {
                        create: baseThread.categories.map((cat) => ({
                            category: { connect: { id: cat.id } }
                        }))
                    }
                }
            });
            const record = {
                id: reply.id,
                title: reply.title,
                categories: baseThread.categories
            };
            replyThreads.push(record);
            allThreads.push(record);
        }
    }

    return { threads: allThreads };
}

async function seedInteractions(users, threads) {
    for (const thread of threads) {
        const likeCount = faker.number.int({ min: 0, max: users.length });
        const likedUsers = faker.helpers.arrayElements(users, likeCount);

        for (const user of likedUsers) {
            await prisma.interaction.upsert({
                where: {
                    thread_id_user_id_type: {
                        thread_id: thread.id,
                        user_id: user.id,
                        type: 'LIKE'
                    }
                },
                update: {},
                create: {
                    thread_id: thread.id,
                    user_id: user.id,
                    type: 'LIKE'
                }
            });
        }

        const repostCount = faker.number.int({ min: 0, max: Math.floor(users.length / 2) });
        const repostUsers = faker.helpers.arrayElements(users, repostCount);

        for (const user of repostUsers) {
            await prisma.interaction.upsert({
                where: {
                    thread_id_user_id_type: {
                        thread_id: thread.id,
                        user_id: user.id,
                        type: 'REPOST'
                    }
                },
                update: {},
                create: {
                    thread_id: thread.id,
                    user_id: user.id,
                    type: 'REPOST'
                }
            });
        }
    }
}

async function main() {
    await seedCategories();
    const users = await seedUsers();
    const { threads } = await seedThreads(users);
    await seedInteractions(users, threads);

    console.log('SDG forum seed completed successfully');
}

main()
    .catch((error) => {
        console.error('Seeding failed', error);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
