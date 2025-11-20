const fs = require('fs');
const path = require('path');

const { PrismaClient } = require('@prisma/client');
const { fakerEN } = require('@faker-js/faker');

const faker = fakerEN;
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

const DUMMY_DIR = path.join(__dirname, '..', 'dummies');
const USERS_PATH = path.join(DUMMY_DIR, 'users.json');
const THREADS_PATH = path.join(DUMMY_DIR, 'threads.json');
const uploadsRoot = path.join(__dirname, '..', 'uploads');

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

const loadJson = (filePath) => JSON.parse(fs.readFileSync(filePath, 'utf-8'));

const ensureUploadsRoot = () => {
    if (!fs.existsSync(uploadsRoot)) {
        fs.mkdirSync(uploadsRoot, { recursive: true });
    }
};

const inferExtension = (imageUrl, contentType) => {
    const extFromUrl = path.extname(new URL(imageUrl).pathname);
    if (extFromUrl) {
        return extFromUrl;
    }

    if (contentType?.includes('png')) return '.png';
    if (contentType?.includes('jpeg') || contentType?.includes('jpg')) return '.jpg';
    if (contentType?.includes('webp')) return '.webp';
    if (contentType?.includes('svg')) return '.svg';
    return '.jpg';
};

const sanitizePathSegment = (value) => value.replace(/[^a-zA-Z0-9_-]/g, '_');

const downloadImageToUploads = async (imageUrl, threadId) => {
    ensureUploadsRoot();

    const response = await fetch(imageUrl);
    if (!response.ok) {
        throw new Error(`Failed to download image ${imageUrl}: ${response.status}`);
    }

    const contentType = response.headers.get('content-type') || '';
    const extension = inferExtension(imageUrl, contentType);
    const safeThreadId = sanitizePathSegment(threadId || `thread_${Date.now()}`);
    const targetDir = path.join(uploadsRoot, safeThreadId);
    fs.mkdirSync(targetDir, { recursive: true });

    const filename = `${safeThreadId}${extension}`;
    const buffer = Buffer.from(await response.arrayBuffer());
    fs.writeFileSync(path.join(targetDir, filename), buffer);

    return path.join('uploads', safeThreadId, filename);
};

async function seedUsersFromDummies() {
    const users = loadJson(USERS_PATH);
    const passwordHash = bcrypt.hashSync('password', 10);

    const created = [];

    for (const user of users) {
        const createdUser = await prisma.user.upsert({
            where: { id: user.id },
            update: {
                email: user.email,
                username: user.username,
                name: user.name,
                password_hash: passwordHash,
                profile_picture: user.profile_picture,
                google_id: user.google_id,
                google_email: user.google_email,
                google_picture: user.google_picture
            },
            create: {
                id: user.id,
                email: user.email,
                username: user.username,
                name: user.name,
                password_hash: passwordHash,
                profile_picture: user.profile_picture,
                google_id: user.google_id,
                google_email: user.google_email,
                google_picture: user.google_picture,
                created_at: new Date(user.created_at)
            }
        });

        created.push(createdUser);
    }

    return created;
}

async function seedThreadsFromDummies(users) {
    if (!users.length) {
        throw new Error('Cannot seed threads without users');
    }

    const threads = loadJson(THREADS_PATH);
    const categories = await prisma.category.findMany({ select: { id: true, sdg_number: true } });
    if (!categories.length) {
        throw new Error('Categories must exist before seeding threads');
    }

    const categoryMap = new Map(categories.map((category) => [category.sdg_number, category.id]));

    const createdThreads = new Map();
    const savedThreads = [];

    const createThreadRecord = async (threadData) => {
        const categoryIds = Array.from(
            new Set(
                (threadData.categories || [])
                    .map((sdgNumber) => categoryMap.get(sdgNumber))
                    .filter(Boolean)
            )
        );

        if (!categoryIds.length) {
            throw new Error(`Thread ${threadData.id} has no matching categories to connect`);
        }

        let imagePath = null;
        if (threadData.image) {
            imagePath = await downloadImageToUploads(threadData.image, threadData.id);
        }

        const created = await prisma.thread.create({
            data: {
                id: threadData.id,
                author_id: faker.helpers.arrayElement(users).id,
                parent_thread_id: threadData.parent_thread_id || null,
                title: threadData.title,
                body: threadData.body,
                image: imagePath,
                tags: threadData.tags ?? [],
                status: threadData.status ?? 'ACTIVE',
                review_score: threadData.review_score ?? 0,
                created_at: new Date(threadData.created_at),
                updated_at: new Date(threadData.updated_at || threadData.created_at),
                categories: {
                    create: categoryIds.map((categoryId) => ({
                        category: { connect: { id: categoryId } }
                    }))
                }
            }
        });

        createdThreads.set(created.id, created);
        savedThreads.push(created);
    };

    const baseThreads = threads.filter((thread) => !thread.parent_thread_id);
    const replyCandidates = threads.filter((thread) => thread.parent_thread_id);

    for (const thread of baseThreads) {
        await createThreadRecord(thread);
    }

    let remaining = replyCandidates;
    while (remaining.length) {
        const nextRound = [];
        for (const thread of remaining) {
            if (createdThreads.has(thread.parent_thread_id)) {
                await createThreadRecord(thread);
            } else {
                nextRound.push(thread);
            }
        }

        if (nextRound.length === remaining.length) {
            throw new Error(
                `Unable to resolve parent threads for replies: ${nextRound
                    .map((thread) => thread.id)
                    .join(', ')}`
            );
        }

        remaining = nextRound;
    }

    return { threads: savedThreads };
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
    const users = await seedUsersFromDummies();
    const { threads } = await seedThreadsFromDummies(users);
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
