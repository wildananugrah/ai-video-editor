// A user image or B-roll clip: full-frame cutaway, or a taped photo inset.
import React from 'react';
import {Img, OffthreadVideo, staticFile, useCurrentFrame} from 'remotion';
import {z} from 'zod';
import {useBox, useEdit, useStyleName, useUnit} from '../context';
import {colors} from '../theme';
import {Jitter, Placed, PieceProps, Tape, placement, useEnter, useExit} from './common';

export const schema = z
	.object({
		src: z.string(), // relative to the project folder, e.g. "assets/chart.png"
		mode: z.enum(['full', 'inset']).optional(), // default inset
		width: z.number().positive().max(1).optional(), // inset width as a fraction of the box, default 0.45
		treatment: z.enum(['none', 'bw']).optional(), // bw = high-contrast black and white
		audio: z.boolean().optional(), // play a video's own sound (default muted)
		startAt: z.number().optional(), // seconds into a video clip
		fit: z.enum(['cover', 'contain']).optional(),
		...placement,
	})
	.strict();

export const isVideo = (src: string) => /\.(mp4|mov|webm|m4v)$/i.test(src);

export const Media: React.FC<{
	src: string;
	style: React.CSSProperties;
	audio?: boolean;
	startAt?: number;
}> = ({src, style, audio, startAt}) => {
	const {project, edit} = useEdit();
	const url = staticFile(`${project}/${src}`);
	return isVideo(src) ? (
		<OffthreadVideo src={url} muted={!audio} trimBefore={Math.round((startAt ?? 0) * edit.fps)} style={style} />
	) : (
		<Img src={url} style={style} />
	);
};

const bw = 'grayscale(1) contrast(1.6) brightness(1.05)';

export const Component: React.FC<PieceProps<z.infer<typeof schema>>> = ({p, durationInFrames, startFrame}) => {
	const frame = useCurrentFrame();
	const box = useBox();
	const u = useUnit() * (p.size ?? 1);
	const enter = useEnter();
	const exit = useExit(durationInFrames, 4);
	const filter = p.treatment === 'bw' ? bw : undefined;
	if (p.mode === 'full') {
		return (
			<div style={{position: 'absolute', inset: 0, background: colors.ink, opacity: Math.min(1, frame / 3) * exit}}>
				<Media
					src={p.src}
					audio={p.audio}
					startAt={p.startAt}
					style={{width: '100%', height: '100%', objectFit: p.fit ?? 'cover', filter}}
				/>
			</div>
		);
	}
	const w = (p.width ?? 0.45) * box.width;
	const isClean = useStyleName() === 'clean';
	if (isClean) {
		return (
			<Placed position={p.position ?? 'right'} x={p.x} y={p.y}>
				<div
					style={{
						width: w,
						borderRadius: 18 * u,
						overflow: 'hidden',
						boxShadow: `0 ${12 * u}px ${36 * u}px rgba(15,23,42,0.3)`,
						transform: `translateY(${(1 - enter) * 30 * u}px)`,
						opacity: Math.min(1, enter) * exit,
					}}
				>
					<Media src={p.src} audio={p.audio} startAt={p.startAt} style={{width: '100%', display: 'block', objectFit: p.fit ?? 'cover', filter}} />
				</div>
			</Placed>
		);
	}
	return (
		<Placed position={p.position ?? 'right'} x={p.x} y={p.y}>
			<Jitter seed={`img-${startFrame}`}>
				<div
					style={{
						position: 'relative',
						width: w,
						padding: 12 * u,
						background: colors.white,
						boxShadow: `0 ${10 * u}px ${26 * u}px rgba(0,0,0,0.4)`,
						transform: `rotate(${p.tilt ?? 3}deg) scale(${0.85 + 0.15 * enter})`,
						opacity: enter * exit,
					}}
				>
					<Media
						src={p.src}
						audio={p.audio}
						startAt={p.startAt}
						style={{width: '100%', display: 'block', objectFit: p.fit ?? 'cover', filter}}
					/>
					<Tape width={140 * u} tilt={-8} style={{position: 'absolute', top: -16 * u, left: -30 * u}} />
					<Tape width={140 * u} tilt={10} style={{position: 'absolute', bottom: -14 * u, right: -34 * u}} />
				</div>
			</Jitter>
		</Placed>
	);
};
