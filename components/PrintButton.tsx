'use client';

import { Download } from '@/components/ui/icons';

export const PrintButton = () => (
  <button className="btn btn-ghost !min-h-11 !px-4 !text-[14px]" onClick={() => print()}><Download /> Uložit jako PDF</button>
);
