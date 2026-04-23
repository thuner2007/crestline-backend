import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';

dotenv.config();
const prisma = new PrismaClient();

async function main() {
  console.log('Starting part sections seeding...');

  const sectionsData = [
    {
      sortingRank: 1,
      translations: {
        en: { title: 'Plate Holders', description: 'License plate holders and mounts' },
        de: { title: 'Nummernschildhalter', description: 'Nummernschildhalter und Halterungen' },
        fr: { title: 'Porte-plaques', description: 'Porte-plaques d\'immatriculation et supports' },
        it: { title: 'Portatarghette', description: 'Portatarghette e supporti' },
      },
    },
    {
      sortingRank: 2,
      translations: {
        en: { title: 'Stickers', description: 'Decals, stickers and graphics' },
        de: { title: 'Aufkleber', description: 'Aufkleber, Dekale und Grafiken' },
        fr: { title: 'Autocollants', description: 'Autocollants, décalcomanies et graphiques' },
        it: { title: 'Adesivi', description: 'Adesivi, decalcomanie e grafiche' },
      },
    },
    {
      sortingRank: 3,
      translations: {
        en: { title: 'Hoodies', description: 'Hoodies and sweatshirts' },
        de: { title: 'Hoodies', description: 'Hoodies und Sweatshirts' },
        fr: { title: 'Sweats à capuche', description: 'Sweats à capuche et sweat-shirts' },
        it: { title: 'Felpe con cappuccio', description: 'Felpe con cappuccio e felpe' },
      },
    },
    {
      sortingRank: 4,
      translations: {
        en: { title: 'Accessories', description: 'General accessories and add-ons' },
        de: { title: 'Zubehör', description: 'Allgemeines Zubehör und Erweiterungen' },
        fr: { title: 'Accessoires', description: 'Accessoires généraux et ajouts' },
        it: { title: 'Accessori', description: 'Accessori generali e componenti aggiuntivi' },
      },
    },
  ];

  for (const sectionData of sectionsData) {
    const enTranslation = sectionData.translations.en;

    // Check if a section with the same EN title already exists
    const existing = await prisma.part_section_translation.findFirst({
      where: { language: 'en', title: enTranslation.title },
    });

    if (existing) {
      console.log(`Section "${enTranslation.title}" already exists, skipping.`);
      continue;
    }

    const section = await prisma.part_section.create({
      data: {
        sortingRank: sectionData.sortingRank,
        active: true,
        translations: {
          create: Object.entries(sectionData.translations).map(([lang, tr]) => ({
            language: lang,
            title: tr.title,
            description: tr.description ?? null,
          })),
        },
      },
    });

    console.log(`Created section "${enTranslation.title}" (${section.id})`);
  }

  console.log('Part sections seeding completed!');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
