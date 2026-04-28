import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { formatRupiah } from "@/lib/utils";

export const dynamic = "force-dynamic";

const statusColors: Record<string, string> = {
  PENDING: "border-yellow-500/30 bg-yellow-500/15 text-yellow-200",
  PAID: "border-emerald-500/30 bg-emerald-500/15 text-emerald-200",
  EXPIRED: "border-red-500/30 bg-red-500/15 text-red-200",
  CANCELLED: "border-white/10 bg-white/5 text-muted-foreground",
};

export default async function AdminOrdersPage() {
  let orders: Array<{
    id: string;
    total: number;
    status: string;
    createdAt: Date;
    user: { email: string; name: string | null };
    items: { name: string; quantity: number }[];
  }> = [];
  try {
    orders = await prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
      include: { user: { select: { email: true, name: true } }, items: true },
    });
  } catch {}

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Order</h1>
        <p className="text-muted-foreground">100 order terakhir.</p>
      </div>
      {orders.length === 0 ? (
        <div className="glass rounded-xl p-10 text-center text-muted-foreground">Belum ada order.</div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-white/10">
          <table className="w-full text-sm">
            <thead className="bg-white/5 text-left">
              <tr>
                <th className="px-4 py-3">Order</th>
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Item</th>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Tanggal</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id} className="border-t border-white/5">
                  <td className="px-4 py-3 font-mono text-xs">{o.id.slice(0, 8)}…</td>
                  <td className="px-4 py-3">
                    <div className="font-medium">{o.user.name || "—"}</div>
                    <div className="text-xs text-muted-foreground">{o.user.email}</div>
                  </td>
                  <td className="px-4 py-3">
                    {o.items.map((i, idx) => (
                      <div key={idx} className="text-xs">{i.name} × {i.quantity}</div>
                    ))}
                  </td>
                  <td className="px-4 py-3 font-medium">{formatRupiah(o.total)}</td>
                  <td className="px-4 py-3">
                    <Badge className={statusColors[o.status] || ""}>{o.status}</Badge>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {new Date(o.createdAt).toLocaleString("id-ID")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
