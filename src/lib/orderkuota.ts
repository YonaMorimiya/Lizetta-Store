/**
 * Orderkuota mutasi poller.
 *
 * Orderkuota itself doesn't expose a public REST API, so this module uses the
 * de-facto community endpoint exposed by OkeConnect which wraps Orderkuota's
 * QRIS mutasi history:
 *
 *   GET https://gateway.okeconnect.com/api/mutasi/qris/{MERCHANT_ID}/{API_KEY}
 *
 * If you use a different provider, you can override QRIS_MUTASI_ENDPOINT in
 * your env to any URL that returns `{ data: [{ amount, type, date, ... }] }`.
 */

export interface MutasiEntry {
  amount: number;
  type: "CR" | "DB" | string;
  date: string;
  brand_name?: string;
  issuer_reff?: string;
}

interface MutasiResponse {
  status?: string;
  data?: Array<{
    amount: string | number;
    type: string;
    date: string;
    brand_name?: string;
    issuer_reff?: string;
  }>;
}

function getEndpoint(): string | null {
  const override = process.env.QRIS_MUTASI_ENDPOINT;
  if (override) return override;
  const merchant = process.env.ORDERKUOTA_MERCHANT_ID;
  const key = process.env.ORDERKUOTA_API_KEY;
  if (!merchant || !key) return null;
  return `https://gateway.okeconnect.com/api/mutasi/qris/${merchant}/${key}`;
}

export async function fetchRecentMutasi(): Promise<MutasiEntry[]> {
  const url = getEndpoint();
  if (!url) return [];

  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return [];
    const json = (await res.json()) as MutasiResponse;
    if (!json.data) return [];
    return json.data.map((d) => ({
      amount: typeof d.amount === "string" ? parseInt(d.amount, 10) : d.amount,
      type: d.type,
      date: d.date,
      brand_name: d.brand_name,
      issuer_reff: d.issuer_reff,
    }));
  } catch {
    return [];
  }
}

/**
 * Returns true if any recent credit (type === "CR") matches the expected
 * amount exactly. We rely on the unique-code trick (base price + random
 * 1-999) so two users paying the same product have distinguishable totals.
 */
export async function findMatchingPayment(expectedAmount: number): Promise<MutasiEntry | null> {
  const mutasi = await fetchRecentMutasi();
  for (const m of mutasi) {
    if (m.type === "CR" && m.amount === expectedAmount) return m;
  }
  return null;
}
