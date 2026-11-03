// Clean headline: accent bar + bold white type, words rise in as they're spoken.
import React, {useMemo} from 'react';
import {Easing, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {z} from 'zod';
import {useEdit} from '../../context';
import {Placed, PieceProps} from '../common';
import {schema} from '../keyword';
import {clean} from '../../themes-clean';
import {text, useClean, useReveal} from './kit';

export {schema};

const norm = (s: string) => s.toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');

export const Component: React.FC<PieceProps<z.infer<typeof schema>>> = ({p, durationInFrames, startFrame}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const {words} = useEdit();
	const {u, accent} = useClean(p.size);
	const {opacity} = useReveal(durationInFrames, 0, 'none');
	const lines = p.text.split('\n').map((l) => l.trim().split(/\s+/));
	const flat = lines.flat();
	const highlight = new Set((p.highlight ?? []).map(norm));
	const revealAt = useMemo(() => {
		const fallback = flat.map((_, i) => i * 3);
		if (p.sync === false) return fallback;
		const t0 = startFrame / fps;
		const spoken = words.filter((w) => w.end >= t0 - 0.3 && w.start <= (startFrame + durationInFrames) / fps);
		let j = 0;
		return flat.map((word, i) => {
			const k = spoken.findIndex((w, idx) => idx >= j && norm(w.text) === norm(word));
			if (k === -1) return i === 0 ? 0 : fallback[i];
			j = k + 1;
			return Math.max(0, Math.round(spoken[k].start * fps) - startFrame);
		});
	}, [p.text, p.sync, words, startFrame, durationInFrames, fps]);
	const bar = interpolate(frame, [0, 10], [0, 1], {extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)});
	let idx = 0;
	return (
		<Placed position={p.position ?? 'left'} x={p.x} y={p.y}>
			<div
				style={{
					display: 'flex',
					gap: 24 * u,
					opacity,
					background: clean.scrim(0.85),
					borderRadius: 18 * u,
					padding: `${22 * u}px ${34 * u}px ${18 * u}px ${24 * u}px`,
					boxShadow: `0 ${12 * u}px ${36 * u}px rgba(20,20,20,0.3)`,
				}}
			>
				<div style={{width: 10 * u, borderRadius: 5 * u, background: accent, transform: `scaleY(${bar})`, transformOrigin: 'top'}} />
				<div style={{display: 'flex', flexDirection: 'column', gap: 4 * u}}>
					{lines.map((line, li) => (
						<div key={li} style={{display: 'flex', gap: 20 * u, overflow: 'hidden', paddingBottom: 6 * u}}>
							{line.map((word) => {
								const at = revealAt[idx++];
								const t = interpolate(frame, [at, at + 8], [0, 1], {
									extrapolateLeft: 'clamp',
									extrapolateRight: 'clamp',
									easing: Easing.out(Easing.cubic),
								});
								return (
									<span
										key={idx}
										style={{
											...text(u, li === 0 ? 96 : 80, 800, highlight.has(norm(word)) ? accent : clean.colors.surface),
											lineHeight: 1.05,
											display: 'inline-block',
											transform: `translateY(${(1 - t) * 110}%)`,
											opacity: t,
										}}
									>
										{word}
									</span>
								);
							})}
						</div>
					))}
				</div>
			</div>
		</Placed>
	);
};
