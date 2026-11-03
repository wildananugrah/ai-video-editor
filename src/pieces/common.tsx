import React from 'react';
import {Easing, interpolate, random, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {z} from 'zod';
import {useBox, useStyleName, useUnit} from '../context';
import {colors, texture} from '../theme';

export const positions = [
	'center',
	'left',
	'right',
	'top',
	'bottom',
	'top-left',
	'top-right',
	'bottom-left',
	'bottom-right',
] as const;
export type Position = (typeof positions)[number];

// Props shared by most pieces.
export const placement = {
	position: z.enum(positions).optional(),
	// Centre point as a fraction of the box (overrides position).
	x: z.number().min(0).max(1).optional(),
	y: z.number().min(0).max(1).optional(),
	size: z.number().positive().optional(), // scale multiplier, 1 = default
	tilt: z.number().optional(), // degrees
};

export type PieceProps<T> = {
	p: T;
	durationInFrames: number;
	startFrame: number; // absolute frame in the edited video
};

// In vertical frames there is no room beside the speaker, so sideways
// positions become above/below.
const verticalize = (pos: Position): Position => {
	switch (pos) {
		case 'left':
		case 'top-left':
			return 'top';
		case 'right':
		case 'top-right':
			return 'bottom';
		case 'bottom-left':
		case 'bottom-right':
			return 'bottom';
		default:
			return pos;
	}
};

const align: Record<Position, {justifyContent: string; alignItems: string}> = {
	center: {justifyContent: 'center', alignItems: 'center'},
	left: {justifyContent: 'flex-start', alignItems: 'center'},
	right: {justifyContent: 'flex-end', alignItems: 'center'},
	top: {justifyContent: 'center', alignItems: 'flex-start'},
	bottom: {justifyContent: 'center', alignItems: 'flex-end'},
	'top-left': {justifyContent: 'flex-start', alignItems: 'flex-start'},
	'top-right': {justifyContent: 'flex-end', alignItems: 'flex-start'},
	'bottom-left': {justifyContent: 'flex-start', alignItems: 'flex-end'},
	'bottom-right': {justifyContent: 'flex-end', alignItems: 'flex-end'},
};

export const Placed: React.FC<{
	position?: Position;
	x?: number;
	y?: number;
	children: React.ReactNode;
	keepSides?: boolean; // don't remap left/right in vertical frames
}> = ({position = 'center', x, y, children, keepSides}) => {
	const box = useBox();
	if (x !== undefined || y !== undefined) {
		return (
			<div
				style={{
					position: 'absolute',
					left: (x ?? 0.5) * box.width,
					top: (y ?? 0.5) * box.height,
					transform: 'translate(-50%, -50%)',
				}}
			>
				{children}
			</div>
		);
	}
	const pos = box.vertical && !keepSides ? verticalize(position) : position;
	return (
		<div
			style={{
				position: 'absolute',
				top: box.pad.top,
				bottom: box.pad.bottom,
				left: box.pad.left,
				right: box.pad.right,
				display: 'flex',
				...align[pos],
			}}
		>
			{children}
		</div>
	);
};

// Stop-motion wobble: the piece jumps to a new offset a few times a second.
export const Jitter: React.FC<{seed: string; amount?: number; children: React.ReactNode; style?: React.CSSProperties}> = ({
	seed,
	amount = 1,
	children,
	style,
}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const u = useUnit();
	if (useStyleName() === 'clean') amount = 0;
	const step = Math.floor((frame * texture.jitterFps) / fps);
	const r = (k: string) => (random(`${seed}-${k}-${step}`) - 0.5) * 2 * amount;
	return (
		<div
			style={{
				transform: `translate(${r('x') * texture.jitterPx * u}px, ${r('y') * texture.jitterPx * u}px) rotate(${
					r('r') * texture.jitterDeg
				}deg)`,
				...style,
			}}
		>
			{children}
		</div>
	);
};

// 0 -> 1 springy entrance.
export const useEnter = (delayFrames = 0, damping = 14) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	return spring({frame: frame - delayFrames, fps, config: {damping, mass: 0.6}});
};

// 1 -> 0 over the last few frames.
export const useExit = (durationInFrames: number, frames = 6) => {
	const frame = useCurrentFrame();
	return interpolate(frame, [durationInFrames - frames, durationInFrames], [1, 0], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
		easing: Easing.in(Easing.quad),
	});
};

// Linear 0 -> 1 between two frames.
export const progress = (frame: number, from: number, to: number) =>
	interpolate(frame, [from, to], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

// A scrap of masking tape.
export const Tape: React.FC<{width?: number; tilt?: number; style?: React.CSSProperties; children?: React.ReactNode}> = ({
	width,
	tilt = -4,
	style,
	children,
}) => (
	<div
		style={{
			width,
			padding: width ? `${width * 0.04}px ${width * 0.08}px` : undefined,
			background: 'rgba(236, 233, 223, 0.82)',
			boxShadow: '0 1px 3px rgba(0,0,0,0.25)',
			transform: `rotate(${tilt}deg)`,
			clipPath:
				'polygon(0% 8%, 3% 0%, 7% 10%, 11% 2%, 100% 0%, 97% 12%, 100% 30%, 98% 55%, 100% 92%, 95% 100%, 90% 90%, 85% 100%, 0% 100%, 2% 70%, 0% 45%, 3% 25%)',
			...style,
		}}
	>
		{children}
	</div>
);

// Yellow block with a halftone dot pattern.
export const halftone = (u: number, dot = colors.ink, bg = colors.yellow): React.CSSProperties => ({
	backgroundColor: bg,
	backgroundImage: `radial-gradient(${dot} ${1.6 * u}px, transparent ${2 * u}px)`,
	backgroundSize: `${9 * u}px ${9 * u}px`,
});

// Paper with faint fibres.
export const paperStyle = (bg: string = colors.paper): React.CSSProperties => ({
	backgroundColor: bg,
	backgroundImage:
		'repeating-linear-gradient(17deg, rgba(0,0,0,0.018) 0 2px, transparent 2px 7px), repeating-linear-gradient(-71deg, rgba(0,0,0,0.014) 0 1px, transparent 1px 5px)',
});

// Deterministic alternating tilt so neighbours don't all lean the same way.
export const tiltFor = (seed: string, base = 3) => (random(seed) > 0.5 ? base : -base);
