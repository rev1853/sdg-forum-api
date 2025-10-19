const { PrismaClient } = require('@prisma/client');

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

async function main() {
  for (const category of sdgCategories) {
    await prisma.category.upsert({
      where: { sdg_number: category.sdg_number },
      update: { name: category.name },
      create: { name: category.name, sdg_number: category.sdg_number }
    });
  }

  console.log('SDG categories seeded successfully');
}

main()
  .catch((error) => {
    console.error('Seeding failed', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
