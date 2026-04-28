/**
 * Thin wrapper around the public mail.tm API.
 * Docs: https://docs.mail.tm/
 */

const BASE = "https://api.mail.tm";

interface MailtmDomain {
  id: string;
  domain: string;
  isActive: boolean;
  isPrivate: boolean;
}

export interface MailtmMessageSummary {
  id: string;
  from: { address: string; name: string };
  to: { address: string; name: string }[];
  subject: string;
  intro: string;
  seen: boolean;
  createdAt: string;
}

export interface MailtmMessage extends MailtmMessageSummary {
  text?: string;
  html?: string[];
}

let domainCache: { domain: string; at: number } | null = null;

async function pickDomain(): Promise<string> {
  const ttl = (parseInt(process.env.MAILTM_DOMAIN_CACHE_MINUTES || "60", 10) || 60) * 60 * 1000;
  if (domainCache && Date.now() - domainCache.at < ttl) return domainCache.domain;

  const res = await fetch(`${BASE}/domains?page=1`, { cache: "no-store" });
  if (!res.ok) throw new Error("mail.tm: failed to fetch domains");
  const json = (await res.json()) as { "hydra:member"?: MailtmDomain[] };
  const active = (json["hydra:member"] || []).find((d) => d.isActive && !d.isPrivate);
  if (!active) throw new Error("mail.tm: no active domain");
  domainCache = { domain: active.domain, at: Date.now() };
  return active.domain;
}

function randomToken(n = 10): string {
  const alphabet = "abcdefghijklmnopqrstuvwxyz0123456789";
  let s = "";
  for (let i = 0; i < n; i++) s += alphabet[Math.floor(Math.random() * alphabet.length)];
  return s;
}

export async function createMailtmAccount(preferredLocal?: string): Promise<{
  id: string;
  address: string;
  password: string;
  token: string;
}> {
  const domain = await pickDomain();
  const local = (preferredLocal?.replace(/[^a-z0-9]/gi, "").toLowerCase() || randomToken(10)).slice(0, 20);
  const address = `${local}${randomToken(4)}@${domain}`;
  const password = randomToken(14);

  const createRes = await fetch(`${BASE}/accounts`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ address, password }),
  });
  if (!createRes.ok) {
    const txt = await createRes.text().catch(() => "");
    throw new Error(`mail.tm: create account failed: ${createRes.status} ${txt}`);
  }
  const created = (await createRes.json()) as { id: string };

  const tokenRes = await fetch(`${BASE}/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ address, password }),
  });
  if (!tokenRes.ok) throw new Error("mail.tm: token request failed");
  const { token } = (await tokenRes.json()) as { token: string };

  return { id: created.id, address, password, token };
}

export async function listMailtmMessages(token: string): Promise<MailtmMessageSummary[]> {
  const res = await fetch(`${BASE}/messages?page=1`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!res.ok) return [];
  const json = (await res.json()) as { "hydra:member"?: MailtmMessageSummary[] };
  return json["hydra:member"] || [];
}

export async function getMailtmMessage(token: string, id: string): Promise<MailtmMessage | null> {
  const res = await fetch(`${BASE}/messages/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!res.ok) return null;
  return (await res.json()) as MailtmMessage;
}

export async function deleteMailtmMessage(token: string, id: string): Promise<boolean> {
  const res = await fetch(`${BASE}/messages/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.ok;
}

export async function deleteMailtmAccount(token: string, id: string): Promise<boolean> {
  const res = await fetch(`${BASE}/accounts/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.ok;
}
