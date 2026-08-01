// A whole plan packed into a URL fragment, so one can be handed to someone else without a
// backend. Pure logic — no React, no DOM beyond the compression primitives the browser and
// Node both expose, so it's importable in tests.

/* Keys carried in a link. Deliberately the plan and nothing else: scenarios and snapshots
   are somebody's local history, not part of what they meant to send, and they're what would
   push a link past what browsers and chat apps will carry. */
export const PLAN_KEYS = ["accounts", "debts", "income", "expenses", "transfers", "debtPayments", "payments", "settings"];
export const HASH_KEY = "plan";
/* One leading character says how the rest was packed, so an old link keeps working if the
   packing ever changes: "1" is raw deflate, "0" is plain JSON. */
const DEFLATED = "1", PLAIN = "0";

export const planOnly = (p) => {
  const out = {};
  if (!p || typeof p !== "object") return out;
  for (const k of PLAN_KEYS) if (p[k] != null) out[k] = p[k];
  return out;
};

/* base64url: the fragment is a URL, so "+/=" have to go */
function bytesToB64(bytes) {
  let s = "";
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function b64ToBytes(b64) {
  const s = atob(String(b64).replace(/-/g, "+").replace(/_/g, "/"));
  const out = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) out[i] = s.charCodeAt(i);
  return out;
}
async function through(stream, bytes) {
  const w = stream.writable.getWriter();
  /* on malformed input both sides reject; the reader below is the one we let throw, so the
     writer's rejection is swallowed rather than escaping as an unhandled promise */
  w.write(bytes).then(() => w.close(), () => { }).catch(() => { });
  const chunks = []; let total = 0;
  const rd = stream.readable.getReader();
  for (; ;) {
    const { value, done } = await rd.read();
    if (done) break;
    chunks.push(value); total += value.length;
  }
  const out = new Uint8Array(total);
  let at = 0;
  for (const c of chunks) { out.set(c, at); at += c.length; }
  return out;
}
const canDeflate = () => typeof CompressionStream === "function" && typeof DecompressionStream === "function";

/* The seed plan is ~7 KB of JSON and about a kilobyte deflated, so a link stays inside what
   every browser will accept. Without CompressionStream it still works, just longer. */
export async function encodePlan(plan) {
  const json = JSON.stringify(planOnly(plan));
  const bytes = new TextEncoder().encode(json);
  if (!canDeflate()) return PLAIN + bytesToB64(bytes);
  try {
    return DEFLATED + bytesToB64(await through(new CompressionStream("deflate-raw"), bytes));
  } catch {
    return PLAIN + bytesToB64(bytes);
  }
}

/* Returns null for anything it can't read — a truncated link, a stray fragment, someone
   else's `#section` anchor. A share link is untrusted input by definition. */
export async function decodePlan(payload) {
  const s = String(payload || "");
  if (s.length < 2) return null;
  const tag = s[0], body = s.slice(1);
  try {
    let bytes = b64ToBytes(body);
    if (tag === DEFLATED) {
      if (!canDeflate()) return null;
      bytes = await through(new DecompressionStream("deflate-raw"), bytes);
    } else if (tag !== PLAIN) return null;
    const data = JSON.parse(new TextDecoder().decode(bytes));
    if (!data || typeof data !== "object" || Array.isArray(data)) return null;
    /* a plan with no accounts isn't a plan — better to say "unreadable link" than to offer
       an empty one and let someone replace their own data with nothing */
    if (!Array.isArray(data.accounts) || !data.accounts.length) return null;
    return planOnly(data);
  } catch { return null; }
}

/* `#plan=…` among whatever else the fragment carries, so it composes with other anchors */
export function readHash(hash) {
  const s = String(hash || "").replace(/^#/, "");
  if (!s) return null;
  for (const part of s.split("&")) {
    const eq = part.indexOf("=");
    if (eq > 0 && part.slice(0, eq) === HASH_KEY) return decodeURIComponent(part.slice(eq + 1));
  }
  return null;
}
/* Drops the plan and keeps any other fragment entries, so clearing the link after a decision
   doesn't clobber an unrelated anchor. */
export function stripHash(hash) {
  const s = String(hash || "").replace(/^#/, "");
  const kept = s.split("&").filter((p) => p && p.split("=")[0] !== HASH_KEY);
  return kept.length ? "#" + kept.join("&") : "";
}
export function shareUrl(href, payload) {
  const base = String(href || "").split("#")[0];
  return base + "#" + HASH_KEY + "=" + payload;
}
