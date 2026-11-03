// Punch-in / slow push on the speaker footage. Drawn by <Speaker>; renders nothing itself.
import {z} from 'zod';

export const schema = z
	.object({
		scale: z.number().min(1).max(3).optional(), // default 1.25
		x: z.number().min(0).max(1).optional(), // zoom centre, default 0.5
		y: z.number().min(0).max(1).optional(), // default 0.4
		style: z.enum(['punch', 'push']).optional(), // punch = instant cut-in (default), push = slow push-in
	})
	.strict();

export const Component = () => null;
