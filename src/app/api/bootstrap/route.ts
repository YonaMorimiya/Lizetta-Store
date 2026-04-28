import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

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

async function runSeed() {
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

  let productsCreated = 0;
  for (const p of sampleProducts) {
    const existing = await prisma.product.findUnique({ where: { slug: p.slug } });
    if (!existing) {
      await prisma.product.create({ data: p });
      productsCreated++;
    }
  }

  const userCount = await prisma.user.count();
  const productCount = await prisma.product.count();

  return {
    adminEmail,
    productsCreated,
    totalUsers: userCount,
    totalProducts: productCount,
  };
}

function authorize(req: Request) {
  const expected = process.env.BOOTSTRAP_KEY;
  if (!expected) {
    return { ok: false, status: 500, error: "BOOTSTRAP_KEY not configured on server" };
  }
  const url = new URL(req.url);
  const provided = url.searchParams.get("key") || req.headers.get("x-bootstrap-key");
  if (provided !== expected) {
    return { ok: false, status: 401, error: "Unauthorized: missing or invalid key" };
  }
  return { ok: true as const };
}

export async function GET(req: Request) {
  const auth = authorize(req);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  try {
    const result = await runSeed();
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Bootstrap failed" },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  return GET(req);
}
