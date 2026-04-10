import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';

dotenv.config();
const prisma = new PrismaClient();

async function main() {
  console.log('Starting groups and subgroups seeding...');

  // Sample group data with translations - expanded to 10 groups
  const groupsData = [
    {
      translations: {
        en: { title: 'Animals' },
        de: { title: 'Tiere' },
        fr: { title: 'Animaux' },
        it: { title: 'Animali' },
      },
      subgroups: [
        {
          translations: {
            en: { name: 'Mammals' },
            de: { name: 'Säugetiere' },
            fr: { name: 'Mammifères' },
            it: { name: 'Mammiferi' },
          },
        },
        {
          translations: {
            en: { name: 'Birds' },
            de: { name: 'Vögel' },
            fr: { name: 'Oiseaux' },
            it: { name: 'Uccelli' },
          },
        },
        {
          translations: {
            en: { name: 'Reptiles' },
            de: { name: 'Reptilien' },
            fr: { name: 'Reptiles' },
            it: { name: 'Rettili' },
          },
        },
      ],
    },
    {
      translations: {
        en: { title: 'Nature' },
        de: { title: 'Natur' },
        fr: { title: 'Nature' },
        it: { title: 'Natura' },
      },
      subgroups: [
        {
          translations: {
            en: { name: 'Plants' },
            de: { name: 'Pflanzen' },
            fr: { name: 'Plantes' },
            it: { name: 'Piante' },
          },
        },
        {
          translations: {
            en: { name: 'Landscapes' },
            de: { name: 'Landschaften' },
            fr: { name: 'Paysages' },
            it: { name: 'Paesaggi' },
          },
        },
        {
          translations: {
            en: { name: 'Oceans' },
            de: { name: 'Ozeane' },
            fr: { name: 'Océans' },
            it: { name: 'Oceani' },
          },
        },
      ],
    },
    {
      translations: {
        en: { title: 'Art' },
        de: { title: 'Kunst' },
        fr: { title: 'Art' },
        it: { title: 'Arte' },
      },
      subgroups: [
        {
          translations: {
            en: { name: 'Modern' },
            de: { name: 'Modern' },
            fr: { name: 'Moderne' },
            it: { name: 'Moderno' },
          },
        },
        {
          translations: {
            en: { name: 'Classic' },
            de: { name: 'Klassisch' },
            fr: { name: 'Classique' },
            it: { name: 'Classico' },
          },
        },
      ],
    },
    {
      translations: {
        en: { title: 'Sports' },
        de: { title: 'Sport' },
        fr: { title: 'Sports' },
        it: { title: 'Sport' },
      },
      subgroups: [
        {
          translations: {
            en: { name: 'Team Sports' },
            de: { name: 'Mannschaftssport' },
            fr: { name: "Sports d'équipe" },
            it: { name: 'Sport di squadra' },
          },
        },
        {
          translations: {
            en: { name: 'Individual Sports' },
            de: { name: 'Einzelsport' },
            fr: { name: 'Sports individuels' },
            it: { name: 'Sport individuali' },
          },
        },
      ],
    },
    {
      translations: {
        en: { title: 'Music' },
        de: { title: 'Musik' },
        fr: { title: 'Musique' },
        it: { title: 'Musica' },
      },
      subgroups: [
        {
          translations: {
            en: { name: 'Instruments' },
            de: { name: 'Instrumente' },
            fr: { name: 'Instruments' },
            it: { name: 'Strumenti' },
          },
        },
        {
          translations: {
            en: { name: 'Bands' },
            de: { name: 'Bands' },
            fr: { name: 'Groupes' },
            it: { name: 'Gruppi' },
          },
        },
      ],
    },
    {
      translations: {
        en: { title: 'Food' },
        de: { title: 'Essen' },
        fr: { title: 'Nourriture' },
        it: { title: 'Cibo' },
      },
      subgroups: [
        {
          translations: {
            en: { name: 'Desserts' },
            de: { name: 'Desserts' },
            fr: { name: 'Desserts' },
            it: { name: 'Dolci' },
          },
        },
        {
          translations: {
            en: { name: 'Main Dishes' },
            de: { name: 'Hauptgerichte' },
            fr: { name: 'Plats principaux' },
            it: { name: 'Piatti principali' },
          },
        },
      ],
    },
    {
      translations: {
        en: { title: 'Technology' },
        de: { title: 'Technologie' },
        fr: { title: 'Technologie' },
        it: { title: 'Tecnologia' },
      },
      subgroups: [
        {
          translations: {
            en: { name: 'Gadgets' },
            de: { name: 'Gadgets' },
            fr: { name: 'Gadgets' },
            it: { name: 'Gadget' },
          },
        },
        {
          translations: {
            en: { name: 'Software' },
            de: { name: 'Software' },
            fr: { name: 'Logiciels' },
            it: { name: 'Software' },
          },
        },
      ],
    },
    {
      translations: {
        en: { title: 'Travel' },
        de: { title: 'Reisen' },
        fr: { title: 'Voyage' },
        it: { title: 'Viaggi' },
      },
      subgroups: [
        {
          translations: {
            en: { name: 'Cities' },
            de: { name: 'Städte' },
            fr: { name: 'Villes' },
            it: { name: 'Città' },
          },
        },
        {
          translations: {
            en: { name: 'Landmarks' },
            de: { name: 'Wahrzeichen' },
            fr: { name: 'Monuments' },
            it: { name: 'Monumenti' },
          },
        },
      ],
    },
    {
      translations: {
        en: { title: 'Fashion' },
        de: { title: 'Mode' },
        fr: { title: 'Mode' },
        it: { title: 'Moda' },
      },
      subgroups: [
        {
          translations: {
            en: { name: 'Clothing' },
            de: { name: 'Kleidung' },
            fr: { name: 'Vêtements' },
            it: { name: 'Abbigliamento' },
          },
        },
        {
          translations: {
            en: { name: 'Accessories' },
            de: { name: 'Accessoires' },
            fr: { name: 'Accessoires' },
            it: { name: 'Accessori' },
          },
        },
      ],
    },
    {
      translations: {
        en: { title: 'Others' },
        de: { title: 'Andere' },
        fr: { title: 'Autres' },
        it: { title: 'Altri' },
      },
      subgroups: [
        {
          translations: {
            en: { name: 'Miscellaneous' },
            de: { name: 'Verschiedenes' },
            fr: { name: 'Divers' },
            it: { name: 'Vari' },
          },
        },
        {
          translations: {
            en: { name: 'Special' },
            de: { name: 'Spezial' },
            fr: { name: 'Spécial' },
            it: { name: 'Speciale' },
          },
        },
      ],
    },
  ];

  // Create groups and subgroups and store their IDs for reference
  const createdGroups = [];

  for (const groupData of groupsData) {
    const { translations, subgroups } = groupData;

    // Create group
    const group = await prisma.group.create({
      data: {
        translations: {
          create: [
            {
              language: 'en',
              title: translations.en.title,
            },
            ...(translations.de
              ? [
                  {
                    language: 'de',
                    title: translations.de.title,
                  },
                ]
              : []),
            ...(translations.fr
              ? [
                  {
                    language: 'fr',
                    title: translations.fr.title,
                  },
                ]
              : []),
            ...(translations.it
              ? [
                  {
                    language: 'it',
                    title: translations.it.title,
                  },
                ]
              : []),
          ],
        },
      },
      include: {
        translations: true,
      },
    });

    console.log(`Created group: ${group.id}`);
    createdGroups.push({
      id: group.id,
      name: translations.en.title,
      subgroups: [],
    });

    // Create subgroups for this group
    if (subgroups && subgroups.length > 0) {
      for (const subgroupData of subgroups) {
        const subgroup = await prisma.subgroup.create({
          data: {
            translations: {
              create: [
                {
                  language: 'en',
                  title: subgroupData.translations.en.name,
                },
                ...(subgroupData.translations.de
                  ? [
                      {
                        language: 'de',
                        title: subgroupData.translations.de.name,
                      },
                    ]
                  : []),
                ...(subgroupData.translations.fr
                  ? [
                      {
                        language: 'fr',
                        title: subgroupData.translations.fr.name,
                      },
                    ]
                  : []),
                ...(subgroupData.translations.it
                  ? [
                      {
                        language: 'it',
                        title: subgroupData.translations.it.name,
                      },
                    ]
                  : []),
              ],
            },
            groups: {
              connect: [{ id: group.id }], // Connect to the parent group
            },
          },
          include: {
            translations: true,
          },
        });

        console.log(`Created subgroup: ${subgroup.id} for group: ${group.id}`);

        // Store subgroup ID with its parent group
        const groupIndex = createdGroups.findIndex((g) => g.id === group.id);
        if (groupIndex !== -1) {
          createdGroups[groupIndex].subgroups.push({
            id: subgroup.id,
            name: subgroupData.translations.en.name,
          });
        }
      }
    }
  }

  // Save group and subgroup IDs to a global variable that can be accessed by other seed files
  global.createdGroups = createdGroups;

  // Sample part group data with translations and images
  const partGroupsData = [
    {
      translations: {
        en: { title: 'General Parts' },
        de: { title: 'Allgemeine Teile' },
        fr: { title: 'Pièces générales' },
        it: { title: 'Parti generali' },
      },
      image: 'part-groups/general-parts.jpg',
    },
    {
      translations: {
        en: { title: 'Frames' },
        de: { title: 'Rahmen' },
        fr: { title: 'Cadres' },
        it: { title: 'Telai' },
      },
      image: 'part-groups/frames.jpg',
    },
    {
      translations: {
        en: { title: 'Wheels' },
        de: { title: 'Räder' },
        fr: { title: 'Roues' },
        it: { title: 'Ruote' },
      },
      image: 'part-groups/wheels.jpg',
    },
    {
      translations: {
        en: { title: 'Hardware' },
        de: { title: 'Hardware' },
        fr: { title: 'Matériel' },
        it: { title: 'Ferramenta' },
      },
      image: 'part-groups/hardware.jpg',
    },
    {
      translations: {
        en: { title: 'Accessories' },
        de: { title: 'Zubehör' },
        fr: { title: 'Accessoires' },
        it: { title: 'Accessori' },
      },
      image: 'part-groups/accessories.jpg',
    },
    {
      translations: {
        en: { title: 'Custom Parts' },
        de: { title: 'Spezialanfertigungen' },
        fr: { title: 'Pièces personnalisées' },
        it: { title: 'Parti personalizzate' },
      },
      image: 'part-groups/custom-parts.jpg',
    },
  ];

  // Create part groups and store their IDs for reference
  const createdPartGroups = [];

  for (const partGroupData of partGroupsData) {
    const { translations, image } = partGroupData;

    // Create part group with image
    const partGroup = await prisma.part_group.create({
      data: {
        image: image, // Add the image URL to the part group
        translations: {
          create: [
            {
              language: 'en',
              title: translations.en.title,
            },
            ...(translations.de
              ? [
                  {
                    language: 'de',
                    title: translations.de.title,
                  },
                ]
              : []),
            ...(translations.fr
              ? [
                  {
                    language: 'fr',
                    title: translations.fr.title,
                  },
                ]
              : []),
            ...(translations.it
              ? [
                  {
                    language: 'it',
                    title: translations.it.title,
                  },
                ]
              : []),
          ],
        },
      },
      include: {
        translations: true,
      },
    });

    console.log(`Created part group: ${partGroup.id} with image: ${image}`);
    createdPartGroups.push({
      id: partGroup.id,
      name: translations.en.title,
      image: image,
    });
  }

  // Save part group IDs to a global variable that can be accessed by other seed files
  global.createdPartGroups = createdPartGroups;

  console.log('Group, subgroup, and part group seeding completed!');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    // Close the Prisma client
    await prisma.$disconnect();
  });
