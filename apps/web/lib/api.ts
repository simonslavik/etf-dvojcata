/**
 * Server-side volání NestJS API ze stránek adminu. Admin cookie z prohlížeče se přeposílá,
 * takže autorizaci rozhoduje výhradně API (AdminGuard). 401 → přihlášení.
 */
import { cookies } from 'next/headers';
import { notFound, redirect } from 'next/navigation';

const API_URL = process.env.API_URL || 'http://localhost:4000';

export async function apiGet<T>(path: string): Promise<T> {
  const r = await fetch(`${API_URL}${path}`, { headers: { cookie: (await cookies()).toString() }, cache: 'no-store' });
  if (r.status === 401) redirect('/admin/login');
  if (r.status === 404) notFound();
  if (!r.ok) throw new Error(`API ${path}: ${r.status}`);
  return r.json() as Promise<T>;
}

/* Tvar JSON odpovědí z apps/api/src/admin (datumy přicházejí jako ISO řetězce) */
type Counts = Record<string, number>;
type StageCounts = Record<'lead' | 'qualified' | 'handed_over' | 'unsubscribed', number>;

export interface LeadDto {
  id: string; email: string; createdAt: string; sid: string | null; variant: string; source: string | null;
  utmSource: string | null; utmCampaign: string | null; utmContent: string | null; device: string | null;
  interest: string | null; calcMonthly: number | null; consentText: string | null; monthlyBand: string | null;
  wantsCall: boolean; phone: string | null; callConsentText: string | null; score: number;
  scoreReasons: { label: string; points: number }[] | null; stage: string;
  handedOverAt: string | null; handoffStatus: string | null; unsubscribedAt: string | null;
}

export interface DashboardDto {
  days: number;
  funnel: Record<'all' | 'twin' | 'fees', Counts>;
  stages: Record<'all' | 'twin' | 'fees', StageCounts>;
  campaigns: { key: string; visits: number; leads: number; qualified: number; handed: number; spend: number | null; cpl: number | null; conv: number | null }[];
  daily: { day: string; n: number }[];
  sequence: { rows: { step: string; status: string; n: number }[]; clicks: Record<string, number> };
  latest: LeadDto[];
  insights: string[];
  emailEnabled: boolean;
}

export interface LeadDetailDto {
  lead: LeadDto;
  journey: { id: number; event: string; createdAt: string; props: Record<string, unknown> | null }[];
  jobs: { id: number; step: string; status: string; sendAt: string; sentAt: string | null; error: string | null }[];
}
