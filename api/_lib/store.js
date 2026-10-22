/**
 * Úložiště: Upstash Redis přes REST (bez SDK). Když nejsou nastavené proměnné prostředí,
 * běží v paměti procesu – stačí pro lokální vývoj a test, na Vercelu se data mezi
 * instancemi neudrží (stats to pak hlásí jako mode: "memory").
 */
const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
export const mode = url && token ? 'redis' : 'memory';

const mem = globalThis.__etfdMem || (globalThis.__etfdMem = { sets: new Map(), lists: new Map(), hashes: new Map(), counters: new Map() });

async function pipeline(cmds) {
  const r = await fetch(`${url}/pipeline`, {
    method: 'POST',
    headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
    body: JSON.stringify(cmds),
  });
  if (!r.ok) throw new Error(`upstash ${r.status}`);
  return (await r.json()).map((x) => x.result);
}

/** Unikátní relace v kroku funnelu (HyperLogLog) + celkový počet událostí */
export async function countEvent(variant, event, sid) {
  const keys = [`f:${variant}:${event}`, `f:all:${event}`];
  if (mode === 'redis') {
    await pipeline([...keys.map((k) => ['PFADD', k, sid]), ['INCR', `c:${variant}:${event}`]]);
    return;
  }
  for (const k of keys) {
    if (!mem.sets.has(k)) mem.sets.set(k, new Set());
    mem.sets.get(k).add(sid);
  }
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

export async function saveLead(lead) {
  const key = `lead:${lead.email}`;
  if (mode === 'redis') {
    const [isNew] = await pipeline([
      ['HSETNX', key, 'created', lead.created],
      ['HSET', key, ...Object.entries(lead).flatMap(([k, v]) => [k, v == null ? '' : String(v)])],
      ['LPUSH', 'leads', lead.email],
    ]);
    return { isNew: isNew === 1 };
  }
  const isNew = !mem.hashes.has(key);
  mem.hashes.set(key, { ...(mem.hashes.get(key) || {}), ...lead });
  if (isNew) mem.lists.set('leads', [lead.email, ...(mem.lists.get('leads') || [])]);
  return { isNew };
}

export async function updateLead(email, fields) {
  const key = `lead:${email}`;
  if (mode === 'redis') {
    await pipeline([['HSET', key, ...Object.entries(fields).flatMap(([k, v]) => [k, String(v)])]]);
    return;
  }
  mem.hashes.set(key, { ...(mem.hashes.get(key) || {}), ...fields });
}

export async function leadCount() {
  if (mode === 'redis') {
    const [n] = await pipeline([['LLEN', 'leads']]);
    return Number(n) || 0;
  }
  return (mem.lists.get('leads') || []).length;
}
