import {z} from 'zod';

// A piece nested in a split panel or scene: shares the parent's timing,
// shifted by `delay` and optionally shortened to `duration` (seconds).
export const childSchema = z
	.object({type: z.string(), delay: z.number().min(0).optional(), duration: z.number().positive().optional()})
	.passthrough();

export type Child = z.infer<typeof childSchema>;
