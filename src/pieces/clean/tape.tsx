// Clean small label: a frosted pill with an accent dot.
import React from 'react';
import {z} from 'zod';
import {Placed, PieceProps} from '../common';
import {schema} from '../tape';
import {clean} from '../../themes-clean';
import {text, useClean, useReveal} from './kit';

export {schema};

export const Component: React.FC<PieceProps<z.infer<typeof schema>>> = ({p, durationInFrames}) => {
	const {u, accent} = useClean(p.size);
	const r = useReveal(durationInFrames, 0, 'left');
	return (
		<Placed position={p.position ?? 'top-left'} x={p.x} y={p.y}>
			<div
				style={{
					display: 'flex',
					alignItems: 'center',
					gap: 12 * u,
					background: clean.scrim(0.78),
					borderRadius: 999,
					padding: `${10 * u}px ${22 * u}px`,
					...text(u, 24, 600, clean.colors.surface),
					letterSpacing: 1.5 * u,
					textTransform: 'uppercase',
					opacity: r.opacity,
					transform: r.transform,
				}}
			>
				<span style={{width: 10 * u, height: 10 * u, borderRadius: '50%', background: accent}} />
				{p.text}
			</div>
		</Placed>
	);
};
