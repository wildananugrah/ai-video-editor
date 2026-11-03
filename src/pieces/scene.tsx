// Full-screen collage scene replacing the footage, with the speaker as a badge or cut-out.
import React from 'react';
import {AbsoluteFill, Img, staticFile, useCurrentFrame} from 'remotion';
import {z} from 'zod';
import {useEdit, useUnit} from '../context';
import {Children} from '../Children';
import {childSchema} from './child';
import {Badge} from './badge';
import {Jitter, Placed, PieceProps, halftone, placement, progress, useExit} from './common';
import {usePanelBackground} from './split';
import {useStyleName} from '../context';

export const schema = z
	.object({
		background: z.enum(['paper', 'ink', 'yellow', 'halftone']).optional(), // default paper
		speaker: z.enum(['badge', 'cutout', 'none']).optional(), // default badge
		speakerSrc: z.string().optional(), // *-sticker.png (from `npm run sticker`) for speaker: "cutout"
		speakerPosition: z.enum(placement.position.unwrap().options).optional(),
		speakerSize: z.number().positive().optional(),
		focusX: z.number().min(0).max(1).optional(), // badge crop, see badge piece
		focusY: z.number().min(0).max(1).optional(),
		children: z.array(childSchema).optional(),
	})
	.strict();

export const Component: React.FC<PieceProps<z.infer<typeof schema>>> = ({p, durationInFrames, startFrame}) => {
	const frame = useCurrentFrame();
	const {project} = useEdit();
	const u = useUnit();
	const exit = useExit(durationInFrames, 3);
	// Stop-motion wipe in: the paper slides across in 3 steps.
	const wipe = Math.ceil(progress(frame, 0, 6) * 3) / 3;
	const speaker = p.speaker ?? 'badge';
	const isClean = useStyleName() === 'clean';
	const bg = usePanelBackground(p.background, u);
	const smooth = progress(frame, 0, 10);
	return (
		<AbsoluteFill style={isClean ? {opacity: smooth * exit} : {clipPath: `inset(0 ${(1 - wipe) * 100}% 0 0)`, opacity: exit}}>
			<AbsoluteFill style={bg} />
			<Children items={p.children ?? []} parentStart={startFrame} parentDuration={durationInFrames} />
			{speaker === 'badge' ? (
				<Badge
					p={{position: p.speakerPosition ?? 'bottom-right', size: p.speakerSize, focusX: p.focusX, focusY: p.focusY}}
					startFrame={startFrame}
					durationInFrames={durationInFrames}
				/>
			) : null}
			{speaker === 'cutout' && p.speakerSrc ? (
				<Placed position={p.speakerPosition ?? 'bottom-right'} keepSides>
					<Jitter seed={`cutout-${startFrame}`}>
						<div style={{position: 'relative', width: 520 * u * (p.speakerSize ?? 1)}}>
							{isClean ? null : <div style={{position: 'absolute', inset: '25% -4% 0 -4%', ...halftone(u), transform: 'rotate(4deg)'}} />}
							<Img
								src={staticFile(`${project}/${p.speakerSrc}`)}
								style={{position: 'relative', width: '100%', display: 'block'}}
							/>
						</div>
					</Jitter>
				</Placed>
			) : null}
		</AbsoluteFill>
	);
};
