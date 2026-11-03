// Clean captions: white text on a dark rounded box, current word in accent.
import React from 'react';
import {useCurrentFrame, useVideoConfig} from 'remotion';
import {z} from 'zod';
import {useEdit} from '../../context';
import {Placed, PieceProps} from '../common';
import {schema} from '../caption';
import {clean} from '../../themes-clean';
import {text, useClean} from './kit';

export {schema};

export const Component: React.FC<PieceProps<z.infer<typeof schema>>> = ({p, durationInFrames, startFrame}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const {words} = useEdit();
	const {u, accent} = useClean(p.size);
	const t0 = startFrame / fps;
	const t1 = (startFrame + durationInFrames) / fps;
	const now = (startFrame + frame) / fps;
	const mine = words.filter((w) => w.start >= t0 - 0.05 && w.start < t1);
	const n = p.wordsPerLine ?? 5;
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
					gap: `${4 * u}px ${12 * u}px`,
					maxWidth: 1000 * u,
					padding: boxed ? `${12 * u}px ${24 * u}px` : 0,
					background: boxed ? clean.scrim(0.8) : undefined,
					borderRadius: 14 * u,
				}}
			>
				{chunk.map((w, i) => {
					const active = now >= w.start && now < w.end + 0.05;
					return (
						<span
							key={i}
							style={{
								...text(u, 46, 700, active ? accent : clean.colors.surface),
								lineHeight: 1.25,
								textShadow: boxed ? undefined : '0 2px 10px rgba(0,0,0,0.7)',
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
