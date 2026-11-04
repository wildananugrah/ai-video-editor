// Numbered step tracker that stays on screen; steps light up at their times.
import React from 'react';
import {useCurrentFrame, useVideoConfig} from 'remotion';
import {z} from 'zod';
import {useStyleName, useUnit} from '../context';
import {parseTime} from '../lib/time';
import {colors, fonts} from '../theme';
import {clean} from '../themes-clean';
import {Placed, PieceProps, placement, useEnter, useExit} from './common';

export const schema = z
	.object({
		// `at` = seconds after the entry starts that this step becomes current.
		steps: z.array(z.object({text: z.string(), at: z.union([z.number(), z.string()])}).strict()).min(1),
		...placement,
	})
	.strict();

export const Component: React.FC<PieceProps<z.infer<typeof schema>>> = ({p, durationInFrames}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const isClean = useStyleName() === 'clean';
	const u = useUnit() * (p.size ?? 1);
	const enter = useEnter();
	const exit = useExit(durationInFrames, 8);
	const t = frame / fps;
	const current = p.steps.reduce((acc, s, i) => (t >= parseTime(s.at) ? i : acc), -1);
	const accent = isClean ? clean.colors.accent : colors.yellow;
	const ink = isClean ? clean.colors.ink : colors.ink;
	const surface = isClean ? clean.colors.surface : colors.card;
	const font = isClean ? clean.font : fonts.title;
	return (
		<Placed position={p.position ?? 'left'} x={p.x} y={p.y} keepSides>
			<div
				style={{
					display: 'flex',
					flexDirection: 'column',
					gap: 12 * u,
					width: 450 * u,
					padding: 18 * u,
					background: surface,
					borderRadius: isClean ? clean.radius * u : 0,
					boxShadow: clean.shadow(u),
					opacity: Math.min(1, enter) * exit,
					transform: `translateX(${(1 - Math.min(1, enter)) * -30 * u}px)`,
				}}
			>
				{p.steps.map((s, i) => {
					const on = i === current;
					const done = i < current;
					return (
						<div
							key={i}
							style={{
								display: 'flex',
								alignItems: 'center',
								gap: 16 * u,
								padding: `${12 * u}px ${14 * u}px`,
								borderRadius: isClean ? 12 * u : 0,
								background: on ? accent : 'transparent',
								opacity: on || done ? 1 : 0.45,
							}}
						>
							<div
								style={{
									flexShrink: 0,
									width: 46 * u,
									height: 46 * u,
									borderRadius: '50%',
									background: ink,
									color: surface,
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'center',
									fontFamily: font,
									fontWeight: 800,
									fontSize: 26 * u,
								}}
							>
								{done ? '✓' : i + 1}
							</div>
							<div style={{fontFamily: font, fontWeight: on ? 800 : 600, fontSize: 30 * u, lineHeight: 1.15, color: ink, textTransform: isClean ? undefined : 'uppercase'}}>{s.text}</div>
						</div>
					);
				})}
			</div>
		</Placed>
	);
};
