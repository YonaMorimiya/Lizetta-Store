import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ProductCard } from "@/components/product-card";
import { ArrowRight, Sparkles, Shield, Zap, Mail } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  let featured: Awaited<ReturnType<typeof prisma.product.findMany>> = [];
  try {
    featured = await prisma.product.findMany({
      where: { active: true, featured: true },
      take: 6,
      orderBy: { createdAt: "desc" },
    });
  } catch {
    // DB not reachable at build time — render empty, hydrate on client nav.
  }

  return (
    <div className="space-y-24 pb-16">
      {/* Hero */}
      <section className="container pt-16 md:pt-24">
        <div className="mx-auto max-w-4xl text-center">
          <Badge className="mb-5 border-pink-500/30 bg-pink-500/10 text-pink-300">
            <Sparkles className="mr-1 h-3 w-3" /> Digital Goods · QRIS All-Bank
          </Badge>
          <h1 className="text-4xl font-bold leading-tight tracking-tight md:text-6xl">
            Semua kebutuhan digital lo, <br />
            <span className="gradient-text">beres dalam 1 QR scan.</span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground">
            Streaming, AI tools, hosting, sampai TempMail — semua lengkap di Lizetta Store.
            Proses instan, garansi penuh, dukungan 24/7.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link href="/products">
              <Button size="lg">
                Belanja Sekarang <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/tempmail">
              <Button size="lg" variant="outline">
                <Mail className="h-4 w-4" /> Coba TempMail
              </Button>
            </Link>
          </div>
        </div>

        {/* Feature strip */}
        <div className="mt-16 grid gap-4 md:grid-cols-3">
          {[
            {
              icon: Zap,
              title: "Instan",
              desc: "Order diproses otomatis setelah pembayaran QRIS masuk.",
            },
            {
              icon: Shield,
              title: "Aman & Garansi",
              desc: "Semua akun bergaransi penuh selama masa aktif.",
            },
            {
              icon: Mail,
              title: "Bonus TempMail",
              desc: "Login → pake TempMail generator gratis untuk verifikasi apa aja.",
            },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="glass rounded-xl p-5 card-hover">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-pink-500 to-fuchsia-500">
                <Icon className="h-5 w-5 text-white" />
              </div>
              <h3 className="font-semibold">{title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Featured products */}
      <section className="container">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Produk Unggulan</h2>
            <p className="mt-1 text-muted-foreground">Paling laris, paling recommended.</p>
          </div>
          <Link href="/products" className="hidden text-sm text-pink-300 hover:underline md:block">
            Lihat semua →
          </Link>
        </div>
        {featured.length === 0 ? (
          <div className="glass rounded-xl p-10 text-center text-muted-foreground">
            Belum ada produk featured. <Link href="/admin" className="text-pink-300 hover:underline">Tambahin di admin →</Link>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
