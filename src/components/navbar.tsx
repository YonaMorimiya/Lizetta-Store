"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { ShoppingCart, Sparkles, Mail, Shield, LogIn, LogOut, UserPlus, LayoutDashboard, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/components/cart-provider";
import { useState } from "react";
import { cn } from "@/lib/utils";

const links = [
  { href: "/", label: "Home", icon: Sparkles },
  { href: "/products", label: "Produk", icon: ShoppingCart },
  { href: "/tempmail", label: "TempMail", icon: Mail },
];

export function Navbar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { count } = useCart();
  const [open, setOpen] = useState(false);

  const isAdmin = session?.user?.role === "ADMIN";

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-background/70 backdrop-blur-xl">
      <div className="container flex h-16 items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-pink-500 to-fuchsia-500 shadow-lg shadow-pink-500/30">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <span className="text-lg font-bold tracking-tight">
            Lizetta<span className="gradient-text">Store</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {links.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                pathname === href
                  ? "bg-white/10 text-white"
                  : "text-muted-foreground hover:bg-white/5 hover:text-white",
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          ))}
          {isAdmin && (
            <Link
              href="/admin"
              className={cn(
                "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                pathname.startsWith("/admin")
                  ? "bg-pink-500/15 text-pink-300"
                  : "text-pink-300/70 hover:bg-pink-500/10 hover:text-pink-200",
              )}
            >
              <Shield className="h-4 w-4" />
              Admin
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-2">
          <Link href="/cart" className="relative">
            <Button size="icon" variant="ghost" aria-label="cart">
              <ShoppingCart className="h-5 w-5" />
            </Button>
            {count > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-pink-500 px-1 text-xs font-semibold text-white">
                {count}
              </span>
            )}
          </Link>

          {session?.user ? (
            <div className="hidden items-center gap-2 md:flex">
              <span className="text-sm text-muted-foreground">
                Hi, <span className="text-white">{session.user.name || session.user.email}</span>
              </span>
              <Button variant="outline" size="sm" onClick={() => signOut({ callbackUrl: "/" })}>
                <LogOut className="h-4 w-4" /> Logout
              </Button>
            </div>
          ) : (
            <div className="hidden items-center gap-2 md:flex">
              <Link href="/login">
                <Button variant="outline" size="sm">
                  <LogIn className="h-4 w-4" /> Login
                </Button>
              </Link>
              <Link href="/register">
                <Button size="sm">
                  <UserPlus className="h-4 w-4" /> Register
                </Button>
              </Link>
            </div>
          )}

          <Button size="icon" variant="ghost" className="md:hidden" onClick={() => setOpen((v) => !v)}>
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {open && (
        <div className="container flex flex-col gap-1 border-t border-white/10 py-3 md:hidden">
          {links.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-white/5"
            >
              <Icon className="h-4 w-4" /> {label}
            </Link>
          ))}
          {isAdmin && (
            <Link href="/admin" onClick={() => setOpen(false)} className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-pink-300 hover:bg-pink-500/10">
              <LayoutDashboard className="h-4 w-4" /> Admin
            </Link>
          )}
          <div className="mt-2 border-t border-white/10 pt-2">
            {session?.user ? (
              <Button variant="outline" size="sm" onClick={() => signOut({ callbackUrl: "/" })} className="w-full">
                <LogOut className="h-4 w-4" /> Logout ({session.user.email})
              </Button>
            ) : (
              <div className="flex gap-2">
                <Link href="/login" className="flex-1">
                  <Button variant="outline" size="sm" className="w-full">Login</Button>
                </Link>
                <Link href="/register" className="flex-1">
                  <Button size="sm" className="w-full">Register</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
