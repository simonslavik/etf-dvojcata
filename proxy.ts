import { NextResponse, type NextRequest } from 'next/server';
import { ADMIN_COOKIE, isAdmin } from '@/lib/server/auth';

const VARIANT_COOKIE = 'etfd_v';

/** ?ad=fees | ?ad=b | utm_content=ad_b → varianta B (poplatky), jinak A (dvojče) */
function variantFromQuery(sp: URLSearchParams) {
  const v = (sp.get('ad') || sp.get('utm_content') || '').toLowerCase();
  if (!v) return null;
  return ['fees', 'b', 'ad_b'].includes(v) ? 'fees' : ['twin', 'a', 'ad_a'].includes(v) ? 'twin' : null;
}

export async function proxy(req: NextRequest) {
  const { pathname, searchParams } = req.nextUrl;

  // Message match: obě varianty jsou staticky předrenderované (/v/twin, /v/fees) – URL v prohlížeči zůstane „/?ad=…“
  if (pathname === '/') {
    const fromQuery = variantFromQuery(searchParams);
    const variant = fromQuery || (req.cookies.get(VARIANT_COOKIE)?.value === 'fees' ? 'fees' : 'twin');
    const res = NextResponse.rewrite(new URL(`/v/${variant}${req.nextUrl.search}`, req.url));
    // Varianta se drží po celou relaci (reload bez parametrů ji nezmění, přehled ví, odkud návštěvník přišel)
    if (fromQuery) res.cookies.set(VARIANT_COOKIE, variant, { sameSite: 'lax', path: '/', httpOnly: false });
    return res;
  }

  if (pathname.startsWith('/admin/login')) return NextResponse.next();
  if (!(await isAdmin(req.cookies.get(ADMIN_COOKIE)?.value))) {
    if (pathname.startsWith('/api/')) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    return NextResponse.redirect(new URL('/admin/login', req.url));
  }
  return NextResponse.next();
}

export const config = { matcher: ['/', '/admin/:path*', '/api/admin/:path*'] };
