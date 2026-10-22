/** České číslo: volitelně +420 / 00420, pak 9 číslic (mezery a pomlčky povolené) → +420XXXXXXXXX, jinak null */
export const normalizePhone = (v: string) => {
  const digits = v.replace(/[\s-]/g, '').replace(/^(\+|00)420/, '');
  return /^[1-9]\d{8}$/.test(digits) ? `+420${digits}` : null;
};
