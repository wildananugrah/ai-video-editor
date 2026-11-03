// Round badge cropped live from the speaker's footage.
import React from 'react';
import {z} from 'zod';
import {useStyleName, useUnit} from '../context';
import {FootageSegments} from '../Footage';
import {color} from '../theme';
import {Jitter, Placed, PieceProps, placement, useEnter, useExit} from './common';
import {Sequence} from 'remotion';

export const schema = z
	.object({
		diameter: z.number().positive().optional(), // fraction of the short side, default 0.26
		focusX: z.number().min(0).max(1).optional(), // where the face is in the frame, default 0.5
		focusY: z.number().min(0).max(1).optional(), // default 0.35
		zoom: z.number().positive().optional(), // default 1.8
		ring: z.string().optional(), // ring colour, default yellow
		...placement,
	})
	.strict();

export const Badge: React.FC<{p: z.infer<typeof schema>; startFrame: number; durationInFrames: number}> = ({
	p,
	startFrame,
	durationInFrames,
}) => {
	const u = useUnit() * (p.size ?? 1);
	const enter = useEnter();
	const exit = useExit(durationInFrames);
	const d = (p.diameter ?? 0.26) * 1080 * u;
	const fx = (p.focusX ?? 0.5) * 100;
	const fy = (p.focusY ?? 0.35) * 100;
	const isClean = useStyleName() === 'clean';
	return (
		<Placed position={p.position ?? 'bottom-left'} x={p.x} y={p.y} keepSides>
			<Jitter seed={`badge-${startFrame}`} amount={0.6}>
				<div
					style={{
						width: d,
						height: d,
						borderRadius: '50%',
						overflow: 'hidden',
						border: isClean ? `${8 * u}px solid ${color(p.ring, 'white')}` : `${10 * u}px solid ${color(p.ring, 'yellow')}`,
						outline: isClean ? undefined : `${4 * u}px solid white`,
						boxShadow: `0 ${8 * u}px ${22 * u}px rgba(0,0,0,0.45)`,
						transform: `scale(${enter}) rotate(${p.tilt ?? 0}deg)`,
						opacity: exit,
						position: 'relative',
					}}
				>
					<div style={{position: 'absolute', inset: 0, transform: `scale(${p.zoom ?? 1.8})`, transformOrigin: `${fx}% ${fy}%`}}>
						{/* Footage is laid out in edited time, so undo this entry's offset. */}
						<Sequence from={-startFrame} layout="none">
							<FootageSegments muted objectPosition={`${fx}% ${fy}%`} style={isClean ? undefined : {filter: 'grayscale(1) contrast(1.3)'}} />
						</Sequence>
					</div>
				</div>
			</Jitter>
		</Placed>
	);
};

export const Component: React.FC<PieceProps<z.infer<typeof schema>>> = ({p, durationInFrames, startFrame}) => (
	<Badge p={p} startFrame={startFrame} durationInFrames={durationInFrames} />
);
