/**
 * QRIS dynamic generator.
 *
 * Converts a static QRIS string (e.g. from Orderkuota's "Transfer → QRIS Statis")
 * into a dynamic QR encoding a specific IDR amount by:
 *   1. stripping the existing CRC16 (last 4 hex chars)
 *   2. flipping tag 01 from "11" (static) to "12" (dynamic)
 *   3. injecting tag 54 (transaction amount) right before tag 58 (country code)
 *   4. appending a recalculated CRC16-CCITT (poly 0x1021, init 0xFFFF)
 *
 * Reference: EMVCo MPM spec + Bank Indonesia QRIS spec.
 */
export function generateDynamicQris(staticString: string, amount: number): string {
  if (!staticString) throw new Error("QRIS_STATIC_STRING is not configured");
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("amount must be a positive number");
  }

  // 1. strip CRC
  let body = staticString.slice(0, -4);

  // 2. static -> dynamic
  body = body.replace("010211", "010212");

  // 3. inject tag 54 amount before tag 58 (country)
  const amountStr = String(Math.round(amount));
  const amountTag = `54${amountStr.length.toString().padStart(2, "0")}${amountStr}`;

  const countryIdx = body.indexOf("5802ID");
  if (countryIdx === -1) {
    throw new Error("invalid QRIS static string: missing 5802ID tag");
  }

  const withAmount = body.slice(0, countryIdx) + amountTag + body.slice(countryIdx);

  // 4. recalc CRC16
  const withCrcPrefix = withAmount + "6304";
  const crc = crc16ccitt(withCrcPrefix);
  return withCrcPrefix + crc;
}

export function crc16ccitt(input: string): string {
  let crc = 0xffff;
  for (let i = 0; i < input.length; i++) {
    crc ^= input.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if (crc & 0x8000) {
        crc = ((crc << 1) ^ 0x1021) & 0xffff;
      } else {
        crc = (crc << 1) & 0xffff;
      }
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

/**
 * Generate a unique 3-digit "kode unik" to append to the base price so we can
 * match the exact incoming mutasi amount back to the correct order.
 *
 * Returns a number between 1 and 999.
 */
export function generateUniqueCode(): number {
  return Math.floor(Math.random() * 999) + 1;
}
