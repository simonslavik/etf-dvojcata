/* Úspěch po odeslání: fajka se nakreslí tahem a kolem ní se krátce rozletí pár teček v barvách značky */
const COLORS = ['var(--color-brick)', 'var(--color-teal-500)', 'var(--color-ok)', '#e9a9a2', 'var(--color-teal-800)'];
const PARTICLES = Array.from({ length: 14 }, (_, i) => {
  const angle = (i / 14) * Math.PI * 2 + (i % 2 ? 0.2 : 0);
  const dist = 34 + (i % 3) * 10;
  return { x: Math.cos(angle) * dist, y: Math.sin(angle) * dist, r: (i * 47) % 180, c: COLORS[i % COLORS.length], s: 5 + (i % 3) * 2 };
});

export function SuccessCheck() {
  return (
    <span className="relative grid h-14 w-14 place-items-center" aria-hidden="true">
      {PARTICLES.map((p, i) => (
        <i
          key={i}
          className="absolute top-1/2 left-1/2 -mt-1 -ml-1 rounded-full animate-burst opacity-0"
          style={{ width: p.s, height: p.s, background: p.c, ['--x' as string]: `${p.x}px`, ['--y' as string]: `${p.y}px`, ['--r' as string]: `${p.r}deg` }}
        />
      ))}
      <span className="animate-pop grid h-14 w-14 place-items-center rounded-full bg-ok-50 text-ok">
        <svg viewBox="0 0 24 24" className="draw-check h-7 w-7" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
          <path d="m5 12.5 4.5 4.5L19 7.5" />
        </svg>
      </span>
    </span>
  );
}
