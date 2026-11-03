// Paper card taped to the frame: small label, optional title, bullet lines.
import React from 'react';
import {useCurrentFrame, useVideoConfig} from 'remotion';
import {z} from 'zod';
import {useUnit} from '../context';
import {color, colors, fonts} from '../theme';
import {Jitter, Placed, PieceProps, Tape, paperStyle, placement, useEnter, useExit} from './common';

export const schema = z
	.object({
		label: z.string().optional(),
		title: z.string().optional(),
		bullets: z.array(z.string()).optional(),
		accent: z.string().optional(), // label colour, default red
		...placement,
	})
	.strict();

export const Component: React.FC<PieceProps<z.infer<typeof schema>>> = ({p, durationInFrames, startFrame}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const u = useUnit() * (p.size ?? 1);
	const enter = useEnter();
	const exit = useExit(durationInFrames);
	const w = 520 * u;
	return (
		<Placed position={p.position ?? 'right'} x={p.x} y={p.y}>
			<Jitter seed={`card-${startFrame}`}>
				<div
					style={{
						position: 'relative',
						width: w,
						padding: `${34 * u}px ${30 * u}px ${28 * u}px`,
						...paperStyle(colors.card),
						boxShadow: `0 ${10 * u}px ${24 * u}px rgba(0,0,0,0.35)`,
						transform: `rotate(${p.tilt ?? 2}deg) translateY(${(1 - enter) * 60 * u}px) scale(${0.9 + 0.1 * enter})`,
						opacity: enter * exit,
					}}
				>
					<Tape width={150 * u} tilt={-6} style={{position: 'absolute', top: -18 * u, left: w / 2 - 75 * u}} />
					{p.label ? (
						<div
							style={{
								fontFamily: fonts.label,
								fontWeight: 700,
								fontSize: 26 * u,
								letterSpacing: 2 * u,
								textTransform: 'uppercase',
								color: color(p.accent, 'red'),
								marginBottom: 10 * u,
							}}
						>
							{p.label}
						</div>
					) : null}
					{p.title ? (
						<div
							style={{
								fontFamily: fonts.title,
								fontWeight: 900,
								fontSize: 64 * u,
								lineHeight: 0.95,
								textTransform: 'uppercase',
								color: colors.ink,
								marginBottom: 12 * u,
							}}
						>
							{p.title}
						</div>
					) : null}
					{(p.bullets ?? []).map((b, i) => {
						const at = 6 + i * Math.round(fps * 0.35);
						return (
							<div
								key={i}
								style={{
									display: 'flex',
									gap: 14 * u,
									fontFamily: fonts.caption,
									fontWeight: 600,
									fontSize: 34 * u,
									lineHeight: 1.25,
									color: colors.ink,
									marginTop: 8 * u,
									opacity: frame >= at ? 1 : 0,
								}}
							>
								<span style={{color: colors.red}}>■</span>
								<span>{b}</span>
							</div>
						);
					})}
				</div>
			</Jitter>
		</Placed>
	);
};
