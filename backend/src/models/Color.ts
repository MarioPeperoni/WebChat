import { z } from 'zod';

export const ColorBodySchema = z.object({
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'color must be #RRGGBB'),
});

export type ColorBody = z.infer<typeof ColorBodySchema>;
