// Diagram: start -> middle -> several outcomes. Boxes appear in order; `active` lights one outcome.
import React from 'react';
import {useCurrentFrame, useVideoConfig} from 'remotion';
import {z} from 'zod';
import {useBox, useStyleName, useUnit} from '../context';
import {colors, fonts} from '../theme';
import {clean} from '../themes-clean';
import {Placed, PieceProps, progress, useExit} from './common';

export const schema = z
	.object({
		start: z.string(),
		middle: z.string(),
		outcomes: z.array(z.string()).min(1),
		active: z.number().int().min(0).optional(), // index of the outcome to light up
		revealEach: z.number().positive().optional(), // seconds between boxes, default 0.5
		size: z.number().positive().optional(),
	})
	.strict();

export const Component: React.FC<PieceProps<z.infer<typeof schema>>> = ({p, durationInFrames}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const box = useBox();
	const isClean = useStyleName() === 'clean';
	const u = useUnit() * (p.size ?? 1);
	const exit = useExit(durationInFrames, 8);
	const each = (p.revealEach ?? 0.5) * fps;
	const font = isClean ? clean.font : fonts.title;
	const line = isClean ? clean.colors.muted : colors.ink;
	const show = (i: number) => progress(frame, i * each, i * each + 8);
	const nodeStyle = (i: number, bg: string, fg: string): React.CSSProperties => ({
		background: bg,
		color: fg,
		fontFamily: font,
		fontWeight: 800,
		fontSize: 38 * u,
		lineHeight: 1.15,
		textAlign: 'center',
		padding: `${20 * u}px ${28 * u}px`,
		borderRadius: isClean ? 14 * u : 0,
		boxShadow: clean.shadow(u),
		opacity: show(i),
		transform: `translateY(${(1 - show(i)) * 16 * u}px)`,
		textTransform: isClean ? undefined : 'uppercase',
	});
	const ink = isClean ? clean.colors.ink : colors.ink;
	const surface = isClean ? clean.colors.surface : colors.card;
	const yellow = isClean ? clean.colors.accent : colors.yellow;
	const Arrow: React.FC<{i: number}> = ({i}) => (
		<div style={{fontFamily: font, fontWeight: 800, fontSize: 56 * u, color: line, opacity: show(i)}}>→</div>
	);
	return (
		<Placed position="center">
			<div style={{display: 'flex', flexDirection: box.vertical ? 'column' : 'row', alignItems: 'center', gap: 22 * u, opacity: exit}}>
				<div style={nodeStyle(0, ink, surface)}>{p.start}</div>
				<Arrow i={1} />
				<div style={nodeStyle(1, yellow, ink)}>{p.middle}</div>
				<Arrow i={2} />
				<div style={{display: 'flex', flexDirection: 'column', gap: 14 * u}}>
					{p.outcomes.map((o, i) => (
						<div key={o} style={{...nodeStyle(2 + i, p.active === i ? yellow : surface, ink), outline: p.active === i ? `${4 * u}px solid ${ink}` : undefined}}>
							{o}
						</div>
					))}
				</div>
			</div>
		</Placed>
	);
};
