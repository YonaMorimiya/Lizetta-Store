import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { findMatchingPayment } from "@/lib/orderkuota";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const order = await prisma.order.findUnique({
    where: { id: params.id },
    include: { items: true },
  });
  if (!order) return NextResponse.json({ error: "not found" }, { status: 404 });
  if (order.userId !== session.user.id && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  let status = order.status;

  if (status === "PENDING") {
    if (order.expiresAt.getTime() < Date.now()) {
      status = "EXPIRED";
      await prisma.order.update({ where: { id: order.id }, data: { status } });
    } else {
      // check mutasi for matching amount
      const match = await findMatchingPayment(order.total);
      if (match) {
        status = "PAID";
        await prisma.order.update({
          where: { id: order.id },
          data: { status, paidAt: new Date() },
        });
      }
    }
  }

  return NextResponse.json({
    id: order.id,
    total: order.total,
    status,
    qrImage: order.qrImage,
    qrPayload: order.qrPayload,
    expiresAt: order.expiresAt,
    items: order.items.map((i) => ({
      name: i.name,
      price: i.price,
      quantity: i.quantity,
    })),
  });
}
