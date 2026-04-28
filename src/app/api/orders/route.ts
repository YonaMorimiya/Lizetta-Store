import { NextResponse } from "next/server";
import { z } from "zod";
import QRCode from "qrcode";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateDynamicQris, generateUniqueCode } from "@/lib/qris";

const schema = z.object({
  items: z
    .array(
      z.object({
        productId: z.string().min(1),
        quantity: z.number().int().positive().max(99),
      }),
    )
    .min(1),
});

const EXPIRY_MINUTES = 15;

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Login dulu" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Data tidak valid" }, { status: 400 });
  }

  const productIds = parsed.data.items.map((i) => i.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds }, active: true },
  });
  if (products.length !== productIds.length) {
    return NextResponse.json({ error: "Ada produk yang tidak tersedia" }, { status: 400 });
  }

  const baseTotal = parsed.data.items.reduce((sum, i) => {
    const p = products.find((p) => p.id === i.productId)!;
    return sum + p.price * i.quantity;
  }, 0);

  const uniqueCode = generateUniqueCode();
  const total = baseTotal + uniqueCode;

  const staticString = process.env.QRIS_STATIC_STRING;
  let qrPayload: string | null = null;
  let qrImage: string | null = null;
  if (staticString) {
    try {
      qrPayload = generateDynamicQris(staticString, total);
      qrImage = await QRCode.toDataURL(qrPayload, { width: 512, margin: 1 });
    } catch (e) {
      console.error("QRIS generation failed:", e);
    }
  } else {
    // fallback: at least render a scannable string so the page works out of the box
    const fallback = `LIZETTA-STORE|NO-QRIS-CONFIGURED|AMOUNT-${total}`;
    qrPayload = fallback;
    qrImage = await QRCode.toDataURL(fallback, { width: 512, margin: 1 });
  }

  const expiresAt = new Date(Date.now() + EXPIRY_MINUTES * 60_000);

  const order = await prisma.order.create({
    data: {
      userId: session.user.id,
      total,
      uniqueCode,
      qrPayload,
      qrImage,
      expiresAt,
      items: {
        create: parsed.data.items.map((i) => {
          const p = products.find((p) => p.id === i.productId)!;
          return {
            productId: p.id,
            name: p.name,
            price: p.price,
            quantity: i.quantity,
          };
        }),
      },
    },
  });

  return NextResponse.json({ orderId: order.id });
}
