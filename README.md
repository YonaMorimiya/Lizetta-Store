# Lizetta Store

Digital-goods storefront — streaming / AI / hosting / dll — dengan:

- Katalog produk yang bisa dikelola **admin** (CRUD, featured, arsip).
- **TempMail generator** (mail.tm) hanya untuk user yang login.
- **Pembayaran QRIS** — generate QR dinamis dari QRIS statis kamu (Orderkuota / OkeConnect), cek pembayaran otomatis via mutasi.
- Tampilan modern: Next.js 14 App Router + Tailwind + shadcn-style UI.
- Siap deploy **Vercel** (Postgres / Neon).

## Stack

- Next.js 14 (App Router) + TypeScript
- TailwindCSS + Radix + shadcn-style components
- Prisma + PostgreSQL (Vercel Postgres / Neon)
- NextAuth (credentials provider + bcrypt)
- `qrcode` untuk rendering QR
- `mail.tm` untuk TempMail
- OkeConnect / Orderkuota mutasi endpoint untuk verifikasi QRIS

## Local development

```bash
pnpm install
cp .env.example .env
# isi DATABASE_URL (Neon / Vercel Postgres), NEXTAUTH_SECRET, admin & QRIS vars

pnpm db:push            # sync schema
pnpm db:seed            # buat admin + produk contoh
pnpm dev                # http://localhost:3000
```

Default admin credentials (override di `.env`):

- Email: `admin@lizetta.local`
- Password: value dari `ADMIN_PASSWORD`

## Deploy ke Vercel

1. Push repo ini ke GitHub (sudah).
2. Di Vercel: **Add New… → Project** → import `YonaMorimiya/Lizetta-Store`.
3. **Storage → Create Database → Postgres** (Neon).
   Vercel auto-inject `POSTGRES_URL` / `POSTGRES_URL_NON_POOLING`. Tambah env:
   ```
   DATABASE_URL=$POSTGRES_URL
   DIRECT_URL=$POSTGRES_URL_NON_POOLING
   ```
   (Atau langsung paste connection string dari Neon.)
4. Tambah env lain sesuai `.env.example`:
   - `NEXTAUTH_SECRET` (`openssl rand -base64 32`)
   - `NEXTAUTH_URL` = domain Vercel kamu
   - `ADMIN_EMAIL`, `ADMIN_PASSWORD`
   - `QRIS_STATIC_STRING` (hasil decode QR statis Orderkuota kamu)
   - `ORDERKUOTA_MERCHANT_ID`, `ORDERKUOTA_API_KEY`
5. Deploy. Setelah build pertama, jalankan sekali:
   ```bash
   npx vercel env pull .env
   pnpm db:push
   pnpm db:seed
   ```
   atau gunakan Vercel's **Storage → Query** untuk menjalankan `prisma migrate`.

## Cara set QRIS kamu

`QRIS_STATIC_STRING` itu string panjang yang ter-encode di QR statis Orderkuota kamu.
Cara ambil:
1. Login Orderkuota → **Atur QRIS → QRIS Statis** → download / lihat QR.
2. Decode QR-nya (misal pakai `zbarimg qris.png` atau tool online) → copy payload.
3. Paste ke `QRIS_STATIC_STRING`.

Untuk verifikasi pembayaran otomatis, daftar di [OkeConnect](https://okeconnect.com) (gratis), hubungkan akun Orderkuota, lalu isi `ORDERKUOTA_MERCHANT_ID` & `ORDERKUOTA_API_KEY` dari dashboard OkeConnect.

Kalau kamu pakai provider lain, set `QRIS_MUTASI_ENDPOINT` ke URL yang return
`{ data: [{ amount, type: "CR" | "DB", date, ... }] }`.

## Cara kerja pembayaran

1. User checkout → sistem generate `kode unik` 1-999 → total = base price + kode unik.
2. QR dinamis di-generate dari static string + amount + CRC16-CCITT ulang.
3. Halaman checkout auto-polling setiap 5 detik ke endpoint mutasi.
4. Begitu ditemukan transaksi `CR` dengan amount persis sama, order ditandai `PAID`.

Order expired dalam 15 menit kalau ga dibayar.

## Admin

- `/admin` → dashboard stats
- `/admin/products` → CRUD produk
- `/admin/orders` → daftar order

Hanya user dengan `role = ADMIN` yang bisa akses.

## Security notes

- Password user di-hash `bcrypt` 10 rounds.
- JWT-based session (NextAuth).
- Semua endpoint admin dicek role di server.
- QR dinamis di-generate server-side; client cuma terima PNG data URL.
