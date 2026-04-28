import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { listMailtmMessages } from "@/lib/mailtm";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const mailbox = await prisma.mailbox.findFirst({
    where: { userId: session.user.id, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: "desc" },
  });
  if (!mailbox) return NextResponse.json({ messages: [] });

  const messages = await listMailtmMessages(mailbox.token);
  return NextResponse.json({ messages });
}
