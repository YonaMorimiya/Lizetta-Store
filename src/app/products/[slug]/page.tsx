import Image from "next/image";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { formatRupiah } from "@/lib/utils";
import { AddToCartButton } from "@/components/add-to-cart-button";

export const dynamic = "force-dynamic";

export default async function ProductDetail({ params }: { params: { slug: string } }) {
  let product;
  try {
    product = await prisma.product.findUnique({ where: { slug: params.slug } });
  } catch {
    product = null;
  }
  if (!product) notFound();

  return (
    <div className="container py-10">
      <div className="grid gap-10 md:grid-cols-2">
        <div className="relative aspect-square overflow-hidden rounded-2xl border border-white/10 bg-black/30">
          <Image src={product.image} alt={product.name} fill sizes="(max-width: 768px) 100vw, 50vw" className="object-cover" />
        </div>
        <div className="flex flex-col gap-5">
          <div className="flex gap-2">
            <Badge>{product.category}</Badge>
            {product.featured && (
              <Badge className="border-pink-400/40 bg-pink-500/20 text-pink-200">Featured</Badge>
            )}
          </div>
          <h1 className="text-3xl font-bold leading-tight">{product.name}</h1>
          <p className="text-4xl font-bold gradient-text">{formatRupiah(product.price)}</p>
          <p className="whitespace-pre-line text-muted-foreground">{product.description}</p>
          <div className="mt-2">
            <AddToCartButton
              product={{
                id: product.id,
                name: product.name,
                price: product.price,
                image: product.image,
              }}
            />
          </div>
          <div className="glass mt-4 rounded-xl p-5 text-sm text-muted-foreground">
            Pembayaran pakai <span className="text-white">QRIS</span> (semua bank & e-wallet).
            Order diproses otomatis setelah dana masuk. Butuh bantuan? Kontak admin via WhatsApp.
          </div>
        </div>
      </div>
    </div>
  );
}
