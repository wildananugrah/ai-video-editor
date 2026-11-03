// Red marker stroke that draws itself over an area of the frame.
import React from 'react';
import {Easing, interpolate, useCurrentFrame} from 'remotion';
import {z} from 'zod';
import {useBox, useEdit, useStyleName, useUnit} from '../context';
import {clean, cleanColor} from '../themes-clean';
import {color} from '../theme';
import {Jitter, PieceProps, useExit} from './common';

const shapes = {
	circle: 'M 14 58 C 4 24, 58 2, 88 22 C 103 34, 97 80, 58 93 C 28 102, 1 80, 8 46 C 12 28, 32 12, 54 11',
	underline: 'M 2 72 C 30 60, 70 78, 98 62',
	scribble: 'M 5 50 L 18 28 L 28 72 L 42 26 L 53 74 L 67 28 L 78 72 L 95 36',
	arrow: 'M 6 88 C 30 74, 62 52, 92 12 M 92 12 L 70 15 M 92 12 L 89 35',
	cross: 'M 10 10 L 90 88 M 88 12 L 12 90',
	box: 'M 4 8 L 95 5 L 97 92 L 3 95 Z',
};

export const schema = z
	.object({
		shape: z.enum(Object.keys(shapes) as [keyof typeof shapes, ...(keyof typeof shapes)[]]),
		// Area as fractions of the box: centre x/y, width/height.
		x: z.number().min(0).max(1),
		y: z.number().min(0).max(1),
		w: z.number().positive(),
		h: z.number().positive(),
		color: z.string().optional(),
		stroke: z.number().positive().optional(), // px at 1080, default 12
	})
	.strict();

export const Component: React.FC<PieceProps<z.infer<typeof schema>>> = ({p, durationInFrames, startFrame}) => {
	const frame = useCurrentFrame();
	const box = useBox();
	const u = useUnit();
	const exit = useExit(durationInFrames);
	const draw = interpolate(frame, [0, 12], [0, 1], {extrapolateRight: 'clamp', easing: Easing.out(Easing.quad)});
	const {edit} = useEdit();
	const isClean = useStyleName() === 'clean';
	const stroke = isClean ? cleanColor(p.color, 'danger', edit.accent ?? clean.colors.accent) : color(p.color, 'red');
	const d = isClean && p.shape === 'circle' ? 'M 50 4 A 46 46 0 1 1 49.9 4' : shapes[p.shape];
	const w = p.w * box.width;
	const h = p.h * box.height;
	return (
		<div style={{position: 'absolute', left: p.x * box.width - w / 2, top: p.y * box.height - h / 2, opacity: exit}}>
			<Jitter seed={`marker-${startFrame}`} amount={0.5}>
				<svg width={w} height={h} viewBox="0 0 100 100" preserveAspectRatio="none" style={{overflow: 'visible'}}>
					<path
						d={d}
						fill="none"
						stroke={stroke}
						strokeWidth={(p.stroke ?? (isClean ? 8 : 12)) * u}
						strokeLinecap="round"
						strokeLinejoin="round"
						vectorEffect="non-scaling-stroke"
						pathLength={1}
						strokeDasharray={1}
						strokeDashoffset={1 - draw}
						style={{filter: 'drop-shadow(0 2px 2px rgba(0,0,0,0.3))'}}
					/>
				</svg>
			</Jitter>
		</div>
	);
};
