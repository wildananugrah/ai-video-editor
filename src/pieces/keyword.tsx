// Big keyword text on tilted ink/yellow strips, revealed word by word as it's said.
import React, {useMemo} from 'react';
import {useCurrentFrame, useVideoConfig} from 'remotion';
import {z} from 'zod';
import {useEdit, useUnit} from '../context';
import {colors, fonts} from '../theme';
import {Jitter, Placed, PieceProps, placement, useEnter, useExit} from './common';

export const schema = z
	.object({
		text: z.string(), // "\n" starts a new strip
		highlight: z.array(z.string()).optional(), // words drawn in yellow / on yellow
		sync: z.boolean().optional(), // reveal each word when it's spoken (default true)
		...placement,
	})
	.strict();

const norm = (s: string) => s.toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');

export const Component: React.FC<PieceProps<z.infer<typeof schema>>> = ({p, durationInFrames, startFrame}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const {words} = useEdit();
	const u = useUnit() * (p.size ?? 1);
	const exit = useExit(durationInFrames);
	const lines = p.text.split('\n').map((l) => l.trim().split(/\s+/));
	const flat = lines.flat();
	const highlight = new Set((p.highlight ?? []).map(norm));

	// Frame (relative to this entry) at which each word appears.
	const revealAt = useMemo(() => {
		const fallback = flat.map((_, i) => i * 3);
		if (p.sync === false) return fallback;
		const t0 = startFrame / fps;
		const t1 = (startFrame + durationInFrames) / fps;
		const spoken = words.filter((w) => w.end >= t0 - 0.3 && w.start <= t1);
		let j = 0;
		return flat.map((word, i) => {
			const k = spoken.findIndex((w, idx) => idx >= j && norm(w.text) === norm(word));
			if (k === -1) return i === 0 ? 0 : fallback[i];
			j = k + 1;
			return Math.max(0, Math.round(spoken[k].start * fps) - startFrame);
		});
	}, [p.text, p.sync, words, startFrame, durationInFrames, fps]);

	let idx = 0;
	return (
		<Placed position={p.position ?? 'left'} x={p.x} y={p.y}>
			<div style={{display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 10 * u, opacity: exit}}>
				{lines.map((line, li) => {
					const onYellow = li % 2 === 1;
					const first = idx;
					// A strip appears with its first word and grows as words are said.
					if (frame < revealAt[first]) {
						idx += line.length;
						return null;
					}
					return (
						<Jitter key={li} seed={`kw-${startFrame}-${li}`}>
							<div
								style={{
									background: onYellow ? colors.yellow : colors.ink,
									padding: `${2 * u}px ${22 * u}px ${6 * u}px`,
									transform: `rotate(${(p.tilt ?? -2) * (li % 2 ? -1 : 1)}deg)`,
									boxShadow: `${6 * u}px ${6 * u}px 0 rgba(0,0,0,0.35)`,
									display: 'flex',
									gap: 18 * u,
								}}
							>
								{line.map((word) => {
									const at = revealAt[idx++];
									const shown = frame >= at;
									const isHi = highlight.has(norm(word));
									return (
										<span
											key={idx}
											style={{
												fontFamily: fonts.title,
												fontWeight: 900,
												fontSize: 120 * u,
												lineHeight: 1,
												textTransform: 'uppercase',
												color: onYellow ? colors.ink : isHi ? colors.yellow : colors.paper,
												background: onYellow && isHi ? colors.red : undefined,
												transform: `scale(${frame - at < 2 ? 1.12 : 1})`,
												display: shown ? 'inline-block' : 'none',
											}}
										>
											{word}
										</span>
									);
								})}
							</div>
						</Jitter>
					);
				})}
			</div>
		</Placed>
	);
};
