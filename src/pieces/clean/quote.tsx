// Clean quote card.
import React from 'react';
import {z} from 'zod';
import {clean} from '../../themes-clean';
import {Placed, PieceProps} from '../common';
import {schema} from '../quote';
import {surface, text, useClean, useReveal} from './kit';

export {schema};

export const Component: React.FC<PieceProps<z.infer<typeof schema>>> = ({p, durationInFrames}) => {
	const {u, accent} = useClean(p.size);
	const r = useReveal(durationInFrames);
	return (
		<Placed position={p.position ?? 'center'} x={p.x} y={p.y}>
			<div style={{...surface(u), maxWidth: 820 * u, padding: `${40 * u}px ${46 * u}px`, borderLeft: `${8 * u}px solid ${accent}`, opacity: r.opacity, transform: r.transform}}>
				<div style={{...text(u, 48, 500), fontStyle: 'italic', lineHeight: 1.3}}>“{p.text}”</div>
				{p.author ? <div style={{...text(u, 24, 600, clean.colors.muted), marginTop: 18 * u}}>{p.author}</div> : null}
			</div>
		</Placed>
	);
};
