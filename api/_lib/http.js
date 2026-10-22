export async function readJson(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') return safeParse(req.body);
  const chunks = [];
  let size = 0;
  for await (const c of req) {
    size += c.length;
    if (size > 16_000) throw Object.assign(new Error('payload too large'), { status: 413 });
    chunks.push(c);
  }
  return safeParse(Buffer.concat(chunks).toString('utf8'));
}

function safeParse(s) {
  try { return JSON.parse(s || '{}'); } catch { return {}; }
}

export function send(res, status, data) {
  res.statusCode = status;
  res.setHeader('content-type', 'application/json; charset=utf-8');
  res.setHeader('cache-control', 'no-store');
  res.end(JSON.stringify(data));
}

export const clip = (v, n = 80) => (typeof v === 'string' ? v.slice(0, n) : v == null ? null : String(v).slice(0, n));
