// Clean scale: rounded track, accent fill up to the marker, end labels.
import React from 'react';
import {Easing, interpolate, useCurrentFrame} from 'remotion';
import {z} from 'zod';
import {useBox} from '../../context';
import {clean} from '../../themes-clean';
import {Placed, PieceProps} from '../common';
import {schema} from '../spectrum';
import {surface, text, useClean, useReveal} from './kit';

export {schema};

export const Component: React.FC<PieceProps<z.infer<typeof schema>>> = ({p, durationInFrames}) => {
	const frame = useCurrentFrame();
	const box = useBox();
	const {u, accent} = useClean(p.size);
	const r = useReveal(durationInFrames, 0, 'up');
	const width = (box.width - box.pad.left - box.pad.right) * (box.vertical ? 0.95 : 0.7);
	const m =
		p.marker === undefined
			? undefined
			: interpolate(frame, [8, Math.max(9, durationInFrames - 8)], [p.marker, p.markerTo ?? p.marker], {
					extrapolateLeft: 'clamp',
					extrapolateRight: 'clamp',
					easing: Easing.inOut(Easing.cubic),
				});
	return (
		<Placed position={p.position ?? 'top'} x={p.x} y={p.y}>
			<div style={{...surface(u), width, padding: `${20 * u}px ${28 * u}px`, opacity: r.opacity, transform: r.transform}}>
				{p.center ? (
					<div style={{...text(u, 22, 700, clean.colors.muted), textAlign: 'center', textTransform: 'uppercase', letterSpacing: 2 * u, marginBottom: 14 * u}}>
						{p.center}
					</div>
				) : null}
				<div style={{position: 'relative', height: 10 * u, borderRadius: 5 * u, background: clean.colors.line}}>
					{m !== undefined ? (
						<>
							<div style={{position: 'absolute', left: 0, top: 0, bottom: 0, width: `${m * 100}%`, borderRadius: 5 * u, background: accent}} />
							<div
								style={{
									position: 'absolute',
									left: `calc(${m * 100}% - ${13 * u}px)`,
									top: -8 * u,
									width: 26 * u,
									height: 26 * u,
									borderRadius: '50%',
									background: clean.colors.ink,
									border: `${5 * u}px solid ${accent}`,
									boxSizing: 'border-box',
								}}
							/>
						</>
					) : null}
				</div>
				<div style={{display: 'flex', justifyContent: 'space-between', marginTop: 16 * u}}>
					<span style={text(u, 26, 600)}>{p.left}</span>
					<span style={text(u, 26, 600)}>{p.right}</span>
				</div>
			</div>
		</Placed>
	);
};
