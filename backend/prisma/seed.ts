import { PrismaClient, Role, MachineryBookingStatus, PaymentStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

declare const process: {
  exit: (code?: number) => never;
};

const prisma = new PrismaClient();

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-');
}

const CATEGORIES = [
  { name: 'Seeds', description: 'Certified seeds across crop varieties.' },
  { name: 'Fertilizers', description: 'Organic and chemical fertilizers.' },
  { name: 'Farming Equipment', description: 'Hand tools and small farm equipment.' },
  { name: 'Machinery', description: 'Tractors, harvesters, and rentable heavy machinery.' },
  { name: 'Building Materials', description: 'Materials for farm structures and storage.' },
  { name: 'Oil Products', description: 'Agricultural and industrial oil products.' },
  { name: 'Milk & Dairy', description: 'Dairy products and dairy-farming supplies.' },
];

const CROPS = [
  { name: 'Wheat', category: 'Cereals', unit: 'Quintal' },
  { name: 'Rice', category: 'Cereals', unit: 'Quintal' },
  { name: 'Onion', category: 'Vegetables', unit: 'Quintal' },
  { name: 'Tomato', category: 'Vegetables', unit: 'Quintal' },
  { name: 'Potato', category: 'Vegetables', unit: 'Quintal' },
  { name: 'Soybean', category: 'Oilseeds', unit: 'Quintal' },
  { name: 'Cotton', category: 'Fibres', unit: 'Quintal' },
  { name: 'Chana (Gram)', category: 'Pulses', unit: 'Quintal' },
];

const MACHINERY_CATEGORIES = [
  {
    name: 'Tractors',
    description: 'Heavy duty, utility, and compact tractors for plowing, hauling, and field operations.',
    imageUrl: 'https://images.unsplash.com/photo-1592878904946-b3cd8ae243d0?q=80&w=800&auto=format&fit=crop',
  },
  {
    name: 'Harvesters & Combines',
    description: 'High-efficiency combine harvesters, paddy reapers, and grain threshing machinery.',
    imageUrl: 'https://images.unsplash.com/photo-1595838788344-93335552b97c?q=80&w=800&auto=format&fit=crop',
  },
  {
    name: 'Tillage & Soil Prep',
    description: 'Rotavators, disc harrows, cultivators, subsoilers, and laser land levelers.',
    imageUrl: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?q=80&w=800&auto=format&fit=crop',
  },
  {
    name: 'Sowing & Planting',
    description: 'Pneumatic seed drills, multi-crop planters, and automatic paddy transplanters.',
    imageUrl: 'https://images.unsplash.com/photo-1530507629858-e4977d30e9e0?q=80&w=800&auto=format&fit=crop',
  },
  {
    name: 'Sprayers & Protection',
    description: 'Tractor-mounted boom sprayers, orchard mist sprayers, and crop protection drones.',
    imageUrl: 'https://images.unsplash.com/photo-1508614589041-895b88991e3e?q=80&w=800&auto=format&fit=crop',
  },
];

async function main() {
  console.log('Seeding marketplace categories...');
  for (const cat of CATEGORIES) {
    await prisma.category.upsert({
      where: { slug: slugify(cat.name) },
      update: {},
      create: { name: cat.name, slug: slugify(cat.name), description: cat.description },
    });
  }

  console.log('Seeding crops...');
  for (const crop of CROPS) {
    await prisma.crop.upsert({
      where: { name: crop.name },
      update: {},
      create: crop,
    });
  }

  console.log('Seeding admin user...');
  const adminEmail = 'admin@agrimarketplace.com';
  const existingAdmin = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash('ChangeMe123!', 10);
    await prisma.user.create({
      data: {
        name: 'Platform Admin',
        email: adminEmail,
        passwordHash,
        role: Role.ADMIN,
        isEmailVerified: true,
      },
    });
    console.log(`Admin created: ${adminEmail} / ChangeMe123!`);
  }

  console.log('Seeding machinery categories...');
  for (const cat of MACHINERY_CATEGORIES) {
    const slug = slugify(cat.name);
    await prisma.machineryCategory.upsert({
      where: { slug },
      update: { description: cat.description, imageUrl: cat.imageUrl },
      create: {
        name: cat.name,
        slug,
        description: cat.description,
        imageUrl: cat.imageUrl,
        isActive: true,
      },
    });
  }

  console.log('Seed complete with marketplace taxonomy and machinery categories.');
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
