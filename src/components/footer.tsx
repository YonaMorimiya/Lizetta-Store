import Link from "next/link";
import { Sparkles, Github } from "lucide-react";

export function Footer() {
  return (
    <footer className="mt-16 border-t border-white/10 bg-black/30">
      <div className="container grid gap-8 py-12 md:grid-cols-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-pink-500 to-fuchsia-500">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <span className="text-lg font-bold">
              Lizetta<span className="gradient-text">Store</span>
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            Digital goods store — fast, fair, 24/7. Pembayaran via QRIS all-bank.
          </p>
        </div>
        <div>
          <h4 className="mb-3 text-sm font-semibold">Shop</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link href="/products" className="hover:text-white">All Products</Link></li>
            <li><Link href="/cart" className="hover:text-white">Cart</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="mb-3 text-sm font-semibold">Tools</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link href="/tempmail" className="hover:text-white">TempMail</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="mb-3 text-sm font-semibold">Account</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link href="/login" className="hover:text-white">Login</Link></li>
            <li><Link href="/register" className="hover:text-white">Register</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="container flex flex-col items-center justify-between gap-3 py-4 text-xs text-muted-foreground md:flex-row">
          <p>© {new Date().getFullYear()} Lizetta Store. All rights reserved.</p>
          <p className="flex items-center gap-1">
            Built with <span className="text-pink-400">♥</span> on Next.js & Vercel
            <Github className="ml-2 h-3.5 w-3.5" />
          </p>
        </div>
      </div>
    </footer>
  );
}
