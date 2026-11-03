// Shared bits for clean-style pieces.
import type React from 'react';
import {Easing, interpolate, useCurrentFrame} from 'remotion';
import {useEdit, useUnit} from '../../context';
import {CleanColor, clean, cleanColor} from '../../themes-clean';

export const useClean = (size = 1) => {
	const {edit} = useEdit();
	const accent = edit.accent ?? clean.colors.accent;
	return {
		u: useUnit() * size,
		accent,
		c: (name: string | undefined, fallback: CleanColor) => cleanColor(name, fallback, accent),
	};
};

// Smooth ease in (fade + small slide) and fade out. `from` is where it slides in from.
export const useReveal = (durationInFrames: number, delay = 0, from: 'up' | 'left' | 'right' | 'none' = 'up') => {
	const frame = useCurrentFrame() - delay;
	const inT = interpolate(frame, [0, 12], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)});
	const outT = interpolate(frame + delay, [durationInFrames - 8, durationInFrames], [1, 0], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
		easing: Easing.in(Easing.cubic),
	});
	const d = (1 - inT) * 28;
	const transform = from === 'up' ? `translateY(${d}px)` : from === 'left' ? `translateX(${-d}px)` : from === 'right' ? `translateX(${d}px)` : 'none';
	return {opacity: inT * outT, transform, t: inT};
};

export const surface = (u: number, bg: string = clean.colors.surface): React.CSSProperties => ({
	background: bg,
	borderRadius: clean.radius * u,
	boxShadow: clean.shadow(u),
});

export const text = (u: number, px: number, weight = 600, color: string = clean.colors.ink): React.CSSProperties => ({
	fontFamily: clean.font,
	fontWeight: weight,
	fontSize: px * u,
	color,
	letterSpacing: px > 60 ? -0.02 * px * u : 0,
});
