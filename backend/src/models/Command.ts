import { z } from 'zod';

export const IncomingCommandSchema = z.object({
  commandId: z.string().min(1).max(64),
  prompt: z.string().min(1).max(512),
});

export type IncomingCommand = z.infer<typeof IncomingCommandSchema>;
