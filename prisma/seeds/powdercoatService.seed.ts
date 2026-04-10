import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';

dotenv.config();
const prisma = new PrismaClient();

async function main() {
  console.log('Starting powdercoat service seeding...');

  // Clear existing data first
  await prisma.powdercoating_service.deleteMany({});
  console.log('Cleared existing powdercoat services');

  // Sample service names and descriptions
  const serviceData = [
    {
      name: 'Standard Powder Coating',
      description:
        'Basic powder coating service with standard colors. Perfect for everyday use with excellent durability and finish quality.',
      images: [
        'https://example.com/images/standard-coating-1.jpg',
        'https://example.com/images/standard-coating-2.jpg',
      ],
      price: 45,
      active: true,
    },
    {
      name: 'Premium Metallic Finish',
      description:
        'High-end metallic powder coating with superior shine and depth. Ideal for premium applications requiring exceptional appearance.',
      images: [
        'https://example.com/images/metallic-finish-1.jpg',
        'https://example.com/images/metallic-finish-2.jpg',
        'https://example.com/images/metallic-finish-3.jpg',
      ],
      price: 85,
      active: true,
    },
    {
      name: 'Textured Coating',
      description:
        'Specialized textured powder coating providing enhanced grip and unique visual appeal. Great for performance applications.',
      images: [
        'https://example.com/images/textured-coating-1.jpg',
        'https://example.com/images/textured-coating-2.jpg',
      ],
      price: 65,
      active: true,
    },
    {
      name: 'Matte Black Finish',
      description:
        'Sleek matte black powder coating for a modern, sophisticated look. Popular choice for contemporary designs.',
      images: [
        'https://example.com/images/matte-black-1.jpg',
        'https://example.com/images/matte-black-2.jpg',
        'https://example.com/images/matte-black-3.jpg',
        'https://example.com/images/matte-black-4.jpg',
      ],
      price: 55,
      active: true,
    },
    {
      name: 'Custom Color Matching',
      description:
        'Professional color matching service to achieve your exact color requirements. Perfect for brand consistency or specific design needs.',
      images: [
        'https://example.com/images/custom-color-1.jpg',
        'https://example.com/images/custom-color-2.jpg',
        'https://example.com/images/custom-color-3.jpg',
      ],
      price: 95,
      active: true,
    },
    {
      name: 'High-Temperature Coating',
      description:
        'Specialized high-temperature resistant powder coating for extreme conditions. Maintains integrity and appearance under heat stress.',
      images: [
        'https://example.com/images/high-temp-1.jpg',
        'https://example.com/images/high-temp-2.jpg',
      ],
      price: 75,
      active: true,
    },
    {
      name: 'Anti-Corrosion Treatment',
      description:
        'Advanced anti-corrosion powder coating system providing maximum protection against rust and environmental damage.',
      images: [
        'https://example.com/images/anti-corrosion-1.jpg',
        'https://example.com/images/anti-corrosion-2.jpg',
        'https://example.com/images/anti-corrosion-3.jpg',
      ],
      price: 105,
      active: true,
    },
    {
      name: 'Gloss White Premium',
      description:
        'High-gloss white powder coating with exceptional brightness and UV resistance. Classic choice for clean, professional appearance.',
      images: [
        'https://example.com/images/gloss-white-1.jpg',
        'https://example.com/images/gloss-white-2.jpg',
      ],
      price: 50,
      active: true,
    },
    {
      name: 'Candy Apple Red',
      description:
        'Vibrant candy apple red with deep, rich color and high-gloss finish. Eye-catching option for special projects.',
      images: [
        'https://example.com/images/candy-red-1.jpg',
        'https://example.com/images/candy-red-2.jpg',
        'https://example.com/images/candy-red-3.jpg',
      ],
      price: 90,
      active: true,
    },
    {
      name: 'Vintage Bronze Effect',
      description:
        'Antiqued bronze powder coating with weathered appearance. Perfect for restoration projects or vintage-style applications.',
      images: [
        'https://example.com/images/vintage-bronze-1.jpg',
        'https://example.com/images/vintage-bronze-2.jpg',
      ],
      price: 70,
      active: false,
    },
    {
      name: 'Electric Blue Metallic',
      description:
        'Striking electric blue with metallic flakes creating dynamic color shifts. Bold choice for performance and show applications.',
      images: [
        'https://example.com/images/electric-blue-1.jpg',
        'https://example.com/images/electric-blue-2.jpg',
        'https://example.com/images/electric-blue-3.jpg',
        'https://example.com/images/electric-blue-4.jpg',
      ],
      price: 88,
      active: true,
    },
    {
      name: 'Clear Protective Coat',
      description:
        'Transparent protective powder coating preserving natural material appearance while providing excellent protection.',
      images: [
        'https://example.com/images/clear-coat-1.jpg',
        'https://example.com/images/clear-coat-2.jpg',
      ],
      price: 40,
      active: true,
    },
  ];

  // Create powdercoat services
  console.log('Creating powdercoat services...');

  for (const service of serviceData) {
    const createdService = await prisma.powdercoating_service.create({
      data: {
        name: service.name,
        description: service.description,
        images: service.images,
        price: service.price,
        active: service.active,
      },
    });

    console.log(
      `✅ Created powdercoat service: ${createdService.name} (ID: ${createdService.id})`,
    );
  }

  console.log(
    `\n🎉 Successfully seeded ${serviceData.length} powdercoat services!`,
  );
  console.log(`Active services: ${serviceData.filter((s) => s.active).length}`);
  console.log(
    `Inactive services: ${serviceData.filter((s) => !s.active).length}`,
  );
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
