"use client";

import Image from "next/image";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Minus, Plus, Trash2, ShoppingBag, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/components/cart-provider";
import { formatRupiah } from "@/lib/utils";
import { toast } from "sonner";
import { useState } from "react";

export default function CartPage() {
  const { items, setQuantity, remove, total, clear } = useCart();
  const { data: session, status } = useSession();
  const router = useRouter();
  const [creating, setCreating] = useState(false);

  const onCheckout = async () => {
    if (status !== "authenticated") {
      toast.error("Login dulu untuk checkout");
      router.push(`/login?callbackUrl=/cart`);
      return;
    }
    if (items.length === 0) return;
    setCreating(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((i) => ({ productId: i.id, quantity: i.quantity })),
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal membuat order");
      clear();
      router.push(`/checkout/${json.orderId}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Gagal checkout");
    } finally {
      setCreating(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="container py-20 text-center">
        <ShoppingBag className="mx-auto h-12 w-12 text-muted-foreground" />
        <h1 className="mt-4 text-2xl font-bold">Keranjang lo kosong</h1>
        <p className="mt-1 text-muted-foreground">Cuss pilih produk dulu.</p>
        <Link href="/products" className="mt-6 inline-block">
          <Button size="lg">Lihat Produk</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container py-10">
      <h1 className="mb-6 text-3xl font-bold">Keranjang</h1>
      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        <div className="space-y-3">
          {items.map((i) => (
            <div key={i.id} className="flex gap-4 rounded-xl border border-white/10 bg-card/60 p-3 backdrop-blur-md">
              <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-black/30">
                <Image src={i.image} alt={i.name} fill sizes="80px" className="object-cover" />
              </div>
              <div className="flex flex-1 flex-col justify-between">
                <div>
                  <h3 className="font-semibold">{i.name}</h3>
                  <p className="text-sm text-muted-foreground">{formatRupiah(i.price)}</p>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex h-9 items-center overflow-hidden rounded-md border border-white/10">
                    <button onClick={() => setQuantity(i.id, i.quantity - 1)} className="h-full px-2 hover:bg-white/5">
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <div className="w-10 text-center text-sm font-semibold">{i.quantity}</div>
                    <button onClick={() => setQuantity(i.id, i.quantity + 1)} className="h-full px-2 hover:bg-white/5">
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold">{formatRupiah(i.price * i.quantity)}</span>
                    <Button size="icon" variant="ghost" onClick={() => remove(i.id)} aria-label="remove">
                      <Trash2 className="h-4 w-4 text-red-400" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <aside className="h-fit rounded-xl border border-white/10 bg-card/60 p-5 backdrop-blur-md">
          <h2 className="text-lg font-semibold">Ringkasan</h2>
          <div className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatRupiah(total)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Biaya layanan</span>
              <span>Rp 0</span>
            </div>
            <div className="my-3 border-t border-white/10" />
            <div className="flex justify-between text-base">
              <span className="font-semibold">Total</span>
              <span className="font-bold gradient-text">{formatRupiah(total)}</span>
            </div>
          </div>
          <Button
            onClick={onCheckout}
            size="lg"
            className="mt-5 w-full"
            disabled={creating}
          >
            {status !== "authenticated" ? <><Lock className="h-4 w-4" /> Login & Checkout</> : creating ? "Memproses..." : "Bayar dengan QRIS"}
          </Button>
          <p className="mt-3 text-xs text-muted-foreground">
            Dengan checkout, lo setuju T&C Lizetta Store. Pembayaran via QRIS semua bank.
          </p>
        </aside>
      </div>
    </div>
  );
}
