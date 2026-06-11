import { z } from 'zod';

export const IncomingMessageSchema = z.object({
  content: z.string().min(1).max(256),
});

export type IncomingMessage = z.infer<typeof IncomingMessageSchema>;
