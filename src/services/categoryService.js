const prisma = require('../prisma');

const listCategories = async () => {
    const categories = await prisma.category.findMany({
        orderBy: { sdg_number: 'asc' },
        select: {
            id: true,
            name: true,
            sdg_number: true,
            created_at: true
        }
    });

    return categories;
};


module.exports = {
    listCategories
};

