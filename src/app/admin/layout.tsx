import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Link from "next/link";
import { Package, ShoppingBag, LayoutDashboard } from "lucide-react";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login?callbackUrl=/admin");
  if (session.user.role !== "ADMIN") redirect("/");

  return (
    <div className="container grid gap-8 py-8 lg:grid-cols-[240px_1fr]">
      <aside className="h-fit rounded-xl border border-white/10 bg-card/60 p-3 backdrop-blur-md">
        <div className="mb-2 px-2 py-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Admin
        </div>
        <nav className="space-y-1">
          <Link href="/admin" className="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-white/5">
            <LayoutDashboard className="h-4 w-4" /> Dashboard
          </Link>
          <Link href="/admin/products" className="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-white/5">
            <Package className="h-4 w-4" /> Produk
          </Link>
          <Link href="/admin/orders" className="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-white/5">
            <ShoppingBag className="h-4 w-4" /> Order
          </Link>
        </nav>
      </aside>
      <section>{children}</section>
    </div>
  );
}
