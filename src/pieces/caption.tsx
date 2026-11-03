// Spoken words as captions, a few at a time, current word highlighted.
import React from 'react';
import {useCurrentFrame, useVideoConfig} from 'remotion';
import {z} from 'zod';
import {useEdit, useUnit} from '../context';
import {colors, fonts} from '../theme';
import {Placed, PieceProps, placement} from './common';

export const schema = z
	.object({
		wordsPerLine: z.number().int().positive().optional(), // default 4
		style: z.enum(['box', 'plain']).optional(),
		...placement,
	})
	.strict();

export const Component: React.FC<PieceProps<z.infer<typeof schema>>> = ({p, durationInFrames, startFrame}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const {words} = useEdit();
	const u = useUnit() * (p.size ?? 1);
	const t0 = startFrame / fps;
	const t1 = (startFrame + durationInFrames) / fps;
	const now = (startFrame + frame) / fps;
	const mine = words.filter((w) => w.start >= t0 - 0.05 && w.start < t1);
	const n = p.wordsPerLine ?? 4;
	const chunks: (typeof mine)[] = [];
	for (let i = 0; i < mine.length; i += n) chunks.push(mine.slice(i, i + n));
	const chunk = chunks.findLast((c) => c[0].start <= now) ?? chunks[0];
	if (!chunk) return null;
	const boxed = (p.style ?? 'box') === 'box';
	return (
		<Placed position={p.position ?? 'bottom'} x={p.x} y={p.y} keepSides>
			<div
				style={{
					display: 'flex',
					flexWrap: 'wrap',
					justifyContent: 'center',
					gap: `${6 * u}px ${12 * u}px`,
					maxWidth: 900 * u,
					padding: boxed ? `${10 * u}px ${18 * u}px` : 0,
					background: boxed ? colors.ink : undefined,
				}}
			>
				{chunk.map((w, i) => {
					const active = now >= w.start && now < w.end + 0.05;
					return (
						<span
							key={i}
							style={{
								fontFamily: fonts.caption,
								fontWeight: 600,
								fontSize: 52 * u,
								lineHeight: 1.15,
								color: active ? colors.ink : colors.paper,
								background: active ? colors.yellow : undefined,
								padding: `0 ${6 * u}px`,
								textShadow: boxed ? undefined : '0 2px 8px rgba(0,0,0,0.8)',
							}}
						>
							{w.text}
						</span>
					);
				})}
			</div>
		</Placed>
	);
};
