import { Injectable } from '@nestjs/common';
import { SIGNAL_POINTS, scoreLead, stageFor } from '@etfd/shared';
import { and, eq, inArray } from 'drizzle-orm';
import { InjectDb, type Db } from '../db/db.js';
import { events, leads, type Lead } from '../db/schema.js';

/** Relace leadu pro události mimo prohlížeč (klik v e-mailu, předání) */
export const leadSid = (l: Pick<Lead, 'id' | 'sid'>) => l.sid || `lead:${l.id}`;
/** Všechny relace leadu – serverové události mohly vzniknout ještě před uložením sid z prohlížeče */
export const leadSids = (l: Pick<Lead, 'id' | 'sid'>) => [...new Set([leadSid(l), `lead:${l.id}`])];

/** Přepočet skóre a fáze po každé změně leadu – dashboard i webhook vidí aktuální stav */
@Injectable()
export class ScoringService {
  constructor(@InjectDb() private readonly db: Db) {}

  async rescore(leadId: string): Promise<Lead | null> {
    const [lead] = await this.db.select().from(leads).where(eq(leads.id, leadId));
    if (!lead) return null;
    const signalRows = await this.db.selectDistinct({ event: events.event }).from(events)
      .where(and(inArray(events.sid, leadSids(lead)), inArray(events.event, Object.keys(SIGNAL_POINTS))));
    const { score, reasons } = scoreLead({ monthlyBand: lead.monthlyBand, wantsCall: lead.wantsCall, signals: signalRows.map((r) => r.event) });
    const stage = stageFor({ score, handedOver: Boolean(lead.handedOverAt), unsubscribed: Boolean(lead.unsubscribedAt) });
    const [updated] = await this.db.update(leads).set({ score, scoreReasons: reasons, stage, updatedAt: new Date() }).where(eq(leads.id, leadId)).returning();
    return updated;
  }
}
