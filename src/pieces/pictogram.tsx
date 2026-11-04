// "1 dari 6": a row of people, with some turning red after a beat.
import React from 'react';
import {useCurrentFrame, useVideoConfig} from 'remotion';
import {z} from 'zod';
import {useStyleName, useUnit} from '../context';
import {colors, fonts} from '../theme';
import {clean} from '../themes-clean';
import {Jitter, Placed, PieceProps, placement, progress, useEnter, useExit} from './common';

export const schema = z
	.object({
		total: z.number().int().positive(),
		highlight: z.number().int().min(0), // how many turn red
		highlightDelay: z.number().min(0).optional(), // seconds before they turn, default 1
		label: z.string().optional(),
		...placement,
	})
	.strict();

const Person: React.FC<{size: number; fill: string}> = ({size, fill}) => (
	<svg width={size * 0.55} height={size} viewBox="0 0 55 100">
		<circle cx="27.5" cy="17" r="15" fill={fill} />
		<path d="M5 100 V54 C5 41 15 37 27.5 37 C40 37 50 41 50 54 V100 Z" fill={fill} />
	</svg>
);

export const Component: React.FC<PieceProps<z.infer<typeof schema>>> = ({p, durationInFrames, startFrame}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const isClean = useStyleName() === 'clean';
	const u = useUnit() * (p.size ?? 1);
	const enter = useEnter();
	const exit = useExit(durationInFrames, 8);
	const turn = progress(frame, (p.highlightDelay ?? 1) * fps, (p.highlightDelay ?? 1) * fps + 6);
	const base = isClean ? clean.colors.muted : colors.ink;
	const hot = isClean ? clean.colors.danger : colors.red;
	const body = (
		<div
			style={{
				display: 'flex',
				flexDirection: 'column',
				alignItems: 'center',
				gap: 20 * u,
				padding: `${28 * u}px ${36 * u}px`,
				background: isClean ? clean.colors.surface : colors.card,
				borderRadius: isClean ? clean.radius * u : 0,
				boxShadow: clean.shadow(u),
				opacity: Math.min(1, enter) * exit,
			}}
		>
			<div style={{display: 'flex', gap: 14 * u}}>
				{Array.from({length: p.total}, (_, i) => (
					<div key={i} style={{transform: i < p.highlight ? `scale(${1 + 0.12 * turn})` : undefined}}>
						<Person size={110 * u} fill={i < p.highlight && turn > 0.5 ? hot : base} />
					</div>
				))}
			</div>
			{p.label ? (
				<div style={{fontFamily: isClean ? clean.font : fonts.title, fontWeight: 800, fontSize: 42 * u, lineHeight: 1.15, color: isClean ? clean.colors.ink : colors.ink, textAlign: 'center', whiteSpace: 'pre-line', textTransform: isClean ? undefined : 'uppercase'}}>{p.label}</div>
			) : null}
		</div>
	);
	return (
		<Placed position={p.position ?? 'right'} x={p.x} y={p.y}>
			{isClean ? body : <Jitter seed={`pict-${startFrame}`}>{body}</Jitter>}
		</Placed>
	);
};
