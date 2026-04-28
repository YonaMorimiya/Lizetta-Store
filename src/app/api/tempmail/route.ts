import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createMailtmAccount, deleteMailtmAccount } from "@/lib/mailtm";

const INBOX_TTL_HOURS = 24;

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const mailbox = await prisma.mailbox.findFirst({
    where: { userId: session.user.id, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: "desc" },
  });

  if (!mailbox) return NextResponse.json({ mailbox: null });
  return NextResponse.json({
    mailbox: {
      id: mailbox.id,
      address: mailbox.address,
      token: mailbox.token,
      createdAt: mailbox.createdAt,
      expiresAt: mailbox.expiresAt,
    },
  });
}

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  try {
    const local = session.user.email?.split("@")[0];
    const acc = await createMailtmAccount(local);
    const mailbox = await prisma.mailbox.create({
      data: {
        userId: session.user.id,
        address: acc.address,
        password: acc.password,
        token: acc.token,
        mailtmId: acc.id,
        expiresAt: new Date(Date.now() + INBOX_TTL_HOURS * 3600_000),
      },
    });
    return NextResponse.json({
      mailbox: {
        id: mailbox.id,
        address: mailbox.address,
        token: mailbox.token,
        createdAt: mailbox.createdAt,
        expiresAt: mailbox.expiresAt,
      },
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Gagal membuat TempMail" },
      { status: 500 },
    );
  }
}

export async function DELETE() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const active = await prisma.mailbox.findMany({
    where: { userId: session.user.id, expiresAt: { gt: new Date() } },
  });
  for (const mb of active) {
    // best-effort cleanup on mail.tm side
    await deleteMailtmAccount(mb.token, mb.mailtmId).catch(() => undefined);
    await prisma.mailbox.delete({ where: { id: mb.id } }).catch(() => undefined);
  }
  return NextResponse.json({ ok: true });
}
