import { Landing } from '@/components/landing/Landing';

/* Záloha – „/“ normálně přepisuje proxy.ts na /v/twin nebo /v/fees */
export default function HomePage() {
  return <Landing variant="twin" />;
}
