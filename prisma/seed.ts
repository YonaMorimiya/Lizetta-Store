import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const sampleProducts = [
  {
    name: "Netflix Premium 1 Bulan",
    slug: "netflix-premium-1-bulan",
    description:
      "Akses Netflix Premium 4K UHD private, garansi penuh 30 hari. Bisa dipakai di TV, HP, laptop.",
    price: 35000,
    image:
      "https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?w=800&q=80",
    category: "Streaming",
    featured: true,
  },
  {
    name: "Spotify Premium Family",
    slug: "spotify-premium-family",
    description:
      "Upgrade akun Spotify lo ke Premium Family. Tanpa iklan, download offline, audio HQ.",
    price: 25000,
    image:
      "https://images.unsplash.com/photo-1611339555312-e607c8352fd7?w=800&q=80",
    category: "Streaming",
    featured: true,
  },
  {
    name: "ChatGPT Plus Shared",
    slug: "chatgpt-plus-shared",
    description:
      "Akses GPT-4o, o1, advanced voice, dan tools. Login shared, stabil dan fast.",
    price: 45000,
    image:
      "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&q=80",
    category: "AI",
    featured: true,
  },
  {
    name: "Canva Pro 1 Tahun",
    slug: "canva-pro-1-tahun",
    description:
      "Lifetime-ish Canva Pro invite ke team lo. Semua asset premium unlocked.",
    price: 30000,
    image:
      "https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=800&q=80",
    category: "Design",
  },
  {
    name: "VPS 1GB RAM",
    slug: "vps-1gb-ram",
    description:
      "VPS KVM 1GB RAM / 1 vCPU / 20GB SSD / 1TB bandwidth. Lokasi SG/US/ID.",
    price: 50000,
    image:
      "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&q=80",
    category: "Hosting",
  },
  {
    name: "Domain .com 1 Tahun",
    slug: "domain-com-1-tahun",
    description: "Registrasi domain .com fresh 1 tahun. Whois privacy included.",
    price: 165000,
    image:
      "https://images.unsplash.com/photo-1542831371-29b0f74f9713?w=800&q=80",
    category: "Hosting",
  },
];

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL || "admin@lizetta.local";
  const adminPassword = process.env.ADMIN_PASSWORD || "ChangeMeNow!";

  const passwordHash = await bcrypt.hash(adminPassword, 10);

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: { role: Role.ADMIN, passwordHash },
    create: {
      email: adminEmail,
      name: "Lizetta Admin",
      passwordHash,
      role: Role.ADMIN,
    },
  });
  console.log(`✓ admin user ready: ${adminEmail}`);

  for (const p of sampleProducts) {
    await prisma.product.upsert({
      where: { slug: p.slug },
      update: {},
      create: p,
    });
  }
  console.log(`✓ seeded ${sampleProducts.length} sample products`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
