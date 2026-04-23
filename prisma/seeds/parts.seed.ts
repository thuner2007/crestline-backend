import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';

dotenv.config();
const prisma = new PrismaClient();

// Helper function to get random int between min and max (inclusive)
function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function main() {
  console.log('Starting parts seeding...');

  // Load existing part groups so parts can be connected to them
  const partGroups = await prisma.part_group.findMany({
    include: { translations: true },
  });

  // Build a lookup map: English title (lowercase) → group id
  const groupByName = new Map<string, string>();
  for (const pg of partGroups) {
    const enTitle =
      pg.translations.find((t) => t.language === 'en')?.title?.toLowerCase() ??
      '';
    if (enTitle) groupByName.set(enTitle, pg.id);
  }

  // Ensure part sections exist (create them if missing so parts seed is self-contained)
  const defaultSections = [
    {
      sortingRank: 1,
      translations: {
        en: { title: 'Plate Holders', description: 'License plate holders and mounts' },
        de: { title: 'Nummernschildhalter', description: 'Nummernschildhalter und Halterungen' },
        fr: { title: 'Porte-plaques', description: "Porte-plaques d'immatriculation et supports" },
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

  for (const s of defaultSections) {
    const exists = await prisma.part_section_translation.findFirst({
      where: { language: 'en', title: s.translations.en.title },
    });
    if (!exists) {
      await prisma.part_section.create({
        data: {
          sortingRank: s.sortingRank,
          active: true,
          translations: {
            create: Object.entries(s.translations).map(([lang, tr]) => ({
              language: lang,
              title: tr.title,
              description: tr.description ?? null,
            })),
          },
        },
      });
      console.log(`Created section: ${s.translations.en.title}`);
    }
  }

  // Load part sections (now guaranteed to exist)
  const partSections = await prisma.part_section.findMany({
    include: { translations: true },
    orderBy: { sortingRank: 'asc' },
  });

  // Resolve a group id from a part title keyword
  function resolveGroupId(partTitle: string): string | null {
    const t = partTitle.toLowerCase();
    if (t.includes('frame')) return groupByName.get('frames') ?? null;
    if (t.includes('wheel') || t.includes('spokes'))
      return groupByName.get('wheels') ?? null;
    if (
      t.includes('bolt') ||
      t.includes('bearing') ||
      t.includes('screw') ||
      t.includes('axle') ||
      t.includes('mount') ||
      t.includes('pivot') ||
      t.includes('hardware')
    )
      return groupByName.get('hardware') ?? null;
    if (t.includes('grip') || t.includes('riser') || t.includes('tool'))
      return groupByName.get('accessories') ?? null;
    return groupByName.get('general parts') ?? null;
  }

  // Distribute parts across sections round-robin (so every section has parts)
  function resolveSectionId(index: number): string | null {
    if (partSections.length === 0) return null;
    return partSections[index % partSections.length].id;
  }

  // Generate 30 parts with randomized properties
  const partsData = [];
  const titles = [
    'Frame Component',
    'Wheel Set',
    'Bolt Kit',
    'Bearing',
    'Screws Pack',
    'Axle',
    'Spokes Set',
    'Grip Tape',
    'Riser Pad',
    'Shock Absorber',
    'Tool Kit',
    'Mount Bracket',
    'Pivot Cup',
    'Bushings',
    'Hardware Kit',
  ];

  for (let i = 1; i <= 30; i++) {
    const title = titles[Math.floor(Math.random() * titles.length)] + ` ${i}`;

    // Create random customization options based on new structure
    const customizationOptions = {
      options: [
        // Color option
        {
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
        },
      ],
    };

    // Add dropdown option with size options
    const dropdownItems = [];
    const dropdownOptions = ['Small', 'Medium', 'Large', 'Custom'];

    const dropdownPriceAdjustments = [0, 2.50, 5.00];

    for (let j = 0; j < 3; j++) {
      dropdownItems.push({
        id: `option-${j + 1}`,
        priceAdjustment: dropdownPriceAdjustments[j],
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
    } as any);

    // Add notes field
    customizationOptions.options.push({
      type: 'inputfield',
      translations: {
        en: {
          title: 'Special Instructions',
          description: 'Any special instructions for this part',
        },
        de: {
          title: 'Besondere Anweisungen',
          description: 'Besondere Anweisungen für dieses Teil',
        },
        fr: {
          title: 'Instructions spéciales',
          description: 'Instructions spéciales pour cette pièce',
        },
        it: {
          title: 'Istruzioni speciali',
          description: 'Istruzioni speciali per questa parte',
        },
      },
    });

    const groupId = resolveGroupId(title);
    const sectionId = resolveSectionId(i - 1);

    const part = {
      price: parseFloat((Math.random() * 50 + 5).toFixed(2)),
      quantity: getRandomInt(10, 200),
      width: (Math.random() * 30 + 5).toFixed(2), // Random width between 5-35 cm
      height: (Math.random() * 30 + 5).toFixed(2), // Random height between 5-35 cm
      customizationOptions: customizationOptions,
      images: [`part-${i}.jpg`, `part-${i}-alt.jpg`],
      sortingRank: i,
      active: Math.random() > 0.1, // 90% of parts are active
      groupId,
      sectionId,
      translations: [
        {
          language: 'en',
          title: title,
          description: `This is a ${title.toLowerCase()} for your skateboard.`,
        },
        {
          language: 'de',
          title: `${title} DE`,
          description: `Dies ist ein ${title.toLowerCase()} für Ihr Skateboard.`,
        },
        {
          language: 'fr',
          title: `${title} FR`,
          description: `C'est un ${title.toLowerCase()} pour votre skateboard.`,
        },
        {
          language: 'it',
          title: `${title} IT`,
          description: `Questo è un ${title.toLowerCase()} per il tuo skateboard.`,
        },
      ],
    };

    partsData.push(part);
  }

  // Create all parts
  for (let i = 0; i < partsData.length; i++) {
    const data = partsData[i];
    const { translations, groupId, sectionId, ...partInfo } = data as any;

    try {
      // Prepare the part data
      const createData: any = {
        ...partInfo,
        translations: {
          create: translations,
        },
        ...(groupId && {
          groups: { connect: [{ id: groupId }] },
        }),
        ...(sectionId && {
          sections: { connect: [{ id: sectionId }] },
        }),
      };

      // Create the part
      const part = await prisma.part.create({
        data: createData,
        include: {
          translations: true,
          groups: true,
        },
      });

      console.log(
        `Created part ${i + 1}/30: ${part.id} → group: ${
          (part as any).groups?.[0]?.id ?? 'none'
        }`,
      );

      // Create option stocks for the dropdown items (dropdown is at index 1)
      const dropdownOptionId = '1';
      const dropdownItemIds = ['option-1', 'option-2', 'option-3'];
      for (const itemId of dropdownItemIds) {
        await prisma.part_option_stock.create({
          data: {
            partId: part.id,
            optionId: dropdownOptionId,
            optionItemId: itemId,
            quantity: getRandomInt(0, 50),
          },
        });
      }
    } catch (error) {
      console.error(`Failed to create part ${i + 1}:`, error);
    }
  }

  try {
    // Check if our demo part already exists
    const existingPart = await prisma.part.findFirst({
      where: {
        translations: {
          some: {
            title: 'Demo Customizable Part',
            language: 'en',
          },
        },
      },
    });

    if (!existingPart) {
      // Detailed customization options for our demo part
      const customizationOptions = {
        options: [
          // Text input option
          {
            type: 'inputfield',
            max: 50,
            translations: {
              en: {
                title: 'Custom Engraving',
                description:
                  'Enter text to be engraved on this part (max 50 characters)',
              },
              de: {
                title: 'Benutzerdefinierte Gravur',
                description:
                  'Geben Sie Text ein, der auf diesem Teil graviert werden soll (max. 50 Zeichen)',
              },
              fr: {
                title: 'Gravure personnalisée',
                description:
                  'Entrez le texte à graver sur cette pièce (50 caractères max)',
              },
              it: {
                title: 'Incisione personalizzata',
                description:
                  'Inserisci il testo da incidere su questa parte (massimo 50 caratteri)',
              },
            },
          },
          // Color selection option
          {
            type: 'color',
            translations: {
              en: {
                title: 'Part Color',
                description: 'Choose the color for your part',
              },
              de: {
                title: 'Teilfarbe',
                description: 'Wählen Sie die Farbe für Ihr Teil',
              },
              fr: {
                title: 'Couleur de la pièce',
                description: 'Choisissez la couleur pour votre pièce',
              },
              it: {
                title: 'Colore della parte',
                description: 'Scegli il colore per la tua parte',
              },
            },
          },
          // Dropdown option
          {
            type: 'dropdown',
            items: [
              {
                id: 'material-steel',
                priceAdjustment: 0,
                translations: {
                  en: {
                    title: 'Steel',
                    description: 'Durable steel construction',
                  },
                  de: {
                    title: 'Stahl',
                    description: 'Langlebige Stahlkonstruktion',
                  },
                  fr: {
                    title: 'Acier',
                    description: 'Construction durable en acier',
                  },
                  it: {
                    title: 'Acciaio',
                    description: 'Costruzione durevole in acciaio',
                  },
                },
              },
              {
                id: 'material-aluminum',
                priceAdjustment: 3.50,
                translations: {
                  en: {
                    title: 'Aluminum',
                    description: 'Lightweight aluminum construction (+CHF 3.50)',
                  },
                  de: {
                    title: 'Aluminium',
                    description: 'Leichte Aluminiumkonstruktion (+CHF 3.50)',
                  },
                  fr: {
                    title: 'Aluminium',
                    description: 'Construction légère en aluminium (+CHF 3.50)',
                  },
                  it: {
                    title: 'Alluminio',
                    description: 'Costruzione leggera in alluminio (+CHF 3.50)',
                  },
                },
              },
              {
                id: 'material-titanium',
                priceAdjustment: 9.99,
                translations: {
                  en: {
                    title: 'Titanium',
                    description: 'Premium titanium construction (+CHF 9.99)',
                  },
                  de: {
                    title: 'Titan',
                    description: 'Premium-Titankonstruktion (+CHF 9.99)',
                  },
                  fr: {
                    title: 'Titane',
                    description: 'Construction premium en titane (+CHF 9.99)',
                  },
                  it: {
                    title: 'Titanio',
                    description: 'Costruzione premium in titanio (+CHF 9.99)',
                  },
                },
              },
            ],
            translations: {
              en: {
                title: 'Material Selection',
                description: 'Choose your preferred material',
              },
              de: {
                title: 'Materialauswahl',
                description: 'Wählen Sie Ihr bevorzugtes Material',
              },
              fr: {
                title: 'Sélection de matériau',
                description: 'Choisissez votre matériau préféré',
              },
              it: {
                title: 'Selezione del materiale',
                description: 'Scegli il tuo materiale preferito',
              },
            },
          },
        ],
      };

      const customGroupId = groupByName.get('custom parts') ?? null;
      const demoSectionId = partSections[0]?.id ?? null;

      // Create the demo part
      const demoPart = await prisma.part.create({
        data: {
          price: 29.99,
          quantity: 500,
          width: 15.5, // Width in cm
          height: 20.0, // Height in cm
          customizationOptions: customizationOptions,
          images: [
            'demo-customizable-part.jpg',
            'demo-customizable-part-alt.jpg',
          ],
          sortingRank: 0, // Put it at the top
          active: true,
          ...(customGroupId && {
            groups: { connect: [{ id: customGroupId }] },
          }),
          ...(demoSectionId && {
            sections: { connect: [{ id: demoSectionId }] },
          }),
          translations: {
            create: [
              {
                language: 'en',
                title: 'Demo Customizable Part',
                description: 'A demo part with multiple customization options',
              },
              {
                language: 'de',
                title: 'Demo anpassbares Teil',
                description: 'Ein Demo-Teil mit mehreren Anpassungsoptionen',
              },
              {
                language: 'fr',
                title: 'Pièce personnalisable de démo',
                description:
                  'Une pièce de démo avec plusieurs options de personnalisation',
              },
              {
                language: 'it',
                title: 'Parte personalizzabile demo',
                description:
                  'Una parte demo con più opzioni di personalizzazione',
              },
            ],
          },
        },
        include: {
          translations: true,
          groups: true,
        },
      });

      console.log('Created demo customizable part:', demoPart.id);

      // Create option stocks for the demo part's dropdown items (dropdown is at index 2)
      const demoDropdownOptionId = '2';
      const demoDropdownItemIds = [
        'material-steel',
        'material-aluminum',
        'material-titanium',
      ];
      for (const itemId of demoDropdownItemIds) {
        await prisma.part_option_stock.create({
          data: {
            partId: demoPart.id,
            optionId: demoDropdownOptionId,
            optionItemId: itemId,
            quantity: getRandomInt(10, 100),
          },
        });
      }
    } else {
      console.log('Demo part already exists, skipping creation');
    }
  } catch (error) {
    console.error('Failed to create demo part:', error);
  }

  console.log('Parts seeding completed!');
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
