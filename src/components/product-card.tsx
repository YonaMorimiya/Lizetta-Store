"use client";

import Image from "next/image";
import Link from "next/link";
import { ShoppingCart, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatRupiah } from "@/lib/utils";
import { useCart } from "@/components/cart-provider";
import { toast } from "sonner";
import { useState } from "react";

interface Props {
  product: {
    id: string;
    name: string;
    slug: string;
    description: string;
    price: number;
    image: string;
    category: string;
    featured?: boolean;
  };
}

export function ProductCard({ product }: Props) {
  const { add } = useCart();
  const [added, setAdded] = useState(false);

  const onAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    add(
      {
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
      },
      1,
    );
    setAdded(true);
    toast.success(`${product.name} ditambah ke keranjang`);
    setTimeout(() => setAdded(false), 1200);
  };

  return (
    <Link href={`/products/${product.slug}`} className="group">
      <div className="flex h-full flex-col overflow-hidden rounded-xl border border-white/10 bg-card/60 backdrop-blur-md card-hover">
        <div className="relative aspect-[4/3] overflow-hidden bg-black/40">
          <Image
            src={product.image}
            alt={product.name}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute left-3 top-3 flex gap-2">
            <Badge className="border-white/20 bg-black/70 text-xs">{product.category}</Badge>
            {product.featured && (
              <Badge className="border-pink-400/40 bg-pink-500/20 text-pink-200">Featured</Badge>
            )}
          </div>
        </div>
        <div className="flex flex-1 flex-col gap-3 p-4">
          <div>
            <h3 className="line-clamp-1 font-semibold">{product.name}</h3>
            <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{product.description}</p>
          </div>
          <div className="mt-auto flex items-center justify-between gap-2">
            <span className="text-lg font-bold gradient-text">{formatRupiah(product.price)}</span>
            <Button size="sm" onClick={onAdd} variant={added ? "outline" : "default"}>
              {added ? <><Check className="h-4 w-4" /> Added</> : <><ShoppingCart className="h-4 w-4" /> Add</>}
            </Button>
          </div>
        </div>
      </div>
    </Link>
  );
}
