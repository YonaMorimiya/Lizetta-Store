# Lizetta Store — Test Report

**Test session:** https://app.devin.ai/sessions/0af8535ec76b4d12a7be38b6249514c8
**Repo:** https://github.com/YonaMorimiya/Lizetta-Store
**PR:** #1 (merged)
**Environment:** Local — Next.js 14 dev server (localhost:3000) + Postgres 16 (docker, :5433) + mock Orderkuota mutasi server (:3333)
**Date:** 2026-04-28

## Summary

7 of 8 tests passed. 1 test partially untested due to VM network limits. No code bugs discovered.

| # | Test | Result |
|---|------|--------|
| 1 | Anonymous `/admin` redirects to `/login?callbackUrl=/admin`, admin login lands on dashboard | PASSED |
| 2 | Admin creates product → appears in admin table + on storefront `/products` | PASSED |
| 3 | Non-admin user hitting `/admin` is redirected to `/` | PASSED |
| 4 | Cart → checkout generates order with Rp 99.000 + 3-digit unique code, QR PNG renders | PASSED |
| 5 | Posting matching mutasi to mock endpoint flips order status to PAID in ≤10s | PASSED |
| 6a | `/tempmail` shows "Login dulu ya" gate card for anonymous users | PASSED |
| 6b | Authenticated user generates tempmail address + expiry + DB entry | PASSED |
| 6c | Receiving real email in tempmail inbox | **UNTESTED** (outbound SMTP :25 blocked on VM) |
| 7 | Admin `/admin/orders` shows PAID + PENDING orders with correct buyer email | PASSED |
| 8 | `/products?category=Gaming` filters to only Gaming products | PASSED |

## Escalations

- **Inbox receive path not covered locally**: The VM blocks outbound SMTP to port 25 (`in.mail.tm` MX unreachable). Generator + DB persistence + expiry + gate card were all verified; actual message delivery & display in the inbox panel could not be exercised. Recommend verifying this on Vercel by sending an email to the generated address from any Gmail/Yahoo account.
- **QRIS static string**: The placeholder one I used for testing is a minimum-valid EMVCo structure — it is NOT scannable by a real bank. Real `QRIS_STATIC_STRING` from Orderkuota must be configured in Vercel env before production.
- **Mutasi verification**: Used local mock `QRIS_MUTASI_ENDPOINT=http://localhost:3333/mutasi` returning a matching CR entry on demand. Real OkeConnect creds (`ORDERKUOTA_MERCHANT_ID`, `ORDERKUOTA_API_KEY`) must be set in Vercel env.

## Evidence

### Test 1 — Admin login + dashboard
Visiting `/admin` while anonymous bounces to the login screen. After submitting admin creds, dashboard shows Products: 6 / Users: 1 matching the seed.

![Admin dashboard](https://app.devin.ai/attachments/c24932b2-9ed3-4e17-bc65-7a9942fcb5e7/screenshot_4533670e0b2d426c8fa4e80836a73ef4.png)

### Test 2 — Admin creates "Test Steam Gift 100K"
Toast "Produk ditambah" confirms POST `/api/admin/products` success; row appears at top with `Aktif Featured` badge, Rp 99.000, category Gaming, slug `/test-steam-gift-100k`.

![Admin products table after create](https://app.devin.ai/attachments/e08124ef-cc7b-4dd1-be48-500451103caf/screenshot_a99317a6ffd846f88582d3749c3b2acc.png)

New product visible on public storefront `/products` with Gaming+Featured badge.

![Storefront shows new product](https://app.devin.ai/attachments/415a3761-9559-4df4-9cc9-b9ede1d66e4d/screenshot_5ec6804ec46f4409ac774156427b3494.png)

### Test 4 — Cart → checkout → QR render
Cart loaded with Test Steam Gift 100K @ Rp 99.000. After "Bayar dengan QRIS", user redirected to `/checkout/cmohynx740001a8s9mn68k93e`. Order total = Rp 99.987 = Rp 99.000 + unique code 987 (within 1–999). QR PNG rendered; 15:00 countdown visible.

![Product detail page](https://app.devin.ai/attachments/18ee5334-28c0-43db-916e-37dec30b071f/screenshot_3c3cafeea07c411db4a35ed901740010.png)

### Test 5 — Payment flip
After `echo 99987 > /tmp/mock-mutasi-amount`, mock server started returning a matching CR transaction. Within ~8s the checkout page's 5s poll picked it up and the banner flipped from yellow "Menunggu pembayaran…" to green "Pembayaran diterima ✓".

![Checkout paid state](https://app.devin.ai/attachments/45208c8b-c14d-474e-b818-92d515319690/screenshot_0d0298f86ce741de889e1eaf1e611592.png)

### Test 6 — TempMail generator
Authenticated user clicked "Generate TempMail" → address `buyertxqj@deltajohnsons.com` created with `Expired: 29/4/2026, 01.44.11`. DB row confirmed via `SELECT address, "expiresAt" FROM "Mailbox"`.

![TempMail active address](https://app.devin.ai/attachments/dfbdba9f-60d2-40d2-b9bb-15184446abdc/screenshot_92874c05547e4624a521e3e51f9d1201.png)

### Test 7 — Admin orders list
Admin `/admin/orders` shows 2 orders: the just-paid one (Rp 99.987 PAID) and the earlier QRIS-failed one (Rp 99.592 PENDING). Both tied to `buyer@lizetta.local`.

![Admin orders list](https://app.devin.ai/attachments/5326d576-8afd-4a52-86aa-74e544c2cdd1/screenshot_85f82f1297824732b12d9cf19794abe1.png)

### Test 8 — Category filter
`/products?category=Gaming` narrows the grid to the single Gaming product, with the Gaming chip highlighted in the filter bar.

![Products filtered by Gaming](https://app.devin.ai/attachments/d31b155c-e21f-45ea-9eef-50977fca0bc8/screenshot_fbc83abc4c224e1099d796294074b6cf.png)

## Notes

- Auth: Register endpoint auto-signs the user in (nice UX). Session cookie survives hot-reload (only test-specific restart clears localStorage cart).
- QRIS dynamic generation rejected my initial malformed static string with a clear error ("missing 5802ID tag"). A well-formed minimal EMVCo string worked on the next attempt. Real Orderkuota static strings ship pre-validated so users won't hit this.
- All Prisma routes responded within <1s on my local box; no N+1 or slow-query issues observed.
- TempMail generator uses mail.tm's public API which is unauthenticated and rate-limited — should be fine for a store but worth monitoring if you get heavy abuse.
