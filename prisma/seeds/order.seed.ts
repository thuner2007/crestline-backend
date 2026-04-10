import {
  PrismaClient,
  sticker_order_paymentmethod_enum,
  sticker_order_status_enum,
} from '@prisma/client';
import * as dotenv from 'dotenv';

dotenv.config();
const prisma = new PrismaClient();

function getRandomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomItems<T>(arr: T[], count: number): T[] {
  const shuffled = [...arr].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, Math.min(count, arr.length));
}

function getRandomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomDecimal(min: number, max: number, decimals = 2): number {
  const factor = Math.pow(10, decimals);
  return Math.round((Math.random() * (max - min) + min) * factor) / factor;
}

function randomPastDate(daysBack = 365): Date {
  const now = Date.now();
  const ms = Math.floor(Math.random() * daysBack * 24 * 60 * 60 * 1000);
  return new Date(now - ms);
}

function randomAlphanumeric(length: number): string {
  const chars =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  return Array.from(
    { length },
    () => chars[Math.floor(Math.random() * chars.length)],
  ).join('');
}

function generatePaymentId(
  method: sticker_order_paymentmethod_enum,
  status: sticker_order_status_enum,
): string | null {
  // Only statuses where payment was actually processed
  const paidStatuses: sticker_order_status_enum[] = [
    sticker_order_status_enum.processing,
    sticker_order_status_enum.completed,
  ];
  const maybeStatuses: sticker_order_status_enum[] = [
    sticker_order_status_enum.pending,
    sticker_order_status_enum.cancelled,
  ];

  if (paidStatuses.includes(status)) {
    // always has a payment ID
  } else if (maybeStatuses.includes(status) && Math.random() > 0.5) {
    // sometimes has a payment ID
  } else {
    return null;
  }

  switch (method) {
    case sticker_order_paymentmethod_enum.stripe:
    case sticker_order_paymentmethod_enum.card:
      return `pi_${randomAlphanumeric(24)}`;
    case sticker_order_paymentmethod_enum.paypal:
      return randomAlphanumeric(17).toUpperCase();
    case sticker_order_paymentmethod_enum.bank_transfer:
      return `REF-${new Date().getFullYear()}-${randomAlphanumeric(8).toUpperCase()}`;
    case sticker_order_paymentmethod_enum.twint:
      return `TW-${randomAlphanumeric(20).toUpperCase()}`;
    case sticker_order_paymentmethod_enum.other:
    default:
      return `TXN-${randomAlphanumeric(16).toUpperCase()}`;
  }
}

const FIRST_NAMES = [
  'Anna',
  'Max',
  'Lena',
  'Felix',
  'Sophie',
  'Jonas',
  'Laura',
  'Tim',
  'Julia',
  'Markus',
  'Sarah',
  'David',
  'Nico',
  'Lisa',
  'Stefan',
  'Marie',
  'Jan',
  'Nina',
  'Thomas',
  'Katharina',
  'Alexander',
  'Emma',
  'Lukas',
  'Hannah',
];

const LAST_NAMES = [
  'Müller',
  'Schmidt',
  'Schneider',
  'Fischer',
  'Weber',
  'Meyer',
  'Wagner',
  'Becker',
  'Schulz',
  'Hoffmann',
  'Koch',
  'Richter',
  'Klein',
  'Wolf',
  'Schröder',
  'Lange',
  'Braun',
  'Zimmermann',
  'Krüger',
  'Hartmann',
  'Huber',
  'Bauer',
];

const STREETS = [
  'Hauptstraße',
  'Bahnhofstraße',
  'Gartenstraße',
  'Schulstraße',
  'Bergstraße',
  'Kirchstraße',
  'Waldstraße',
  'Lindenstraße',
  'Rosenstraße',
  'Ringstraße',
];

const CITIES = [
  { city: 'Berlin', zip: '10115', country: 'DE' },
  { city: 'München', zip: '80331', country: 'DE' },
  { city: 'Hamburg', zip: '20095', country: 'DE' },
  { city: 'Köln', zip: '50667', country: 'DE' },
  { city: 'Frankfurt', zip: '60311', country: 'DE' },
  { city: 'Wien', zip: '1010', country: 'AT' },
  { city: 'Zürich', zip: '8001', country: 'CH' },
  { city: 'Basel', zip: '4001', country: 'CH' },
  { city: 'Graz', zip: '8010', country: 'AT' },
  { city: 'Stuttgart', zip: '70173', country: 'DE' },
];

const PAYMENT_METHODS = Object.values(sticker_order_paymentmethod_enum);
const ORDER_STATUSES = Object.values(sticker_order_status_enum).filter(
  (s) => s !== sticker_order_status_enum.cart_temp,
);

// Weighted status list: ~80% of orders will be completed/pending/processing
const WEIGHTED_ORDER_STATUSES: sticker_order_status_enum[] = [
  ...Array(35).fill(sticker_order_status_enum.completed),
  ...Array(25).fill(sticker_order_status_enum.pending),
  ...Array(20).fill(sticker_order_status_enum.processing),
  ...Array(10).fill(sticker_order_status_enum.cancelled),
  ...Array(10).fill(sticker_order_status_enum.stand),
];

const POWDERCOAT_COLORS = [
  'RAL 9005 Jet Black',
  'RAL 9010 Pure White',
  'RAL 3020 Traffic Red',
  'RAL 5015 Sky Blue',
  'RAL 6018 Yellow Green',
  'RAL 1021 Rape Yellow',
  'RAL 7016 Anthracite Grey',
  'RAL 8017 Chocolate Brown',
];

async function main() {
  console.log('Starting order seeding...');

  // Load existing data
  const stickers = await prisma.sticker.findMany({ where: { active: true } });
  const parts = await prisma.part.findMany({ where: { active: true } });
  const powdercoatServices = await prisma.powdercoating_service.findMany({
    where: { active: true },
  });
  const users = await prisma.user.findMany();

  console.log(
    `Found ${stickers.length} stickers, ${parts.length} parts, ` +
      `${powdercoatServices.length} powdercoat services, ${users.length} users`,
  );

  const ORDER_COUNT = 120;
  let createdCount = 0;

  for (let i = 0; i < ORDER_COUNT; i++) {
    const locationData = getRandomItem(CITIES);
    const firstName = getRandomItem(FIRST_NAMES);
    const lastName = getRandomItem(LAST_NAMES);
    const street = getRandomItem(STREETS);
    const houseNumber = String(getRandomInt(1, 200));
    const paymentMethod = getRandomItem(PAYMENT_METHODS);
    const status = getRandomItem(WEIGHTED_ORDER_STATUSES);
    const orderDate = randomPastDate(730);
    const paymentId = generatePaymentId(paymentMethod, status);

    // Decide if order belongs to a registered user or a guest
    const isUserOrder = users.length > 0 && Math.random() > 0.4;
    const user = isUserOrder ? getRandomItem(users) : null;
    const guestEmail = !isUserOrder
      ? `${firstName.toLowerCase()}.${lastName.toLowerCase()}${getRandomInt(1, 99)}@example.com`
      : null;
    const orderEmail = user?.email ?? guestEmail ?? `guest${i}@example.com`;

    // Build order items
    const stickerItemsData: {
      stickerId?: string;
      width: number;
      height: number;
      vinyl: boolean;
      printed: boolean;
      quantity: number;
      customizationOptions: object;
    }[] = [];
    const partItemsData: {
      partId?: string;
      quantity: number;
      customizationOptions: object;
    }[] = [];
    const powdercoatItemsData: {
      powdercoatingServiceId?: string;
      color: string;
      quantity: number;
      customizationOptions: object;
    }[] = [];

    let itemTotal = 0;

    // Add sticker items (0-3)
    if (stickers.length > 0) {
      const numStickerItems = getRandomInt(0, Math.min(3, stickers.length));
      const chosenStickers = getRandomItems(stickers, numStickerItems);
      for (const sticker of chosenStickers) {
        const width = getRandomDecimal(5, 30);
        const height = getRandomDecimal(5, 30);
        const vinyl = sticker.vinyl && Math.random() > 0.4;
        const printed = sticker.printable && !vinyl;
        const quantity = getRandomInt(1, 5);

        const unitPrice = sticker.generalPrice
          ? Number(sticker.generalPrice)
          : sticker.pricePerCm2Vinyl
            ? Number(sticker.pricePerCm2Vinyl) * width * height
            : getRandomDecimal(3, 20);

        itemTotal += unitPrice * quantity;

        stickerItemsData.push({
          stickerId: sticker.id,
          width,
          height,
          vinyl: vinyl || (!vinyl && !printed),
          printed,
          quantity,
          customizationOptions: {},
        });
      }
    }

    // Add part items (0-2)
    if (parts.length > 0 && Math.random() > 0.5) {
      const numPartItems = getRandomInt(1, Math.min(2, parts.length));
      const chosenParts = getRandomItems(parts, numPartItems);
      for (const part of chosenParts) {
        const quantity = getRandomInt(1, 3);
        itemTotal += Number(part.price) * quantity;
        partItemsData.push({
          partId: part.id,
          quantity,
          customizationOptions: {},
        });
      }
    }

    // Add powdercoat items (0-1)
    if (powdercoatServices.length > 0 && Math.random() > 0.7) {
      const service = getRandomItem(powdercoatServices);
      const quantity = getRandomInt(1, 2);
      itemTotal += Number(service.price) * quantity;
      powdercoatItemsData.push({
        powdercoatingServiceId: service.id,
        color: getRandomItem(POWDERCOAT_COLORS),
        quantity,
        customizationOptions: {},
      });
    }

    // Ensure at least one item
    if (
      stickerItemsData.length === 0 &&
      partItemsData.length === 0 &&
      powdercoatItemsData.length === 0 &&
      stickers.length > 0
    ) {
      const sticker = getRandomItem(stickers);
      const width = getRandomDecimal(5, 30);
      const height = getRandomDecimal(5, 30);
      const quantity = getRandomInt(1, 3);
      const unitPrice = sticker.generalPrice
        ? Number(sticker.generalPrice)
        : getRandomDecimal(3, 20);
      itemTotal += unitPrice * quantity;
      stickerItemsData.push({
        stickerId: sticker.id,
        width,
        height,
        vinyl: true,
        printed: false,
        quantity,
        customizationOptions: {},
      });
    }

    const shipmentCost = itemTotal > 50 ? 0 : getRandomDecimal(4.9, 9.9);
    const totalPrice = Math.round((itemTotal + shipmentCost) * 100) / 100;

    await prisma.sticker_order.create({
      data: {
        firstName,
        lastName,
        email: orderEmail,
        phone: `+49${getRandomInt(1500000000, 1799999999)}`,
        street,
        houseNumber,
        zipCode: locationData.zip,
        city: locationData.city,
        country: locationData.country,
        paymentMethod,
        status,
        ...(paymentId ? { paymentId } : {}),
        totalPrice,
        shipmentCost,
        orderDate,
        ...(user ? { userId: user.id } : {}),
        ...(guestEmail ? { guestEmail } : {}),
        items: {
          create: stickerItemsData.map((item) => ({
            stickerId: item.stickerId,
            width: item.width,
            height: item.height,
            vinyl: item.vinyl,
            printed: item.printed,
            quantity: item.quantity,
            customizationOptions: item.customizationOptions,
          })),
        },
        partItems: {
          create: partItemsData.map((item) => ({
            partId: item.partId,
            quantity: item.quantity,
            customizationOptions: item.customizationOptions,
          })),
        },
        powdercoatItems: {
          create: powdercoatItemsData.map((item) => ({
            powdercoatingServiceId: item.powdercoatingServiceId,
            color: item.color,
            quantity: item.quantity,
            customizationOptions: item.customizationOptions,
          })),
        },
      },
    });

    createdCount++;
    if (createdCount % 20 === 0) {
      console.log(`  Created ${createdCount}/${ORDER_COUNT} orders...`);
    }
  }

  console.log(`\nOrder seeding completed! Created ${createdCount} orders.`);
}

main()
  .catch((e) => {
    console.error('Error during order seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
