import { z } from 'zod';

/** Volitelný text z prohlížeče: oříznutý na n znaků, prázdno → null (UTM, zařízení, zdroj…) */
export const clipped = (n: number) => z.string().nullish().transform((v) => (v ? v.slice(0, n) : null));
