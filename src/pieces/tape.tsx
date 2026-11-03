// Small typewriter label on a scrap of tape.
import React from 'react';
import {z} from 'zod';
import {useUnit} from '../context';
import {colors, fonts} from '../theme';
import {Jitter, Placed, PieceProps, Tape, placement, useEnter, useExit} from './common';

export const schema = z.object({text: z.string(), ...placement}).strict();

export const Component: React.FC<PieceProps<z.infer<typeof schema>>> = ({p, durationInFrames, startFrame}) => {
	const u = useUnit() * (p.size ?? 1);
	const enter = useEnter();
	const exit = useExit(durationInFrames);
	return (
		<Placed position={p.position ?? 'top-left'} x={p.x} y={p.y}>
			<Jitter seed={`tape-${startFrame}`}>
				<div style={{transform: `scale(${enter})`, opacity: exit}}>
					<Tape tilt={p.tilt ?? -3} style={{padding: `${8 * u}px ${20 * u}px`}}>
						<span
							style={{
								fontFamily: fonts.label,
								fontWeight: 700,
								fontSize: 30 * u,
								letterSpacing: 2 * u,
								textTransform: 'uppercase',
								color: colors.ink,
								whiteSpace: 'nowrap',
							}}
						>
							{p.text}
						</span>
					</Tape>
				</div>
			</Jitter>
		</Placed>
	);
};
