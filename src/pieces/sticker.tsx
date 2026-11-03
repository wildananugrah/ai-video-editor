// Black-and-white cut-out with a white sticker outline, on a yellow halftone block.
// The treatment is baked into the PNG by `npm run sticker` (CSS filters for it
// made renders ~5x slower), so src must be a *-sticker.png.
import React from 'react';
import {Img, staticFile} from 'remotion';
import {z} from 'zod';
import {useBox, useEdit, useStyleName, useUnit} from '../context';
import {Jitter, Placed, PieceProps, halftone, placement, useEnter, useExit} from './common';

export const schema = z
	.object({
		src: z.string(),
		width: z.number().positive().max(1).optional(), // fraction of the box, default 0.4
		block: z.boolean().optional(), // yellow halftone block behind (default true)
		...placement,
	})
	.strict();

export const Component: React.FC<PieceProps<z.infer<typeof schema>>> = ({p, durationInFrames, startFrame}) => {
	const {project} = useEdit();
	const box = useBox();
	const u = useUnit() * (p.size ?? 1);
	const enter = useEnter(0, 10);
	const exit = useExit(durationInFrames, 4);
	const w = (p.width ?? 0.4) * Math.min(box.width, box.height * 1.2);
	if (useStyleName() === 'clean') {
		return (
			<Placed position={p.position ?? 'right'} x={p.x} y={p.y}>
				<Img
					src={staticFile(`${project}/${p.src}`)}
					style={{
						width: w,
						display: 'block',
						borderRadius: 18 * u,
						transform: `scale(${0.9 + 0.1 * enter})`,
						opacity: Math.min(1, enter) * exit,
						filter: `drop-shadow(0 ${10 * u}px ${18 * u}px rgba(15,23,42,0.3))`,
					}}
				/>
			</Placed>
		);
	}
	return (
		<Placed position={p.position ?? 'right'} x={p.x} y={p.y}>
			<Jitter seed={`sticker-${startFrame}`}>
				<div
					style={{
						position: 'relative',
						width: w,
						transform: `rotate(${p.tilt ?? -4}deg) scale(${enter})`,
						opacity: exit,
					}}
				>
					{p.block !== false ? (
						<div
							style={{
								position: 'absolute',
								inset: '12% -6% -4% -6%',
								...halftone(u),
								transform: 'rotate(5deg)',
								boxShadow: `0 ${8 * u}px ${20 * u}px rgba(0,0,0,0.35)`,
							}}
						/>
					) : null}
					<Img
						src={staticFile(`${project}/${p.src}`)}
						style={{
							position: 'relative',
							width: '100%',
							display: 'block',
						}}
					/>
				</div>
			</Jitter>
		</Placed>
	);
};
