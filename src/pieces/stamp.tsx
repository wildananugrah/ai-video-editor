// Rubber stamp that slams in.
import React from 'react';
import {interpolate, useCurrentFrame} from 'remotion';
import {z} from 'zod';
import {useUnit} from '../context';
import {color, fonts} from '../theme';
import {Jitter, Placed, PieceProps, placement, useExit} from './common';

export const schema = z
	.object({
		text: z.string(), // "\n" for a second line
		color: z.string().optional(), // default red
		...placement,
	})
	.strict();

export const Component: React.FC<PieceProps<z.infer<typeof schema>>> = ({p, durationInFrames, startFrame}) => {
	const frame = useCurrentFrame();
	const u = useUnit() * (p.size ?? 1);
	const exit = useExit(durationInFrames);
	const c = color(p.color, 'red');
	const scale = interpolate(frame, [0, 4, 6], [2.4, 0.94, 1], {extrapolateRight: 'clamp'});
	return (
		<Placed position={p.position ?? 'center'} x={p.x} y={p.y}>
			<Jitter seed={`stamp-${startFrame}`} amount={0.4}>
				<div
					style={{
						transform: `rotate(${p.tilt ?? -12}deg) scale(${scale})`,
						opacity: interpolate(frame, [0, 3], [0, 0.92], {extrapolateRight: 'clamp'}) * exit,
						border: `${8 * u}px solid ${c}`,
						outline: `${3 * u}px solid ${c}`,
						outlineOffset: 6 * u,
						padding: `${8 * u}px ${28 * u}px`,
						color: c,
						fontFamily: fonts.title,
						fontWeight: 900,
						fontSize: 92 * u,
						lineHeight: 0.95,
						textAlign: 'center',
						textTransform: 'uppercase',
						letterSpacing: 4 * u,
						whiteSpace: 'pre-line',
						// Worn ink: punch random holes through the stamp.
						maskImage:
							'radial-gradient(circle at 20% 30%, transparent 2px, black 3px), radial-gradient(circle at 70% 60%, transparent 3px, black 4px)',
						maskSize: `${23 * u}px ${19 * u}px, ${31 * u}px ${27 * u}px`,
						maskComposite: 'intersect',
					}}
				>
					{p.text}
				</div>
			</Jitter>
		</Placed>
	);
};
