import { prisma } from "@/lib/prisma";
import { ProductCard } from "@/components/product-card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function ProductsPage({
  searchParams,
}: {
  searchParams?: { category?: string; q?: string };
}) {
  const category = searchParams?.category;
  const q = searchParams?.q;

  let products: Awaited<ReturnType<typeof prisma.product.findMany>> = [];
  let categories: string[] = [];

  try {
    products = await prisma.product.findMany({
      where: {
        active: true,
        ...(category ? { category } : {}),
        ...(q ? { name: { contains: q, mode: "insensitive" } } : {}),
      },
      orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
    });
    const all = await prisma.product.findMany({
      where: { active: true },
      distinct: ["category"],
      select: { category: true },
    });
    categories = all.map((x) => x.category);
  } catch {}

  return (
    <div className="container py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Semua Produk</h1>
        <p className="mt-1 text-muted-foreground">
          {category ? `Kategori: ${category}` : "Pilih kebutuhan digital lo."}
        </p>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        <Link href="/products">
          <Badge
            className={
              !category
                ? "border-pink-500/40 bg-pink-500/15 text-pink-200"
                : "hover:border-white/30"
            }
          >
            Semua
          </Badge>
        </Link>
        {categories.map((c) => (
          <Link key={c} href={`/products?category=${encodeURIComponent(c)}`}>
            <Badge
              className={
                category === c
                  ? "border-pink-500/40 bg-pink-500/15 text-pink-200"
                  : "hover:border-white/30"
              }
            >
              {c}
            </Badge>
          </Link>
        ))}
      </div>

      {products.length === 0 ? (
        <div className="glass rounded-xl p-10 text-center text-muted-foreground">
          Belum ada produk.
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}
