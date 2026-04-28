"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { Clock, CheckCircle2, AlertTriangle, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatRupiah } from "@/lib/utils";
import { toast } from "sonner";

interface OrderView {
  id: string;
  total: number;
  status: "PENDING" | "PAID" | "EXPIRED" | "CANCELLED";
  qrImage: string | null;
  qrPayload: string | null;
  expiresAt: string;
  items: { name: string; price: number; quantity: number }[];
}

export default function CheckoutPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [order, setOrder] = useState<OrderView | null>(null);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const iv = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const res = await fetch(`/api/orders/${params.id}`, { cache: "no-store" });
      if (!res.ok) return;
      const json = (await res.json()) as OrderView;
      if (cancelled) return;
      setOrder(json);
      setLoading(false);
    };
    load();
    const iv = setInterval(load, 5000);
    return () => {
      cancelled = true;
      clearInterval(iv);
    };
  }, [params.id]);

  if (loading) {
    return <div className="container py-20 text-center text-muted-foreground">Memuat order…</div>;
  }
  if (!order) {
    return <div className="container py-20 text-center text-muted-foreground">Order tidak ditemukan.</div>;
  }

  const msLeft = Math.max(0, new Date(order.expiresAt).getTime() - now);
  const mm = Math.floor(msLeft / 60000).toString().padStart(2, "0");
  const ss = Math.floor((msLeft % 60000) / 1000).toString().padStart(2, "0");

  const copyPayload = () => {
    if (!order.qrPayload) return;
    navigator.clipboard.writeText(order.qrPayload);
    toast.success("QRIS payload disalin");
  };

  return (
    <div className="container py-10">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-3xl font-bold">Checkout</h1>
        <p className="mt-1 text-muted-foreground">Order ID: <span className="text-white">{order.id}</span></p>

        <div className="mt-8 grid gap-8 md:grid-cols-[320px_1fr]">
          <div className="flex flex-col items-center gap-3 rounded-xl border border-white/10 bg-white p-4 text-black">
            {order.qrImage ? (
              <Image
                src={order.qrImage}
                alt="QRIS"
                width={288}
                height={288}
                className="h-72 w-72"
                unoptimized
              />
            ) : (
              <div className="flex h-72 w-72 items-center justify-center text-xs text-zinc-500">
                QR belum siap
              </div>
            )}
            <p className="text-center text-xs text-zinc-600">Scan pakai app m-banking / e-wallet</p>
            <Button size="sm" variant="outline" onClick={copyPayload} className="text-black">
              <Copy className="h-4 w-4" /> Salin payload
            </Button>
          </div>

          <div className="space-y-5">
            <div className="glass rounded-xl p-5">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total yang harus dibayar</span>
                <span className="text-2xl font-bold gradient-text">{formatRupiah(order.total)}</span>
              </div>
              <div className="mt-2 text-xs text-muted-foreground">
                Nominal sudah termasuk kode unik 3 digit supaya pembayaran bisa terdeteksi otomatis.
              </div>
            </div>

            {order.status === "PENDING" && (
              <div className="flex items-center gap-3 rounded-xl border border-yellow-500/30 bg-yellow-500/10 p-4 text-sm">
                <Clock className="h-5 w-5 text-yellow-300" />
                <div>
                  <div className="font-medium text-yellow-200">Menunggu pembayaran…</div>
                  <div className="text-yellow-100/70">Halaman auto-refresh. Sisa waktu: <span className="font-mono">{mm}:{ss}</span></div>
                </div>
              </div>
            )}

            {order.status === "PAID" && (
              <div className="flex items-center gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm">
                <CheckCircle2 className="h-5 w-5 text-emerald-300" />
                <div>
                  <div className="font-medium text-emerald-200">Pembayaran diterima ✓</div>
                  <div className="text-emerald-100/70">Order lo sedang diproses. Cek dashboard / WhatsApp admin.</div>
                </div>
              </div>
            )}

            {order.status === "EXPIRED" && (
              <div className="flex items-center gap-3 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm">
                <AlertTriangle className="h-5 w-5 text-red-300" />
                <div>
                  <div className="font-medium text-red-200">Order kadaluarsa</div>
                  <div className="text-red-100/70">Silakan buat order baru.</div>
                </div>
              </div>
            )}

            <div className="rounded-xl border border-white/10 bg-card/60 p-5 backdrop-blur-md">
              <h3 className="mb-3 font-semibold">Item</h3>
              <ul className="space-y-2 text-sm">
                {order.items.map((i, idx) => (
                  <li key={idx} className="flex justify-between">
                    <span>{i.name} × {i.quantity}</span>
                    <span>{formatRupiah(i.price * i.quantity)}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => router.push("/products")}>
                Belanja Lagi
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
