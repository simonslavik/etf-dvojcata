import type { ReactNode } from 'react';
import type { Metadata, Viewport } from 'next';
import { JetBrains_Mono, Lexend, Lora } from 'next/font/google';
import './globals.css';

// next/font písma self-hostuje při buildu (žádný render-blocking požadavek na Google).
// Přednačítá se jen Lora 700 (nadpisy = LCP). Lexend (text) a mono (ISIN) se nepřednačítají – krátce se
// ukáže systémové písmo se stejnými metrikami (adjustFontFallback), takže nic neposkočí (CLS 0).
const lora = Lora({ subsets: ['latin', 'latin-ext'], weight: ['700'], variable: '--font-lora', display: 'swap' });
const lexend = Lexend({ subsets: ['latin', 'latin-ext'], variable: '--font-lexend', display: 'swap', preload: false });
const mono = JetBrains_Mono({ subsets: ['latin'], weight: ['500', '700'], variable: '--font-jetbrains', display: 'swap', preload: false });

const site = process.env.SITE_URL || 'http://localhost:3000';

export const metadata: Metadata = {
  metadataBase: new URL(site),
  title: 'ETF dvojčata – evropské verze amerických ETF, které v Česku koupíte',
  description:
    'VOO, SPY nebo VTI vám evropský broker neprodá. Najděte jejich evropská dvojčata se stejným indexem, ISIN a poplatky. Zdarma, za pár vteřin.',
  openGraph: {
    title: 'VOO si v Česku nekoupíte. Jeho dvojče ano.',
    description: 'Evropské verze populárních amerických ETF – stejný index, ISIN, poplatky. Přehled zdarma.',
    images: ['/og.png'],
    locale: 'cs_CZ',
    type: 'website',
  },
  icons: { icon: '/favicon.svg' },
};

export const viewport: Viewport = { themeColor: '#163b3b', width: 'device-width', initialScale: 1, viewportFit: 'cover' };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="cs" className={`${lora.variable} ${lexend.variable} ${mono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
