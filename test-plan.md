# Lizetta Store — Test Plan

Scope: end-to-end runtime verification of PR #1 (scaffold Lizetta Store). Tests are designed so a broken implementation would produce visibly different results.

## Test 1 — Admin login + gate

- Navigate `/admin` as anonymous → **expect redirect to `/login?callbackUrl=/admin`**.
- Login with `admin@lizetta.local` / `LizettaAdmin2026!` → **expect redirect back to `/admin`** with dashboard tiles visible (Revenue / Orders / Products / Users tiles, non-zero Products count of `6`).

## Test 2 — Admin CRUD (create product)

- On `/admin/products`, click **Produk Baru** → form opens.
- Fill: name `Test Steam Gift 100K`, description `Gift card steam regional ID`, price `99000`, category `Gaming`, image `https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&q=80`, stock `50`, check **Featured** + **Aktif** → click **Simpan**.
- **Expect**: toast "Produk ditambah"; row appears at top of table with badge `Aktif` + `Featured`.
- Open new tab at `/products` (anonymous) → **expect the new product card to render** with price `Rp 99.000` and category badge `Gaming`.

## Test 3 — Non-admin user cannot access `/admin`

- Register new user `buyer@lizetta.local` / `buyer1234` via `/register`.
- After auto-login, navigate `/admin` → **expect redirect to `/` (home)**, NOT dashboard.

## Test 4 — Cart → checkout → QR rendering

- As `buyer@lizetta.local`, open `/products/test-steam-gift-100k`, click **Beli Sekarang** → lands on `/cart`.
- Click **Bayar dengan QRIS** → redirected to `/checkout/<orderId>`.
- **Expect**:
  - Page shows QR image (PNG on white background).
  - "Total yang harus dibayar" is `Rp 99.0XX` where `XX` is the 3-digit kode unik (1-999). Assertion: total != 99000, and `(total - 99000) ∈ [1, 999]`.
  - Status badge "Menunggu pembayaran…" with ticking MM:SS countdown < 15:00.

## Test 5 — Payment flip via mock mutasi

- Inspect total from Test 4 UI → write it to `/tmp/mock-mutasi-amount` so the mock endpoint reports a matching `CR` entry.
- Wait ≤10s for the page's 5s poll to catch it.
- **Expect**: status banner changes to green "Pembayaran diterima ✓"; no page refresh needed.
- Verify in `/admin/orders`: this order row shows status `PAID`.

## Test 6 — TempMail gated + functional

- Logout and open `/tempmail` while anonymous → **expect gated card** with "Login dulu ya" + Login/Register buttons, NOT the generator.
- Login as `buyer@lizetta.local`, open `/tempmail` → click **Generate TempMail** → **expect** an address `<local>@<mail.tm domain>` appear within 5s, "Alamat aktif" shown, `expiresAt` visible.
- Click **Copy** icon → address copied (we verify by pasting into URL bar).
- Leave inbox open; from a second mail.tm account (created via `curl`), send a message to the generated address. Wait ≤15s → **expect** the inbox list to update (count ≥ 1, subject visible).
- Click the message → body panel opens with subject + from + html/text.

## Regression check (quick)

- `/` home page renders without errors; featured section now contains the admin-created product (featured flag on).
- `/products?category=Gaming` filters to Gaming items only.

---

Pass/Fail recording: I will call `annotate_recording` for each test with `test_start` and a consolidated `assertion` (passed / failed / untested).
