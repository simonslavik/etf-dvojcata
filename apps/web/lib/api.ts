/**
 * Server-side volání NestJS API ze stránek adminu. Admin cookie z prohlížeče se přeposílá,
 * takže autorizaci rozhoduje výhradně API (AdminGuard). 401 → přihlášení.
 */
import { cookies } from 'next/headers';
import { notFound, redirect } from 'next/navigation';
import type { SequenceStep, Stage, Variant } from '@etfd/shared';
import { API_URL } from './config';

export async function apiGet<T>(path: string): Promise<T> {
  const r = await fetch(`${API_URL}${path}`, { headers: { cookie: (await cookies()).toString() }, cache: 'no-store' });
  if (r.status === 401) redirect('/admin/login');
  // 404 neexistující záznam, 400 neplatné ID (ParseUUIDPipe) → pro uživatele obojí „nenalezeno“
  if (r.status === 404 || r.status === 400) notFound();
  if (!r.ok) throw new Error(`API ${path}: ${r.status}`);
  return r.json() as Promise<T>;
}

/* Tvar JSON odpovědí z apps/api/src/admin (datumy přicházejí jako ISO řetězce) */
type Counts = Record<string, number>;
type StageCounts = Record<Stage, number>;

export interface LeadDto {
  id: string;
  email: string;
  createdAt: string;
  sid: string | null;
  variant: Variant;
  source: string | null;
  utmSource: string | null;
  utmCampaign: string | null;
  utmContent: string | null;
  device: string | null;
  interest: string | null;
  calcMonthly: number | null;
  consentText: string | null;
  monthlyBand: string | null;
  wantsCall: boolean;
  phone: string | null;
  callConsentText: string | null;
  score: number;
  scoreReasons: { label: string; points: number }[] | null;
  stage: Stage;
  handedOverAt: string | null;
  handoffStatus: string | null;
  unsubscribedAt: string | null;
}

export interface DashboardDto {
  days: number;
  funnel: Record<'all' | 'twin' | 'fees', Counts>;
  stages: Record<'all' | 'twin' | 'fees', StageCounts>;
  campaigns: {
    key: string;
    visits: number;
    leads: number;
    qualified: number;
    handed: number;
    spend: number | null;
    cpl: number | null;
    conv: number | null;
  }[];
  daily: { day: string; n: number }[];
  sequence: { rows: { step: SequenceStep; status: string; n: number }[]; clicks: Record<string, number> };
  latest: LeadDto[];
  insights: string[];
  emailEnabled: boolean;
}

export interface LeadDetailDto {
  lead: LeadDto;
  journey: { id: number; event: string; createdAt: string; props: Record<string, unknown> | null }[];
  jobs: { id: number; step: SequenceStep; status: string; sendAt: string; sentAt: string | null; error: string | null }[];
}
