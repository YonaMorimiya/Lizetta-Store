"use client";

import { useState } from "react";
import { ShoppingCart, Minus, Plus, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart, type CartItem } from "@/components/cart-provider";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function AddToCartButton({ product }: { product: Omit<CartItem, "quantity"> }) {
  const { add } = useCart();
  const router = useRouter();
  const [qty, setQty] = useState(1);
  const [done, setDone] = useState(false);

  const onAdd = () => {
    add(product, qty);
    setDone(true);
    toast.success(`${product.name} × ${qty} ditambah ke keranjang`);
    setTimeout(() => setDone(false), 1200);
  };

  const onBuyNow = () => {
    add(product, qty);
    router.push("/cart");
  };

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="flex h-10 items-center overflow-hidden rounded-md border border-white/10">
        <button
          aria-label="decrease"
          onClick={() => setQty((v) => Math.max(1, v - 1))}
          className="h-full px-3 hover:bg-white/5"
        >
          <Minus className="h-4 w-4" />
        </button>
        <div className="w-10 text-center font-semibold">{qty}</div>
        <button
          aria-label="increase"
          onClick={() => setQty((v) => v + 1)}
          className="h-full px-3 hover:bg-white/5"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
      <Button size="lg" onClick={onAdd} variant={done ? "outline" : "default"} className="flex-1 sm:flex-none">
        {done ? <><Check className="h-4 w-4" /> Added</> : <><ShoppingCart className="h-4 w-4" /> Tambah ke Keranjang</>}
      </Button>
      <Button size="lg" variant="secondary" onClick={onBuyNow} className="flex-1 sm:flex-none">
        Beli Sekarang
      </Button>
    </div>
  );
}
