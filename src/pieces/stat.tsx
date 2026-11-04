// Big number that counts up, with a label underneath. Stack several in a split panel.
import React from 'react';
import {Easing, interpolate, useCurrentFrame} from 'remotion';
import {z} from 'zod';
import {useStyleName, useUnit} from '../context';
import {color, colors, fonts} from '../theme';
import {clean, textOn} from '../themes-clean';
import {Jitter, Placed, PieceProps, placement, useEnter, useExit} from './common';
import {useClean} from './clean/kit';

export const schema = z
	.object({
		value: z.number(),
		countFrom: z.number().optional(), // count-up start, default 0
		decimals: z.number().int().min(0).max(3).optional(),
		prefix: z.string().optional(), // "+", "Rp"
		suffix: z.string().optional(), // "%", "+"
		label: z.string().optional(),
		color: z.string().optional(), // number colour
		...placement,
	})
	.strict();

// Indonesian number format: 16.000 and 8,5.
const format = (n: number, decimals: number) => n.toLocaleString('id-ID', {minimumFractionDigits: decimals, maximumFractionDigits: decimals});

export const Component: React.FC<PieceProps<z.infer<typeof schema>>> = ({p, durationInFrames, startFrame}) => {
	const frame = useCurrentFrame();
	const isClean = useStyleName() === 'clean';
	const cl = useClean(p.size);
	const u = useUnit() * (p.size ?? 1);
	const enter = useEnter();
	const exit = useExit(durationInFrames, 8);
	const t = interpolate(frame, [0, 20], [0, 1], {extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)});
	const n = format((p.countFrom ?? 0) + (p.value - (p.countFrom ?? 0)) * t, p.decimals ?? 0);
	const number = `${p.prefix ?? ''}${n}${p.suffix ?? ''}`;
	if (isClean) {
		const bg = cl.c(p.color, 'accent');
		return (
			<Placed position={p.position ?? 'right'} x={p.x} y={p.y}>
				<div
					style={{
						background: clean.scrim(0.88),
						borderRadius: clean.radius * u,
						boxShadow: clean.shadow(u),
						padding: `${22 * u}px ${36 * u}px ${26 * u}px`,
						opacity: Math.min(1, enter) * exit,
						transform: `translateY(${(1 - Math.min(1, enter)) * 24 * u}px)`,
					}}
				>
					<div style={{fontFamily: clean.font, fontWeight: 800, fontSize: 118 * u, lineHeight: 1.05, letterSpacing: -2 * u, color: bg, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap'}}>
						{number}
					</div>
					{p.label ? (
						<div style={{fontFamily: clean.font, fontWeight: 600, fontSize: 32 * u, lineHeight: 1.25, color: clean.colors.surface, marginTop: 6 * u, maxWidth: 560 * u, whiteSpace: 'pre-line'}}>{p.label}</div>
					) : null}
				</div>
			</Placed>
		);
	}
	return (
		<Placed position={p.position ?? 'right'} x={p.x} y={p.y}>
			<Jitter seed={`stat-${startFrame}`}>
				<div style={{transform: `rotate(${p.tilt ?? -2}deg) scale(${0.85 + 0.15 * enter})`, opacity: exit}}>
					<div style={{display: 'inline-block', background: colors.ink, padding: `${4 * u}px ${24 * u}px`, fontFamily: fonts.title, fontWeight: 900, fontSize: 140 * u, lineHeight: 1, color: color(p.color, 'yellow'), whiteSpace: 'nowrap'}}>
						{number}
					</div>
					{p.label ? (
						<div style={{background: colors.yellow, color: textOn(colors.yellow), padding: `${4 * u}px ${18 * u}px`, fontFamily: fonts.title, fontWeight: 800, fontSize: 44 * u, textTransform: 'uppercase', whiteSpace: 'pre-line', maxWidth: 620 * u}}>{p.label}</div>
					) : null}
				</div>
			</Jitter>
		</Placed>
	);
};
