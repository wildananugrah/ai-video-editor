// Italic quote on a card with a big red quotation mark.
import React from 'react';
import {useCurrentFrame} from 'remotion';
import {z} from 'zod';
import {useUnit} from '../context';
import {colors, fonts} from '../theme';
import {Jitter, Placed, PieceProps, paperStyle, placement, progress, useEnter, useExit} from './common';

export const schema = z.object({text: z.string(), author: z.string().optional(), ...placement}).strict();

export const Component: React.FC<PieceProps<z.infer<typeof schema>>> = ({p, durationInFrames, startFrame}) => {
	const frame = useCurrentFrame();
	const u = useUnit() * (p.size ?? 1);
	const enter = useEnter();
	const exit = useExit(durationInFrames);
	const chars = Math.round(progress(frame, 4, 4 + p.text.length * 0.6) * p.text.length);
	return (
		<Placed position={p.position ?? 'center'} x={p.x} y={p.y}>
			<Jitter seed={`quote-${startFrame}`}>
				<div
					style={{
						position: 'relative',
						maxWidth: 820 * u,
						padding: `${46 * u}px ${48 * u}px ${36 * u}px`,
						...paperStyle(colors.card),
						boxShadow: `0 ${10 * u}px ${24 * u}px rgba(0,0,0,0.35)`,
						transform: `rotate(${p.tilt ?? -1.5}deg) scale(${0.92 + 0.08 * enter})`,
						opacity: enter * exit,
					}}
				>
					<div
						style={{
							position: 'absolute',
							top: -40 * u,
							left: 20 * u,
							fontFamily: fonts.quote,
							fontStyle: 'italic',
							fontWeight: 600,
							fontSize: 180 * u,
							lineHeight: 1,
							color: colors.red,
						}}
					>
						“
					</div>
					<div
						style={{
							fontFamily: fonts.quote,
							fontStyle: 'italic',
							fontSize: 56 * u,
							lineHeight: 1.2,
							color: colors.ink,
						}}
					>
						{p.text.slice(0, chars)}
						<span style={{opacity: 0}}>{p.text.slice(chars)}</span>
					</div>
					{p.author ? (
						<div
							style={{
								marginTop: 18 * u,
								fontFamily: fonts.label,
								fontSize: 26 * u,
								letterSpacing: 2 * u,
								textTransform: 'uppercase',
								color: colors.ink,
							}}
						>
							— {p.author}
						</div>
					) : null}
				</div>
			</Jitter>
		</Placed>
	);
};
