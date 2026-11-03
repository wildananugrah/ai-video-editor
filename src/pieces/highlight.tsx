// Yellow highlighter swipe over an area of the frame.
import React from 'react';
import {Easing, interpolate, useCurrentFrame} from 'remotion';
import {z} from 'zod';
import {useBox, useEdit, useStyleName} from '../context';
import {clean, cleanColor} from '../themes-clean';
import {color} from '../theme';
import {PieceProps, useExit} from './common';

export const schema = z
	.object({
		x: z.number().min(0).max(1),
		y: z.number().min(0).max(1),
		w: z.number().positive(),
		h: z.number().positive(),
		color: z.string().optional(),
	})
	.strict();

export const Component: React.FC<PieceProps<z.infer<typeof schema>>> = ({p, durationInFrames}) => {
	const frame = useCurrentFrame();
	const box = useBox();
	const exit = useExit(durationInFrames);
	const swipe = interpolate(frame, [0, 8], [0, 1], {extrapolateRight: 'clamp', easing: Easing.out(Easing.quad)});
	const {edit} = useEdit();
	const isClean = useStyleName() === 'clean';
	const w = p.w * box.width;
	const h = p.h * box.height;
	return (
		<div
			style={{
				position: 'absolute',
				left: p.x * box.width - w / 2,
				top: p.y * box.height - h / 2,
				width: w,
				height: h,
				background: isClean ? cleanColor(p.color, 'accent', edit.accent ?? clean.colors.accent) : color(p.color, 'yellow'),
				opacity: (isClean ? 0.3 : 0.55) * exit,
				mixBlendMode: 'multiply',
				transform: `scaleX(${swipe}) skewX(${isClean ? 0 : -8}deg)`,
				transformOrigin: 'left center',
				borderRadius: isClean ? 8 : '6% 40% 8% 30%',
			}}
		/>
	);
};
