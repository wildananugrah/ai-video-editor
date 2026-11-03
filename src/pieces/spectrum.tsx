// Tape-strip scale with end labels, a centre label and a marker that can slide.
import React from 'react';
import {Easing, interpolate, useCurrentFrame} from 'remotion';
import {z} from 'zod';
import {useBox, useUnit} from '../context';
import {colors, fonts} from '../theme';
import {Jitter, Placed, PieceProps, Tape, placement, useEnter, useExit} from './common';

export const schema = z
	.object({
		left: z.string(),
		right: z.string(),
		center: z.string().optional(),
		marker: z.number().min(0).max(1).optional(), // where the marker sits (0 = left)
		markerTo: z.number().min(0).max(1).optional(), // slide the marker here over the entry
		...placement,
	})
	.strict();

export const Component: React.FC<PieceProps<z.infer<typeof schema>>> = ({p, durationInFrames, startFrame}) => {
	const frame = useCurrentFrame();
	const box = useBox();
	const u = useUnit() * (p.size ?? 1);
	const enter = useEnter();
	const exit = useExit(durationInFrames);
	const width = (box.width - box.pad.left - box.pad.right) * (box.vertical ? 0.95 : 0.8);
	const from = p.marker;
	const markerPos =
		from === undefined
			? undefined
			: interpolate(frame, [8, Math.max(9, durationInFrames - 8)], [from, p.markerTo ?? from], {
					extrapolateLeft: 'clamp',
					extrapolateRight: 'clamp',
					easing: Easing.inOut(Easing.cubic),
				});
	const label: React.CSSProperties = {
		fontFamily: fonts.label,
		fontWeight: 700,
		fontSize: (box.vertical ? 28 : 30) * u,
		letterSpacing: 3 * u,
		textTransform: 'uppercase',
		color: colors.yellow,
		textShadow: '0 2px 4px rgba(0,0,0,0.7)',
	};
	return (
		<Placed position={p.position ?? 'top'} x={p.x} y={p.y}>
			<Jitter seed={`spec-${startFrame}`} amount={0.5} style={{opacity: exit}}>
				<div style={{width, position: 'relative', paddingTop: 30 * u}}>
					<div
						style={{
							height: 6 * u,
							background: colors.paper,
							width: `${enter * 100}%`,
							boxShadow: '0 2px 6px rgba(0,0,0,0.5)',
						}}
					/>
					{[0, 0.25, 0.5, 0.75, 1].map((t) => (
						<div
							key={t}
							style={{
								position: 'absolute',
								left: `calc(${t * 100}% - ${(t === 0 || t === 1 ? 7 : 2) * u}px)`,
								top: (t === 0 || t === 1 ? 14 : 24) * u,
								width: (t === 0 || t === 1 ? 14 : 4) * u,
								height: (t === 0 || t === 1 ? 38 : 18) * u,
								background: t === 0 || t === 1 ? colors.paper : colors.red,
								opacity: enter >= t ? 1 : 0,
							}}
						/>
					))}
					{p.center ? (
						<div style={{position: 'absolute', left: '50%', top: 6 * u, transform: 'translateX(-50%)'}}>
							<Tape width={260 * u} tilt={-2} style={{textAlign: 'center'}}>
								<span style={{...label, color: colors.ink, textShadow: 'none', fontSize: 28 * u}}>{p.center}</span>
							</Tape>
						</div>
					) : null}
					{markerPos !== undefined ? (
						<div
							style={{
								position: 'absolute',
								left: `calc(${markerPos * 100}% - ${14 * u}px)`,
								top: 18 * u,
								width: 28 * u,
								height: 28 * u,
								borderRadius: '50%',
								background: colors.yellow,
								border: `${4 * u}px solid ${colors.ink}`,
								opacity: enter,
							}}
						/>
					) : null}
					<div style={{display: 'flex', justifyContent: 'space-between', marginTop: 34 * u, opacity: enter}}>
						<span style={label}>← {p.left}</span>
						<span style={label}>{p.right} →</span>
					</div>
				</div>
			</Jitter>
		</Placed>
	);
};
