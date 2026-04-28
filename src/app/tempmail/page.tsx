"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Copy, RefreshCw, Sparkles, Trash2, Inbox, Clock, Lock } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Mailbox {
  id: string;
  address: string;
  token: string;
  expiresAt: string;
  createdAt: string;
}

interface MessageSummary {
  id: string;
  from: { address: string; name: string };
  subject: string;
  intro: string;
  seen: boolean;
  createdAt: string;
}

interface MessageFull extends MessageSummary {
  text?: string;
  html?: string[];
}

export default function TempMailPage() {
  const { data: session, status } = useSession();
  const [mailbox, setMailbox] = useState<Mailbox | null>(null);
  const [messages, setMessages] = useState<MessageSummary[]>([]);
  const [selected, setSelected] = useState<MessageFull | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadMailbox = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/tempmail", { cache: "no-store" });
    const json = await res.json();
    setMailbox(json.mailbox);
    setLoading(false);
  }, []);

  const loadMessages = useCallback(async () => {
    setRefreshing(true);
    const res = await fetch("/api/tempmail/messages", { cache: "no-store" });
    const json = await res.json();
    setMessages(json.messages || []);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    if (status === "authenticated") loadMailbox();
  }, [status, loadMailbox]);

  useEffect(() => {
    if (!mailbox) return;
    loadMessages();
    const iv = setInterval(loadMessages, 10_000);
    return () => clearInterval(iv);
  }, [mailbox, loadMessages]);

  const generate = async () => {
    const res = await fetch("/api/tempmail", { method: "POST" });
    const json = await res.json();
    if (!res.ok) {
      toast.error(json.error || "Gagal generate");
      return;
    }
    setMailbox(json.mailbox);
    setMessages([]);
    toast.success("TempMail baru aktif");
  };

  const destroy = async () => {
    if (!confirm("Hapus TempMail sekarang? Semua pesan akan hilang.")) return;
    const res = await fetch("/api/tempmail", { method: "DELETE" });
    if (!res.ok) {
      toast.error("Gagal hapus");
      return;
    }
    setMailbox(null);
    setMessages([]);
    setSelected(null);
    toast.success("TempMail dihapus");
  };

  const openMessage = async (id: string) => {
    const res = await fetch(`/api/tempmail/messages/${id}`);
    if (!res.ok) return;
    const json = await res.json();
    setSelected(json.message);
  };

  if (status === "loading") {
    return <div className="container py-20 text-center text-muted-foreground">Loading…</div>;
  }

  if (status !== "authenticated") {
    return (
      <div className="container flex items-center justify-center py-16">
        <Card className="w-full max-w-md shimmer-border">
          <CardHeader>
            <CardTitle>Login dulu ya</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <p>TempMail cuma buat user Lizetta Store. Gratis — tinggal daftar.</p>
            <div className="flex gap-2">
              <Link href="/login?callbackUrl=/tempmail" className="flex-1">
                <Button className="w-full">
                  <Lock className="h-4 w-4" /> Login
                </Button>
              </Link>
              <Link href="/register?callbackUrl=/tempmail" className="flex-1">
                <Button variant="outline" className="w-full">
                  Register
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-10">
      <div className="mb-8">
        <h1 className="flex items-center gap-2 text-3xl font-bold">
          <Inbox className="h-7 w-7 text-pink-400" /> TempMail Generator
        </h1>
        <p className="mt-1 text-muted-foreground">
          Alamat email sekali pakai buat verifikasi apa aja. Expired otomatis dalam 24 jam.
        </p>
      </div>

      {loading ? (
        <div className="text-muted-foreground">Loading…</div>
      ) : !mailbox ? (
        <Card className="shimmer-border">
          <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
            <Sparkles className="h-10 w-10 text-pink-400" />
            <div>
              <h2 className="text-xl font-semibold">Generate alamat TempMail lo</h2>
              <p className="text-sm text-muted-foreground">1 klik, langsung aktif.</p>
            </div>
            <Button size="lg" onClick={generate}>
              <Sparkles className="h-4 w-4" /> Generate TempMail
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          <Card>
            <CardContent className="flex flex-wrap items-center justify-between gap-4 py-5">
              <div className="space-y-1">
                <div className="text-xs uppercase tracking-wider text-muted-foreground">Alamat aktif</div>
                <div className="flex items-center gap-2 text-lg font-semibold">
                  <span className="gradient-text">{mailbox.address}</span>
                  <Button
                    size="icon"
                    variant="ghost"
                    aria-label="copy"
                    onClick={() => {
                      navigator.clipboard.writeText(mailbox.address);
                      toast.success("Alamat disalin");
                    }}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  Expired: {new Date(mailbox.expiresAt).toLocaleString("id-ID")}
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={loadMessages} disabled={refreshing}>
                  <RefreshCw className={refreshing ? "h-4 w-4 animate-spin" : "h-4 w-4"} /> Refresh
                </Button>
                <Button variant="outline" onClick={generate}>
                  <Sparkles className="h-4 w-4" /> Generate Baru
                </Button>
                <Button variant="outline" onClick={destroy}>
                  <Trash2 className="h-4 w-4 text-red-400" /> Hapus
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-5 lg:grid-cols-[minmax(0,360px)_1fr]">
            <Card className="h-fit">
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-base">
                  Inbox
                  <Badge>{messages.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-2">
                {messages.length === 0 ? (
                  <div className="p-6 text-center text-sm text-muted-foreground">
                    Belum ada pesan. Halaman auto-refresh tiap 10s.
                  </div>
                ) : (
                  <ul className="space-y-1">
                    {messages.map((m) => (
                      <li key={m.id}>
                        <button
                          onClick={() => openMessage(m.id)}
                          className={`w-full rounded-lg p-3 text-left transition-colors ${
                            selected?.id === m.id ? "bg-white/10" : "hover:bg-white/5"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="truncate text-sm font-medium">{m.from.name || m.from.address}</div>
                            {!m.seen && <span className="h-2 w-2 shrink-0 rounded-full bg-pink-400" />}
                          </div>
                          <div className="mt-0.5 truncate text-sm">{m.subject}</div>
                          <div className="mt-0.5 truncate text-xs text-muted-foreground">{m.intro}</div>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>

            <Card className="min-h-[480px]">
              {selected ? (
                <>
                  <CardHeader>
                    <CardTitle className="text-lg">{selected.subject || "(tanpa subjek)"}</CardTitle>
                    <div className="text-sm text-muted-foreground">
                      Dari: {selected.from.name} &lt;{selected.from.address}&gt;
                    </div>
                  </CardHeader>
                  <CardContent>
                    {selected.html && selected.html.length > 0 ? (
                      <iframe
                        sandbox=""
                        srcDoc={selected.html.join("")}
                        className="min-h-[480px] w-full rounded-md bg-white"
                      />
                    ) : (
                      <pre className="whitespace-pre-wrap text-sm text-foreground/90">{selected.text}</pre>
                    )}
                  </CardContent>
                </>
              ) : (
                <CardContent className="flex min-h-[480px] items-center justify-center text-muted-foreground">
                  Pilih pesan di kiri untuk dibaca.
                </CardContent>
              )}
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
