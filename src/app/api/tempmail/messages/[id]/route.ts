import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { deleteMailtmMessage, getMailtmMessage } from "@/lib/mailtm";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const mailbox = await prisma.mailbox.findFirst({
    where: { userId: session.user.id, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: "desc" },
  });
  if (!mailbox) return NextResponse.json({ error: "no active mailbox" }, { status: 404 });

  const msg = await getMailtmMessage(mailbox.token, params.id);
  if (!msg) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json({ message: msg });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const mailbox = await prisma.mailbox.findFirst({
    where: { userId: session.user.id, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: "desc" },
  });
  if (!mailbox) return NextResponse.json({ error: "no active mailbox" }, { status: 404 });

  const ok = await deleteMailtmMessage(mailbox.token, params.id);
  return NextResponse.json({ ok });
}
