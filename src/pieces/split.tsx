// Speaker on one side, a panel with pieces on the other. Stacks top/bottom in
// vertical frames. The speaker half is drawn by <Speaker>.
import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {z} from 'zod';
import {BoxProvider, useBox, useEdit, useStyleName, useUnit} from '../context';
import {clean} from '../themes-clean';
import {Children} from '../Children';
import {childSchema} from './child';
import {colors} from '../theme';
import {PieceProps, halftone, paperStyle, progress} from './common';

export const schema = z
	.object({
		side: z.enum(['left', 'right']).optional(), // which side the speaker is on (left = top in vertical)
		panel: z.enum(['paper', 'ink', 'yellow', 'halftone']).optional(), // default paper
		focusX: z.number().min(0).max(1).optional(), // horizontal position of the speaker in the frame, default 0.5
		children: z.array(childSchema).optional(),
	})
	.strict();

export const TRANSITION = 8;

export const splitAmount = (frame: number, durationInFrames: number) =>
	Math.min(progress(frame, 0, TRANSITION), 1 - progress(frame, durationInFrames - TRANSITION, durationInFrames));

// Clean style: paper -> soft white, ink -> dark slate, yellow/halftone -> accent gradient.
const cleanPanel = (panel: string | undefined, accent: string): React.CSSProperties =>
	panel === 'ink'
		? {background: `linear-gradient(160deg, #2A2A28, ${clean.colors.ink})`}
		: panel === 'yellow' || panel === 'halftone'
			? {background: accent}
			: {background: `linear-gradient(160deg, ${clean.colors.surface}, ${clean.colors.paper})`};

export const usePanelBackground = (panel: string | undefined, u: number): React.CSSProperties => {
	const {edit} = useEdit();
	return useStyleName() === 'clean' ? cleanPanel(panel, edit.accent ?? clean.colors.accent) : panelBackground(panel, u);
};

export const panelBackground = (panel: string | undefined, u: number): React.CSSProperties =>
	panel === 'ink'
		? {background: colors.ink}
		: panel === 'yellow'
			? {background: colors.yellow}
			: panel === 'halftone'
				? halftone(u)
				: paperStyle();

export const Component: React.FC<PieceProps<z.infer<typeof schema>>> = ({p, durationInFrames, startFrame}) => {
	const frame = useCurrentFrame();
	const full = useBox();
	const u = useUnit();
	const t = splitAmount(frame, durationInFrames);
	const speakerFirst = (p.side ?? 'left') === 'left';
	const v = full.vertical;
	const w = v ? full.width : full.width / 2;
	const h = v ? full.height / 2 : full.height;
	// Panel slides in from its own edge.
	const off = (1 - t) * (v ? h : w) * (speakerFirst ? 1 : -1);
	const left = v ? 0 : speakerFirst ? w : 0;
	const top = v ? (speakerFirst ? h : 0) : 0;
	const m = 24 * u;
	const panelBox = {
		width: w,
		height: h,
		vertical: v,
		pad: {
			top: v && !speakerFirst ? full.pad.top : m,
			bottom: v && speakerFirst ? full.pad.bottom : m,
			left: v ? full.pad.left : m,
			right: v ? full.pad.right : m,
		},
	};
	const isClean = useStyleName() === 'clean';
	const bg = usePanelBackground(p.panel, u);
	const divider = (isClean ? 0 : 10) * u;
	return (
		<AbsoluteFill>
			<div
				style={{
					position: 'absolute',
					left,
					top,
					width: w,
					height: h,
					overflow: 'hidden',
					transform: v ? `translateY(${off}px)` : `translateX(${off}px)`,
					...bg,
				}}
			>
				<BoxProvider box={panelBox}>
					<Children items={p.children ?? []} parentStart={startFrame} parentDuration={durationInFrames} />
				</BoxProvider>
			</div>
			<div
				style={{
					position: 'absolute',
					background: colors.ink,
					boxShadow: isClean ? undefined : `0 0 0 ${3 * u}px ${colors.yellow}`,
					opacity: t,
					...(v
						? {left: 0, right: 0, top: h - divider / 2 + off, height: divider}
						: {top: 0, bottom: 0, left: w - divider / 2 + off, width: divider}),
				}}
			/>
		</AbsoluteFill>
	);
};
