// Handwritten note that writes on left to right.
import React from 'react';
import {useCurrentFrame} from 'remotion';
import {z} from 'zod';
import {useUnit} from '../context';
import {color, fonts} from '../theme';
import {Jitter, Placed, PieceProps, placement, progress, useExit} from './common';

export const schema = z.object({text: z.string(), color: z.string().optional(), ...placement}).strict();

export const Component: React.FC<PieceProps<z.infer<typeof schema>>> = ({p, durationInFrames, startFrame}) => {
	const frame = useCurrentFrame();
	const u = useUnit() * (p.size ?? 1);
	const exit = useExit(durationInFrames);
	const write = progress(frame, 0, Math.min(durationInFrames * 0.5, 4 + p.text.length * 1.2));
	return (
		<Placed position={p.position ?? 'bottom-right'} x={p.x} y={p.y}>
			<Jitter seed={`note-${startFrame}`}>
				<div
					style={{
						fontFamily: fonts.hand,
						fontSize: 84 * u,
						lineHeight: 1,
						color: color(p.color, 'red'),
						transform: `rotate(${p.tilt ?? -6}deg)`,
						clipPath: `inset(-20% ${(1 - write) * 100}% -20% -5%)`,
						whiteSpace: 'pre-line',
						opacity: exit,
						textShadow: '0 2px 6px rgba(0,0,0,0.25)',
					}}
				>
					{p.text}
				</div>
			</Jitter>
		</Placed>
	);
};
