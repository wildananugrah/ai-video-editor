// Fade the whole frame to (or from) a colour over the entry.
import React from 'react';
import {interpolate, useCurrentFrame} from 'remotion';
import {z} from 'zod';
import {color} from '../theme';
import {PieceProps} from './common';

export const schema = z.object({direction: z.enum(['in', 'out']).optional(), color: z.string().optional()}).strict();

export const Component: React.FC<PieceProps<z.infer<typeof schema>>> = ({p, durationInFrames}) => {
	const frame = useCurrentFrame();
	const t = interpolate(frame, [0, durationInFrames - 1], [0, 1], {extrapolateRight: 'clamp'});
	const opacity = (p.direction ?? 'out') === 'out' ? t : 1 - t;
	return <div style={{position: 'absolute', inset: 0, background: color(p.color, 'ink'), opacity}} />;
};
