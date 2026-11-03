// Clean "stamp": a solid accent pill that pops in.
import React from 'react';
import {spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {z} from 'zod';
import {Placed, PieceProps} from '../common';
import {schema} from '../stamp';
import {textOn} from '../../themes-clean';
import {text, useClean, useReveal} from './kit';

export {schema};

export const Component: React.FC<PieceProps<z.infer<typeof schema>>> = ({p, durationInFrames}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const {u, c} = useClean(p.size);
	const {opacity} = useReveal(durationInFrames, 0, 'none');
	const s = spring({frame, fps, config: {damping: 13, mass: 0.5}});
	const bg = c(p.color, 'accent');
	return (
		<Placed position={p.position ?? 'center'} x={p.x} y={p.y}>
			<div
				style={{
					...text(u, 54, 800, textOn(bg)),
					background: bg,
					borderRadius: 999,
					padding: `${16 * u}px ${40 * u}px`,
					textAlign: 'center',
					whiteSpace: 'pre-line',
					lineHeight: 1.1,
					boxShadow: `0 ${10 * u}px ${30 * u}px rgba(20,20,20,0.3)`,
					transform: `scale(${0.6 + 0.4 * s})`,
					opacity,
				}}
			>
				{p.text}
			</div>
		</Placed>
	);
};
