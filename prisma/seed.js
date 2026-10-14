import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed for HARI HARA Jewellery Works...');

  // 1. Seed Admin User
  const adminEmail = process.env.INITIAL_ADMIN_EMAIL || 'admin@hariharajewellery.com';
  const adminPassword = process.env.INITIAL_ADMIN_PASSWORD || 'SecureAdminPassword@2026';
  const adminName = process.env.INITIAL_ADMIN_NAME || 'L. Srinivasa Chary (Admin)';

  const passwordHash = await bcrypt.hash(adminPassword, 10);

  const admin = await prisma.adminUser.upsert({
    where: { email: adminEmail },
    update: {
      name: adminName,
      passwordHash: passwordHash,
      role: 'SUPER_ADMIN',
    },
    create: {
      name: adminName,
      email: adminEmail,
      passwordHash: passwordHash,
      role: 'SUPER_ADMIN',
    },
  });
  console.log(`✅ Admin account configured: ${admin.email}`);

  // 2. Seed Shop Settings
  const settingsData = {
    shopName: 'HARI HARA Jewellery Works',
    tagline: 'We Make All Types of Gold & Silver Ornaments in 91.6 KDM Hall Marke With Guarantee',
    logoUrl: '/lord-shiva-logo.png',
    address: 'S.No. 18-7-466/2/B/42, Near Uppuguda Railway Station, Ambica Nagar, Uppuguda, Hyderabad, Telangana - 500053',
    phone: '+91 98485 43615 / +91 93946 47299',
    whatsappNumber: '+919848543615',
    email: 'contact@hariharajewellery.com',
    openingHours: 'Mon - Sat: 10:00 AM - 09:00 PM | Sun: 10:30 AM - 03:00 PM',
    mapUrl: 'https://www.google.com/maps/search/?api=1&query=Hari+Hara+Jewellery+Works+S.No.+18-7-466%2F2%2FB%2F42+Near+Uppuguda+Railway+Station+Ambica+Nagar+Uppuguda+Hyderabad+500053',
    mapEmbedUrl: 'https://maps.google.com/maps?q=17.3475,78.4875&hl=en&z=15&output=embed',
    aboutText: `HARI HARA Jewellery Works was founded in 2001 under the master leadership of Proprietor L. Srinivasa Chary in Ambica Nagar, Uppuguda, Hyderabad. With over 25 years of devoted traditional jewellery crafting, we specialize in 91.6 KDM hallmarked gold ornaments, temple jewellery, antique necklaces, bridal ornaments, and pure silver puja articles. Every ornament is handcrafted with precision, transparent weighing, and an unwavering commitment to purity.`,
    heroTitle: 'Sacred Craftsmanship in 91.6 KDM Hallmarked Gold & Silver',
    heroDescription: 'Over 25 years of trusted artistry in Hyderabad. Custom-crafted bridal necklaces, temple kasu harams, solid gold kadas, and exquisite ornaments made with 100% purity guarantee.',
    heroImageUrl: '/luxury-hero-banner.jpg',
    footerText: 'HARI HARA Jewellery Works — Prop. L. Srinivasa Chary. Trusted Goldsmiths & Ornament Makers in Hyderabad since 2001.',
    socialInstagram: 'https://instagram.com/hariharajewellery',
    socialFacebook: 'https://facebook.com/hariharajewellery',
    socialYoutube: 'https://youtube.com/@hariharajewellery',
    hallmarkInfo: 'Every gold ornament crafted at HARI HARA Jewellery Works is 91.6 KDM Hallmarked with 100% purity certification and exact caratage testing.',
    returnPolicy: 'Lifetime exchange on all gold ornaments at live market gold valuation with full transparency.',
    customOrderPolicy: 'We craft customized ornaments based on your desired weight, budget, photo references, or heirloom remodelling.',
    goldRate22k: 7250,
    goldRate24k: 7910,
    silverRate1g: 98,
  };

  const existingSettings = await prisma.shopSettings.findFirst();
  if (existingSettings) {
    await prisma.shopSettings.update({
      where: { id: existingSettings.id },
      data: settingsData,
    });
  } else {
    await prisma.shopSettings.create({
      data: settingsData,
    });
  }
  console.log('✅ Shop settings seeded');

  // 3. Seed Pure Gold Categories
  const categories = [
    {
      name: 'Gold Designer Rings',
      slug: 'rings',
      description: 'Handcrafted 22K 91.6 pure gold designer rings, nakshi rings, and custom bands.',
      imageUrl: '/category-gold-rings.jpg',
      sortOrder: 1,
    },
    {
      name: 'Kammalbuttas & Jhumkas',
      slug: 'kammalbuttas',
      description: 'Traditional 22K South Indian temple Kammalbuttas, royal bell jhumkas, and hanging buttas.',
      imageUrl: '/category-kammalbuttas.jpg',
      sortOrder: 2,
    },
    {
      name: 'Gold Ear Tops & Pogulu',
      slug: 'ear-tops',
      description: 'Pure 22K gold baby ear tops, floral stud tops, and screw-back pogulu.',
      imageUrl: '/category-ear-tops.jpg',
      sortOrder: 3,
    },
    {
      name: 'Gold Chains & Lockets',
      slug: 'chains-lockets',
      description: 'Solid 22K gold link chains and divine handcrafted Lakshmi & temple deity lockets.',
      imageUrl: '/category-chains-lockets.jpg',
      sortOrder: 4,
    },
    {
      name: 'Gold Bangles & Kadas',
      slug: 'bangles',
      description: 'Solid 22K gold kadas, traditional temple nakshi broad bangles, and filigree valalu.',
      imageUrl: '/category-bangles-kadas.jpg',
      sortOrder: 5,
    },
    {
      name: 'Gold Necklaces & Harams',
      slug: 'necklaces',
      description: 'Grand 91.6 KDM gold bridal chokers, temple kasu harams, and guttapusalu necklaces.',
      imageUrl: '/category-necklaces-harams.jpg',
      sortOrder: 6,
    },
  ];

  const categoryMap = {};
  for (const cat of categories) {
    const saved = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: cat,
      create: cat,
    });
    categoryMap[cat.slug] = saved.id;
  }
  console.log(`✅ Seeded ${categories.length} categories`);

  // 4. Seed Shop Services
  const services = [
    {
      title: 'Pusthela Thadu Chuttudu (పుస్తెల తాడు చుట్టుడు - Mangalasuthram)',
      description: 'Sacred manual gold wire wrapping and threading of women’s Mangalasuthram. Master goldsmith carefully strings the twin Pusthelu (bottu cups), natural coral beads, and black beads with pure 22K gold wire for sacred strength and lifetime durability.',
      iconName: 'Sparkles',
      imageUrl: '/service-pusthela-thadu-chuttudu.jpg',
      sortOrder: 1,
      isPublished: true,
    },
    {
      title: 'Baby Ear Pogulu & Kids Ear Tops (పాపలకు చెవి పోగులు & హ్యాండ్ సర్వీస్)',
      description: 'Handcrafted pure 22K gold wire Pogulu (ముద్దు పోగులు) and baby screw-back tops. We provide a gentle, hygienic, and highly responsible hand-service to safely and painlessly fit or pierce ear tops for newborn babies and young children with complete care.',
      iconName: 'HeartHandshake',
      imageUrl: '/service-baby-pogulu-ear-tops.jpg',
      sortOrder: 2,
      isPublished: true,
    },
    {
      title: 'Pure Silver Mettalu (వెండి మట్టెలు - Silver Leg Rings for Women)',
      description: 'Handcrafted pure silver Mettalu (toe rings) and silver leg chains (pattilu) for married women and brides. Hand-carved with traditional ethnic patterns, carefully sized and hand-fitted to feet with responsibility for perfect comfort and purity.',
      iconName: 'Gift',
      imageUrl: '/service-silver-mettalu-toe-rings.jpg',
      sortOrder: 3,
      isPublished: true,
    },
    {
      title: 'Old Gold & Silver Exchange (పాత బంగారం & వెండి మార్పిడి)',
      description: 'Exchange your old or inherited gold and silver ornaments at fair live bullion market rates. Computerized purity analysis, live crucible melting, and digital weighing right in front of your eyes with zero hidden deduction.',
      iconName: 'RefreshCw',
      imageUrl: '/service-gold-melting-testing.jpg',
      sortOrder: 4,
      isPublished: true,
    },
    {
      title: 'Custom 22K Gold Ornaments & Nakshi Harams (కస్టమ్ నగల తయారీ)',
      description: 'Bring any photo, sketch, or heirloom idea. Master craftsman L. Srinivasa Chary custom-crafts 91.6 KDM hallmarked royal bridal chokers, temple Kasu Harams, and bangles to your desired grams and budget.',
      iconName: 'Palette',
      imageUrl: '/service-custom-making.jpg',
      sortOrder: 5,
      isPublished: true,
    },
    {
      title: 'Jewellery Repair, Sizing & Polishing (నగల మరమ్మతులు & సైజింగ్)',
      description: 'Quick in-house repair services including gold chain soldering, ring & bangle reshaping on steel mandrels with jeweler loupe, stone resetting, lock replacements, and ultrasonic gold electro-polishing.',
      iconName: 'Wrench',
      imageUrl: '/service-jewellery-repair-sizing.jpg',
      sortOrder: 6,
      isPublished: true,
    },
  ];

  for (const s of services) {
    const existing = await prisma.shopService.findFirst({ where: { title: s.title } });
    if (existing) {
      await prisma.shopService.update({
        where: { id: existing.id },
        data: s,
      });
    } else {
      await prisma.shopService.create({ data: s });
    }
  }
  console.log(`✅ Seeded ${services.length} shop services`);

  // 5. Products are managed via Admin Portal only (no mock products seeded)

  // 6. Seed Sample Enquiries
  const sampleProduct = await prisma.product.findFirst({
    where: { slug: 'royal-bridal-gold-choker-long-haar-set' },
  });

  const enquiries = [
    {
      customerName: 'Ananya Sharma',
      phone: '9849012345',
      email: 'ananya.sharma@example.com',
      productId: sampleProduct?.id,
      message: 'Namaste! We are planning a wedding in December and want to know if the Royal Bridal set can be made in 85 grams.',
      status: 'NEW',
      internalNotes: 'Customer called from Secunderabad. Interested in bridal consultation on Saturday afternoon.',
    },
    {
      customerName: 'K. Ramesh Reddy',
      phone: '9440188772',
      email: 'ramesh.reddy@example.com',
      message: 'Looking for 91.6 gold temple kasu haram around 50 grams. Can we visit the Uppuguda workshop tomorrow?',
      status: 'CONTACTED',
      internalNotes: 'Spoke on phone. Sent catalog images via WhatsApp.',
    },
  ];

  for (const enq of enquiries) {
    const existing = await prisma.customerEnquiry.findFirst({
      where: { customerName: enq.customerName, phone: enq.phone },
    });
    if (!existing) {
      await prisma.customerEnquiry.create({ data: enq });
    }
  }
  console.log(`✅ Seeded sample customer enquiries`);

  console.log('🎉 Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during database seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
