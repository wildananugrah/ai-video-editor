// Clean info card: label, title, bullets with accent dots.
import React from 'react';
import {useCurrentFrame, useVideoConfig} from 'remotion';
import {z} from 'zod';
import {Placed, PieceProps} from '../common';
import {schema} from '../card';
import {surface, text, useClean, useReveal} from './kit';
import {clean, textOn} from '../../themes-clean';

export {schema};

export const Component: React.FC<PieceProps<z.infer<typeof schema>>> = ({p, durationInFrames}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const {u, c} = useClean(p.size);
	const pos = p.position ?? 'right';
	const r = useReveal(durationInFrames, 0, pos.includes('left') ? 'left' : 'right');
	const accent = c(p.accent, 'accent');
	// A light accent (yellow) can't be text on the light card: use it as a fill instead.
	const lightAccent = textOn(accent) === clean.colors.ink;
	return (
		<Placed position={pos} x={p.x} y={p.y}>
			<div style={{...surface(u), width: 540 * u, padding: `${30 * u}px ${34 * u}px`, opacity: r.opacity, transform: r.transform}}>
				{p.label ? (
					<div
						style={{
							...text(u, 22, 700, lightAccent ? clean.colors.ink : accent),
							background: lightAccent ? accent : undefined,
							display: 'inline-block',
							padding: lightAccent ? `${4 * u}px ${12 * u}px` : 0,
							borderRadius: 6 * u,
							textTransform: 'uppercase',
							letterSpacing: 2.5 * u,
							marginBottom: 10 * u,
						}}
					>
						{p.label}
					</div>
				) : null}
				{p.title ? <div style={{...text(u, 46, 800), lineHeight: 1.1, marginBottom: 12 * u}}>{p.title}</div> : null}
				{(p.bullets ?? []).map((b, i) => {
					const br = Math.min(1, Math.max(0, (frame - 8 - i * Math.round(fps * 0.3)) / 8));
					return (
						<div
							key={i}
							style={{
								display: 'flex',
								alignItems: 'center',
								gap: 16 * u,
								marginTop: 12 * u,
								opacity: br,
								transform: `translateX(${(1 - br) * 12}px)`,
								...text(u, 32, 500, clean.colors.ink),
								lineHeight: 1.3,
							}}
						>
							<span style={{width: 12 * u, height: 12 * u, borderRadius: '50%', background: lightAccent ? clean.colors.ink : accent, flexShrink: 0}} />
							<span>{b}</span>
						</div>
					);
				})}
			</div>
		</Placed>
	);
};
