/**
 * Úložiště: Upstash Redis přes REST (bez SDK). Když nejsou nastavené proměnné prostředí,
 * běží v paměti procesu – stačí pro lokální vývoj a test, na Vercelu se data mezi
 * instancemi neudrží (stats to pak hlásí jako mode: "memory").
 */
const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
export const mode = url && token ? 'redis' : 'memory';

const mem = globalThis.__etfdMem || (globalThis.__etfdMem = { sets: new Map(), hashes: new Map(), counters: new Map() });

async function pipeline(cmds) {
  const r = await fetch(`${url}/pipeline`, {
    method: 'POST',
    headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
    body: JSON.stringify(cmds),
  });
  if (!r.ok) throw new Error(`upstash ${r.status}`);
  return (await r.json()).map((x) => x.result);
}

const memSet = (k) => mem.sets.get(k) || mem.sets.set(k, new Set()).get(k);

/** Unikátní relace v kroku funnelu (HyperLogLog) + celkový počet událostí */
export async function countEvent(variant, event, sid) {
  const keys = [`f:${variant}:${event}`, `f:all:${event}`];
  if (mode === 'redis') {
    await pipeline([...keys.map((k) => ['PFADD', k, sid]), ['INCR', `c:${variant}:${event}`]]);
    return;
  }
  for (const k of keys) memSet(k).add(sid);
  const ck = `c:${variant}:${event}`;
  mem.counters.set(ck, (mem.counters.get(ck) || 0) + 1);
}

export async function uniqueCounts(variants, events) {
  const keys = variants.flatMap((v) => events.map((e) => `f:${v}:${e}`));
  const values = mode === 'redis'
    ? await pipeline(keys.map((k) => ['PFCOUNT', k]))
    : keys.map((k) => mem.sets.get(k)?.size || 0);
  const out = {};
  keys.forEach((k, i) => {
    const [, v, e] = k.split(':');
    (out[v] ||= {})[e] = Number(values[i]) || 0;
  });
  return out;
}

/** Uloží lead; opakované odeslání stejného e-mailu jen doplní kontext, `created` zůstane první. */
export async function saveLead({ created, ...lead }) {
  const key = `lead:${lead.email}`;
  const fields = Object.entries(lead).flatMap(([k, v]) => [k, v == null ? '' : String(v)]);
  if (mode === 'redis') {
    const [isNew] = await pipeline([['HSETNX', key, 'created', created], ['HSET', key, ...fields], ['SADD', 'leads', lead.email]]);
    return { isNew: isNew === 1 };
  }
  const isNew = !mem.hashes.has(key);
  mem.hashes.set(key, { created, ...(mem.hashes.get(key) || {}), ...lead });
  memSet('leads').add(lead.email);
  return { isNew };
}

/** Kvalifikaci zapíše jen k existujícímu leadu – nejde tak založit záznam pro cizí e-mail. */
export async function updateLead(email, fields) {
  const key = `lead:${email}`;
  if (mode === 'redis') {
    const [exists] = await pipeline([['EXISTS', key]]);
    if (!exists) return false;
    await pipeline([['HSET', key, ...Object.entries(fields).flatMap(([k, v]) => [k, String(v)])]]);
    return true;
  }
  if (!mem.hashes.has(key)) return false;
  mem.hashes.set(key, { ...mem.hashes.get(key), ...fields });
  return true;
}

export async function leadCount() {
  if (mode === 'redis') return Number((await pipeline([['SCARD', 'leads']]))[0]) || 0;
  return mem.sets.get('leads')?.size || 0;
}

/** Jednoduchý fixed-window limit: true = ještě v limitu */
export async function withinLimit(key, limit, windowSec) {
  if (mode === 'redis') {
    const [n] = await pipeline([['INCR', `rl:${key}`], ['EXPIRE', `rl:${key}`, windowSec, 'NX']]);
    return Number(n) <= limit;
  }
  const now = Date.now();
  const e = mem.counters.get(`rl:${key}`);
  const cur = !e || e.reset < now ? { n: 0, reset: now + windowSec * 1000 } : e;
  cur.n += 1;
  mem.counters.set(`rl:${key}`, cur);
  return cur.n <= limit;
}
