import { z } from 'zod';

export const IncomingMessageSchema = z.object({
  user: z.object({
    name: z.string().min(2).max(32),
    color: z.string().optional(),
  }),
  content: z.string().min(1).max(256),
});

export type IncomingMessage = z.infer<typeof IncomingMessageSchema>;

export type OutgoingMessage = {
  user: { name: string; color: string };
  content: string;
  timestamp: string;
};
