import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';

dotenv.config();
const prisma = new PrismaClient();

async function main() {
  console.log('Starting filament colors seeding...');

  // Clear existing data first
  await prisma.available_color.deleteMany({});
  console.log('Cleared existing filament colors');

  // Define default colors for each filament type
  const filamentColorData = [
    // PLA Colors
    { filamentType: 'PLA', color: 'Black', active: true },
    { filamentType: 'PLA', color: 'White', active: true },
    { filamentType: 'PLA', color: 'Red', active: true },
    { filamentType: 'PLA', color: 'Blue', active: true },
    { filamentType: 'PLA', color: 'Green', active: true },
    { filamentType: 'PLA', color: 'Yellow', active: true },
    { filamentType: 'PLA', color: 'Orange', active: true },
    { filamentType: 'PLA', color: 'Purple', active: true },
    { filamentType: 'PLA', color: 'Gray', active: true },
    { filamentType: 'PLA', color: 'Transparent', active: true },

    // PETG Colors
    { filamentType: 'PETG', color: 'Black', active: true },
    { filamentType: 'PETG', color: 'White', active: true },
    { filamentType: 'PETG', color: 'Red', active: true },
    { filamentType: 'PETG', color: 'Blue', active: true },
    { filamentType: 'PETG', color: 'Green', active: true },
    { filamentType: 'PETG', color: 'Transparent', active: true },
    { filamentType: 'PETG', color: 'Orange', active: true },
    { filamentType: 'PETG', color: 'Gray', active: true },

    // TPU Colors (Flexible)
    { filamentType: 'TPU', color: 'Black', active: true },
    { filamentType: 'TPU', color: 'White', active: true },
    { filamentType: 'TPU', color: 'Red', active: true },
    { filamentType: 'TPU', color: 'Blue', active: true },
    { filamentType: 'TPU', color: 'Transparent', active: true },

    // ASA Colors (Weather-resistant)
    { filamentType: 'ASA', color: 'Black', active: true },
    { filamentType: 'ASA', color: 'White', active: true },
    { filamentType: 'ASA', color: 'Gray', active: true },
    { filamentType: 'ASA', color: 'Red', active: true },
    { filamentType: 'ASA', color: 'Blue', active: true },
  ];

  // Create all filament colors
  for (const colorData of filamentColorData) {
    await prisma.available_color.create({
      data: colorData,
    });
  }

  console.log(`Created ${filamentColorData.length} filament colors`);

  // Display summary
  const summary = await prisma.available_color.groupBy({
    by: ['filamentType'],
    _count: {
      filamentType: true,
    },
  });

  console.log('\nFilament color summary:');
  summary.forEach((item) => {
    console.log(`  ${item.filamentType}: ${item._count.filamentType} colors`);
  });

  console.log('\nFilament colors seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error during filament colors seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
