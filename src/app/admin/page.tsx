import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatRupiah } from "@/lib/utils";
import { DollarSign, Package, ShoppingBag, Users } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  let productCount = 0;
  let userCount = 0;
  let orderCount = 0;
  let paidSum = 0;
  try {
    [productCount, userCount, orderCount] = await Promise.all([
      prisma.product.count(),
      prisma.user.count(),
      prisma.order.count(),
    ]);
    const paid = await prisma.order.aggregate({
      where: { status: "PAID" },
      _sum: { total: true },
    });
    paidSum = paid._sum.total || 0;
  } catch {}

  const tiles = [
    { label: "Revenue (paid)", value: formatRupiah(paidSum), icon: DollarSign },
    { label: "Orders", value: orderCount.toString(), icon: ShoppingBag },
    { label: "Products", value: productCount.toString(), icon: Package },
    { label: "Users", value: userCount.toString(), icon: Users },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground">Ringkasan toko lo.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {tiles.map((t) => (
          <Card key={t.label} className="card-hover">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{t.label}</CardTitle>
              <t.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{t.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
