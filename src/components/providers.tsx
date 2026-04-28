"use client";

import { SessionProvider } from "next-auth/react";
import { Toaster } from "sonner";
import { CartProvider } from "@/components/cart-provider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <CartProvider>
        {children}
        <Toaster
          position="top-right"
          theme="dark"
          toastOptions={{ className: "!bg-zinc-900 !border-white/10 !text-white" }}
        />
      </CartProvider>
    </SessionProvider>
  );
}
