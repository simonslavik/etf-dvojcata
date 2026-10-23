/* Ikony v duchu Lucide (2px tah, kulaté konce) – inline SVG, žádná knihovna navíc */
import type { SVGProps } from 'react';

const base = { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true } as const;
type P = SVGProps<SVGSVGElement>;

export const ArrowRight = (p: P) => <svg {...base} {...p}><path d="M5 12h14M13 6l6 6-6 6" /></svg>;
export const Check = (p: P) => <svg {...base} {...p}><path d="m5 12.5 4.5 4.5L19 7.5" /></svg>;
export const Copy = (p: P) => <svg {...base} {...p}><rect x="9" y="9" width="11" height="11" rx="2" /><path d="M5 15V6a2 2 0 0 1 2-2h9" /></svg>;
export const X = (p: P) => <svg {...base} {...p}><path d="M6 6l12 12M18 6 6 18" /></svg>;
export const ShieldCheck = (p: P) => <svg {...base} {...p}><path d="M12 3 5 6v5c0 4.5 3 8.3 7 10 4-1.7 7-5.5 7-10V6l-7-3Z" /><path d="m9 12 2 2 4-4" /></svg>;
export const LinkIcon = (p: P) => <svg {...base} {...p}><path d="M10 14a4.5 4.5 0 0 0 6.4 0l3-3a4.5 4.5 0 0 0-6.4-6.4l-1 1" /><path d="M14 10a4.5 4.5 0 0 0-6.4 0l-3 3a4.5 4.5 0 0 0 6.4 6.4l1-1" /></svg>;
export const Layers = (p: P) => <svg {...base} {...p}><path d="m12 3 9 5-9 5-9-5 9-5Z" /><path d="m3 13 9 5 9-5" /></svg>;
export const Target = (p: P) => <svg {...base} {...p}><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1" /></svg>;
export const Chart = (p: P) => <svg {...base} {...p}><path d="M4 4v16h16" /><path d="m8 15 3.5-4 3 2.5L19 8" /></svg>;
export const Pointer = (p: P) => <svg {...base} {...p}><path d="M5 3.5 19 10l-6 2-2 6L5 3.5Z" /></svg>;
export const Mail = (p: P) => <svg {...base} {...p}><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3.5 6.5 8.5 6.5 8.5-6.5" /></svg>;
export const Phone = (p: P) => <svg {...base} {...p}><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a1 1 0 0 1-1 1A16 16 0 0 1 4 5a1 1 0 0 1 1-1Z" /></svg>;
export const Lock = (p: P) => <svg {...base} {...p}><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></svg>;
export const Search = (p: P) => <svg {...base} {...p}><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>;
export const Download = (p: P) => <svg {...base} {...p}><path d="M12 4v11M7 10l5 5 5-5M5 20h14" /></svg>;
