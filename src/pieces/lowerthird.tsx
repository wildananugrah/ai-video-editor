// Name bar: name + role, bottom-left. Collage: ink strip + yellow tape. Clean: white bar with accent edge.
import React from 'react';
import {Easing, interpolate, useCurrentFrame} from 'remotion';
import {z} from 'zod';
import {useStyleName, useUnit} from '../context';
import {colors, fonts} from '../theme';
import {Jitter, Placed, PieceProps, Tape, placement, useEnter, useExit} from './common';
import {surface, text, useClean} from './clean/kit';
import {clean} from '../themes-clean';

export const schema = z.object({name: z.string(), role: z.string().optional(), ...placement}).strict();

const Clean: React.FC<PieceProps<z.infer<typeof schema>>> = ({p, durationInFrames}) => {
	const frame = useCurrentFrame();
	const {u, accent} = useClean(p.size);
	const wipe = interpolate(frame, [0, 14], [0, 1], {extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)});
	const exit = useExit(durationInFrames, 8);
	return (
		<Placed position={p.position ?? 'bottom-left'} x={p.x} y={p.y} keepSides>
			<div style={{display: 'flex', opacity: exit, clipPath: `inset(0 ${(1 - wipe) * 100}% 0 0)`}}>
				<div style={{width: 10 * u, background: accent, borderRadius: `${8 * u}px 0 0 ${8 * u}px`}} />
				<div style={{...surface(u), borderRadius: `0 ${12 * u}px ${12 * u}px 0`, padding: `${16 * u}px ${30 * u}px`}}>
					<div style={{...text(u, 40, 800), lineHeight: 1.1}}>{p.name}</div>
					{p.role ? <div style={{...text(u, 26, 500, clean.colors.muted), marginTop: 4 * u}}>{p.role}</div> : null}
				</div>
			</div>
		</Placed>
	);
};

const Collage: React.FC<PieceProps<z.infer<typeof schema>>> = ({p, durationInFrames, startFrame}) => {
	const u = useUnit() * (p.size ?? 1);
	const enter = useEnter();
	const exit = useExit(durationInFrames);
	return (
		<Placed position={p.position ?? 'bottom-left'} x={p.x} y={p.y} keepSides>
			<Jitter seed={`lt-${startFrame}`}>
				<div style={{transform: `rotate(${p.tilt ?? -2}deg) translateX(${(1 - enter) * -80 * u}px)`, opacity: exit}}>
					<div
						style={{
							background: colors.ink,
							padding: `${6 * u}px ${24 * u}px ${10 * u}px`,
							fontFamily: fonts.title,
							fontWeight: 900,
							fontSize: 64 * u,
							textTransform: 'uppercase',
							color: colors.paper,
							lineHeight: 1,
						}}
					>
						{p.name}
					</div>
					{p.role ? (
						<Tape tilt={2} style={{display: 'inline-block', marginTop: -6 * u, marginLeft: 20 * u, padding: `${6 * u}px ${16 * u}px`}}>
							<span style={{fontFamily: fonts.label, fontWeight: 700, fontSize: 26 * u, color: colors.ink, textTransform: 'uppercase'}}>{p.role}</span>
						</Tape>
					) : null}
				</div>
			</Jitter>
		</Placed>
	);
};

export const Component: React.FC<PieceProps<z.infer<typeof schema>>> = (props) =>
	useStyleName() === 'clean' ? <Clean {...props} /> : <Collage {...props} />;
