// Clean annotation: short accent line + label.
import React from 'react';
import {Easing, interpolate, useCurrentFrame} from 'remotion';
import {z} from 'zod';
import {Placed, PieceProps} from '../common';
import {schema} from '../note';
import {textOn} from '../../themes-clean';
import {text, useClean, useReveal} from './kit';

export {schema};

export const Component: React.FC<PieceProps<z.infer<typeof schema>>> = ({p, durationInFrames}) => {
	const frame = useCurrentFrame();
	const {u, c} = useClean(p.size);
	const r = useReveal(durationInFrames, 4, 'left');
	const line = interpolate(frame, [0, 10], [0, 1], {extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)});
	const col = c(p.color, 'accent');
	return (
		<Placed position={p.position ?? 'bottom-right'} x={p.x} y={p.y}>
			<div style={{display: 'flex', alignItems: 'center', gap: 16 * u}}>
				<div style={{width: 60 * u * line, height: 4 * u, borderRadius: 2 * u, background: col}} />
				<div
					style={{
						...text(u, 34, 700, textOn(col)),
						background: col,
						borderRadius: 10 * u,
						padding: `${8 * u}px ${18 * u}px`,
						whiteSpace: 'pre-line',
						opacity: r.opacity,
						transform: r.transform,
					}}
				>
					{p.text}
				</div>
			</div>
		</Placed>
	);
};
