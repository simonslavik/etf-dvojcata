/* Typovaný přístup k ověřeným datům (data/etfs.json). Každý údaj má zdroj a datum. */
import raw from '../data/etfs.json' with { type: 'json' };

export interface Fact { label: string; url: string; cs: string; accessed: string }

export interface UsEtf {
  ticker: string; name: string; issuer: string; exchange: string; index: string;
  ter_pct: number; aum_usd_bn: number | null; aum_as_of: string | null; source_url: string; accessed: string;
}

export interface Twin {
  ticker: string; aka: string | null; name: string; issuer: string; isin: string; index: string;
  ter_pct: number; distribution: 'Acc' | 'Dist' | '–'; size_eur_m: number | null;
  form: 'UCITS' | 'ETC'; exchange: string; domicile: string; source_url: string; accessed: string;
}

export interface Alt { ticker: string; isin: string; ter_pct: number; name: string }

export interface Pair { us: UsEtf; twin: Twin; alts: Alt[]; match: 'exact' | 'close'; note: string | null }

export interface BankFund {
  label: string; ter_pct: number; entry_fee_pct: number; example: string; source_url: string; accessed: string;
}

export interface EtfData {
  as_of: string;
  pairs: Pair[];
  excluded: { ticker: string; reason: string; url: string }[];
  calc: { annual_return: number; bank: BankFund; etf: { label: string; ter_pct: number; source_url: string } };
  facts: Record<'priips' | 'priips_broker' | 'elective_pro' | 'time_test' | 'value_limit' | 'cap' | 'dividends' | 'brokers', Fact>;
  sources: { label: string; url: string; accessed: string }[];
}

export const data = raw as unknown as EtfData;
export const pairByTicker = (t: string) => data.pairs.find((p) => p.us.ticker === t);
export const exactTickers = data.pairs.filter((p) => p.match === 'exact').map((p) => p.us.ticker);
