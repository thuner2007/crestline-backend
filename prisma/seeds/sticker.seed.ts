import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';

dotenv.config();
const prisma = new PrismaClient();

// Helper function to get random items from an array
function getRandomItems(array, count) {
  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

// Helper function to get random int between min and max (inclusive)
function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function main() {
  console.log('Starting sticker seeding...');

  // Create sample variation groups
  const variationGroups = [];
  for (let i = 1; i <= 5; i++) {
    const variationGroup = await prisma.variation_group.upsert({
      where: { name: `Variation Group ${i}` },
      update: {},
      create: {
        name: `Variation Group ${i}`,
      },
    });
    variationGroups.push(variationGroup);
    console.log(`Created variation group: ${variationGroup.id}`);
  }

  // Fetch all groups and subgroups to connect with stickers
  const groups = await prisma.group.findMany({
    include: {
      translations: true,
    },
  });

  const subgroups = await prisma.subgroup.findMany({
    include: {
      translations: true,
      groups: true,
    },
  });

  console.log(
    `Found ${groups.length} groups and ${subgroups.length} subgroups`,
  );

  // Generate 50 stickers with randomized properties
  const stickerData = [];
  const titles = [
    'Cool Sticker',
    'Awesome Sticker',
    'Fancy Sticker',
    'Creative Sticker',
    'Colorful Sticker',
    'Funny Sticker',
    'Cute Sticker',
    'Elegant Sticker',
    'Modern Sticker',
    'Retro Sticker',
    'Vintage Sticker',
    'Minimalist Sticker',
    'Bold Sticker',
    'Nature Sticker',
    'Animal Sticker',
    'Tech Sticker',
  ];

  for (let i = 1; i <= 50; i++) {
    const title = titles[Math.floor(Math.random() * titles.length)] + ` ${i}`;
    const isPrintable = Math.random() > 0.3;
    const isVinyl = Math.random() > 0.3;
    const standardMethod =
      isPrintable && isVinyl
        ? Math.random() > 0.5
          ? 'vinyl'
          : 'printable'
        : isPrintable
          ? 'printable'
          : 'vinyl';
    const isInVariationGroup = Math.random() > 0.7;
    const variationGroupId = isInVariationGroup
      ? variationGroups[Math.floor(Math.random() * variationGroups.length)].id
      : undefined;

    // Determine textToWidthResponsiveness first (30% chance of being true)
    const textToWidthResponsiveness = Math.random() > 0.7;

    // Create random customization options based on new structure
    interface CustomizationOption {
      type: string;
      max?: number;
      translations: {
        en: { title: string; description: string };
        de: { title: string; description: string };
        fr: { title: string; description: string };
        it: { title: string; description: string };
      };
      items?: {
        id: string;
        translations: {
          en: { title: string; description: string };
          de: { title: string; description: string };
          fr: { title: string; description: string };
          it: { title: string; description: string };
        };
      }[];
    }

    const customizationOptions: { options: CustomizationOption[] } = {
      options: [],
    };

    // If textToWidthResponsiveness is true, always add an input field option
    if (textToWidthResponsiveness) {
      customizationOptions.options.push({
        type: 'inputfield',
        max: 50,
        translations: {
          en: {
            title: `Custom Text for ${title}`,
            description: `Enter your custom text for ${title} (responsive to width)`,
          },
          de: {
            title: `Benutzerdefinierter Text für ${title}`,
            description: `Geben Sie Ihren benutzerdefinierten Text für ${title} ein (responsive zur Breite)`,
          },
          fr: {
            title: `Texte personnalisé pour ${title}`,
            description: `Entrez votre texte personnalisé pour ${title} (responsive à la largeur)`,
          },
          it: {
            title: `Testo personalizzato per ${title}`,
            description: `Inserisci il tuo testo personalizzato per ${title} (responsive alla larghezza)`,
          },
        },
      });
    } else {
      // For non-responsive stickers, randomly add input field (50% chance)
      if (Math.random() > 0.5) {
        customizationOptions.options.push({
          type: 'inputfield',
          max: 50,
          translations: {
            en: {
              title: `Text for ${title}`,
              description: `Enter your custom text for ${title}`,
            },
            de: {
              title: `Text für ${title}`,
              description: `Geben Sie Ihren benutzerdefinierten Text ein für ${title}`,
            },
            fr: {
              title: `Texte pour ${title}`,
              description: `Entrez votre texte personnalisé pour ${title}`,
            },
            it: {
              title: `Testo per ${title}`,
              description: `Inserisci il tuo testo personalizzato per ${title}`,
            },
          },
        });
      }
    }

    // Always add color option
    customizationOptions.options.push({
      type: 'color',
      translations: {
        en: {
          title: 'Choose a color',
          description: 'Select your preferred color',
        },
        de: {
          title: 'Wählen Sie eine Farbe',
          description: 'Wählen Sie Ihre bevorzugte Farbe',
        },
        fr: {
          title: 'Choisissez une couleur',
          description: 'Sélectionnez votre couleur préférée',
        },
        it: {
          title: 'Scegli un colore',
          description: 'Seleziona il tuo colore preferito',
        },
      },
    });

    // Add vinyl colors option for vinyl stickers
    if (isVinyl) {
      customizationOptions.options.push({
        type: 'vinylColors',
        translations: {
          en: {
            title: 'Vinyl color options',
            description: 'Choose from our selection of premium vinyl colors',
          },
          de: {
            title: 'Vinyl-Farboptionen',
            description:
              'Wählen Sie aus unserer Auswahl an Premium-Vinylfarben',
          },
          fr: {
            title: 'Options de couleur de vinyle',
            description:
              'Choisissez parmi notre sélection de couleurs de vinyle premium',
          },
          it: {
            title: 'Opzioni colore vinile',
            description:
              'Scegli dalla nostra selezione di colori vinile premium',
          },
        },
      });
    }

    // Add dropdown option with random items
    const dropdownItems = [];
    const dropdownOptions = [
      'Small',
      'Medium',
      'Large',
      'Extra Large',
      'Custom',
    ];

    for (let j = 0; j < 3; j++) {
      dropdownItems.push({
        id: `option-${j + 1}`,
        translations: {
          en: {
            title: dropdownOptions[j],
            description: `${dropdownOptions[j]} size option`,
          },
          de: {
            title: dropdownOptions[j],
            description: `${dropdownOptions[j]} Größenoption`,
          },
          fr: {
            title: dropdownOptions[j],
            description: `Option de taille ${dropdownOptions[j]}`,
          },
          it: {
            title: dropdownOptions[j],
            description: `Opzione dimensione ${dropdownOptions[j]}`,
          },
        },
      });
    }

    customizationOptions.options.push({
      type: 'dropdown',
      items: dropdownItems,
      translations: {
        en: {
          title: 'Size options',
          description: 'Select your preferred size',
        },
        de: {
          title: 'Größenoptionen',
          description: 'Wählen Sie Ihre bevorzugte Größe',
        },
        fr: {
          title: 'Options de taille',
          description: 'Sélectionnez votre taille préférée',
        },
        it: {
          title: 'Opzioni di dimensione',
          description: 'Seleziona la tua dimensione preferita',
        },
      },
    });

    // Generate widthToHeightRatio with 20% chance of being null
    const widthToHeightRatioChoice = Math.random();

    // Determine the widthToHeightRatio value based on random choice
    let widthToHeightRatio;
    if (widthToHeightRatioChoice < 0.2) {
      // 20% chance of being null (no ratio)
      widthToHeightRatio = null;
    } else if (widthToHeightRatioChoice < 0.6) {
      // 40% chance of being portrait (ratio < 1)
      widthToHeightRatio = parseFloat((Math.random() * 0.5 + 0.5).toFixed(2)); // 0.5 to 1.0
    } else {
      // 40% chance of being landscape (ratio > 1)
      widthToHeightRatio = parseFloat((Math.random() * 1.5 + 1.0).toFixed(2)); // 1.0 to 2.5
    }

    const sticker = {
      pricePerCm2Printable: parseFloat((Math.random() * 0.2 + 0.1).toFixed(2)),
      pricePerCm2Vinyl: parseFloat((Math.random() * 0.2 + 0.1).toFixed(2)),
      quantity: getRandomInt(10, 500),
      printable: isPrintable,
      vinyl: isVinyl,
      standardMethod,
      customizationOptions: customizationOptions,
      images: [`sticker-${i}.jpg`, `sticker-${i}-alt.jpg`],
      sortingRank: i,
      widthToHeightRatio: widthToHeightRatio,
      active: Math.random() > 0.1, // 90% of stickers are active
      textToWidthResponsiveness: textToWidthResponsiveness,
      variationsGroupId: variationGroupId,
      defaultInVariation: isInVariationGroup ? Math.random() < 0.3 : false,
      translations: [
        {
          language: 'en',
          title: title,
          description: `This is a sample ${title.toLowerCase()} for testing purposes.`,
        },
        {
          language: 'de',
          title: `${title} DE`,
          description: `Dies ist ein Beispiel-Sticker ${i} für Testzwecke.`,
        },
        {
          language: 'fr',
          title: `${title} FR`,
          description: `Il s'agit d'un autocollant d'exemple ${i} à des fins de test.`,
        },
        {
          language: 'it',
          title: `${title} IT`,
          description: `Questo è un adesivo campione ${i} per scopi di test.`,
        },
      ],
      // Random selection of groups and subgroups
      groupIds: getRandomItems(groups, getRandomInt(1, 3)).map((g) => g.id),
      subgroupIds: getRandomItems(subgroups, getRandomInt(1, 4)).map(
        (s) => s.id,
      ),
    };

    stickerData.push(sticker);
  }

  // Create all stickers
  for (let i = 0; i < stickerData.length; i++) {
    const data = stickerData[i];
    const { translations, groupIds, subgroupIds, ...stickerInfo } = data;

    try {
      // Prepare the sticker data
      const createData = {
        ...stickerInfo,
        groups: {
          connect: groupIds.map((id) => ({ id })),
        },
        subgroups: {
          connect: subgroupIds.map((id) => ({ id })),
        },
        translations: {
          create: translations,
        },
      };

      // Create the sticker
      const sticker = await prisma.sticker.create({
        data: createData,
        include: {
          groups: true,
          subgroups: true,
          translations: true,
        },
      });

      console.log(`Created sticker ${i + 1}/50: ${sticker.id}`);
    } catch (error) {
      console.error(`Failed to create sticker ${i + 1}:`, error);
    }
  }

  try {
    // Check if our demo sticker already exists
    const existingSticker = await prisma.sticker.findFirst({
      where: {
        translations: {
          some: {
            title: 'Demo Customizable Sticker',
            language: 'en',
          },
        },
      },
    });

    if (!existingSticker) {
      // Detailed customization options for our demo sticker
      const customizationOptions = {
        options: [
          // Text input option
          {
            type: 'inputfield',
            max: 30,
            translations: {
              en: {
                title: 'Custom Text',
                description: 'Enter your custom text (max 30 characters)',
              },
              de: {
                title: 'Benutzerdefinierter Text',
                description:
                  'Geben Sie Ihren benutzerdefinierten Text ein (max. 30 Zeichen)',
              },
              fr: {
                title: 'Texte personnalisé',
                description:
                  'Entrez votre texte personnalisé (30 caractères max)',
              },
              it: {
                title: 'Testo personalizzato',
                description:
                  'Inserisci il tuo testo personalizzato (massimo 30 caratteri)',
              },
            },
          },
          // Color selection option
          {
            type: 'color',
            translations: {
              en: {
                title: 'Text Color',
                description: 'Choose the color for your text',
              },
              de: {
                title: 'Textfarbe',
                description: 'Wählen Sie die Farbe für Ihren Text',
              },
              fr: {
                title: 'Couleur du texte',
                description: 'Choisissez la couleur pour votre texte',
              },
              it: {
                title: 'Colore del testo',
                description: 'Scegli il colore per il tuo testo',
              },
            },
          },
          // Vinyl colors option
          {
            type: 'vinylColors',
            translations: {
              en: {
                title: 'Vinyl Background',
                description: 'Select your vinyl background color',
              },
              de: {
                title: 'Vinyl-Hintergrund',
                description: 'Wählen Sie Ihre Vinyl-Hintergrundfarbe',
              },
              fr: {
                title: 'Fond en vinyle',
                description: 'Sélectionnez votre couleur de fond en vinyle',
              },
              it: {
                title: 'Sfondo in vinile',
                description: 'Seleziona il colore dello sfondo in vinile',
              },
            },
          },
          // Dropdown option
          {
            type: 'dropdown',
            items: [
              {
                id: 'option-small',
                translations: {
                  en: { title: 'Small', description: 'Small size - 5cm x 5cm' },
                  de: {
                    title: 'Klein',
                    description: 'Kleine Größe - 5cm x 5cm',
                  },
                  fr: {
                    title: 'Petit',
                    description: 'Petite taille - 5cm x 5cm',
                  },
                  it: {
                    title: 'Piccolo',
                    description: 'Dimensione piccola - 5cm x 5cm',
                  },
                },
              },
              {
                id: 'option-medium',
                translations: {
                  en: {
                    title: 'Medium',
                    description: 'Medium size - 10cm x 10cm',
                  },
                  de: {
                    title: 'Mittel',
                    description: 'Mittlere Größe - 10cm x 10cm',
                  },
                  fr: {
                    title: 'Moyen',
                    description: 'Taille moyenne - 10cm x 10cm',
                  },
                  it: {
                    title: 'Medio',
                    description: 'Dimensione media - 10cm x 10cm',
                  },
                },
              },
              {
                id: 'option-large',
                translations: {
                  en: {
                    title: 'Large',
                    description: 'Large size - 15cm x 15cm',
                  },
                  de: {
                    title: 'Groß',
                    description: 'Große Größe - 15cm x 15cm',
                  },
                  fr: {
                    title: 'Grand',
                    description: 'Grande taille - 15cm x 15cm',
                  },
                  it: {
                    title: 'Grande',
                    description: 'Dimensione grande - 15cm x 15cm',
                  },
                },
              },
            ],
            translations: {
              en: {
                title: 'Size Selection',
                description: 'Choose your preferred size',
              },
              de: {
                title: 'Größenauswahl',
                description: 'Wählen Sie Ihre bevorzugte Größe',
              },
              fr: {
                title: 'Sélection de taille',
                description: 'Choisissez votre taille préférée',
              },
              it: {
                title: 'Selezione della dimensione',
                description: 'Scegli la tua dimensione preferita',
              },
            },
          },
        ],
      };

      // Get the first group for association
      const firstGroup = await prisma.group.findFirst();
      const groupId = firstGroup?.id;

      // Create the demo sticker
      const demoSticker = await prisma.sticker.create({
        data: {
          pricePerCm2Printable: 0.15,
          pricePerCm2Vinyl: 0.2,
          quantity: 1000,
          printable: true,
          vinyl: true,
          standardMethod: 'vinyl',
          customizationOptions: customizationOptions,
          images: [
            'demo-customizable-sticker.jpg',
            'demo-customizable-sticker-alt.jpg',
          ],
          sortingRank: 0, // Put it at the top
          widthToHeightRatio: 1.0, // Square
          active: true,
          textToWidthResponsiveness: true,
          translations: {
            create: [
              {
                language: 'en',
                title: 'Demo Customizable Sticker',
                description:
                  'A demo sticker with multiple customization options',
              },
              {
                language: 'de',
                title: 'Demo Anpassbarer Aufkleber',
                description:
                  'Ein Demo-Aufkleber mit mehreren Anpassungsoptionen',
              },
              {
                language: 'fr',
                title: 'Autocollant personnalisable de démo',
                description:
                  'Un autocollant de démo avec plusieurs options de personnalisation',
              },
              {
                language: 'it',
                title: 'Adesivo personalizzabile demo',
                description:
                  'Un adesivo demo con più opzioni di personalizzazione',
              },
            ],
          },
          groups: groupId
            ? {
                connect: [{ id: groupId }],
              }
            : undefined,
        },
        include: {
          translations: true,
          groups: true,
        },
      });

      console.log('Created demo customizable sticker:', demoSticker.id);
    } else {
      console.log('Demo sticker already exists, skipping creation');
    }
  } catch (error) {
    console.error('Failed to create demo sticker:', error);
  }

  console.log('Sticker seeding completed!');
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
