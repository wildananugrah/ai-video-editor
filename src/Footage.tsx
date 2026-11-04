import React from 'react';
import {OffthreadVideo, Sequence, interpolate, staticFile, useVideoConfig} from 'remotion';
import {useEdit} from './context';

const GUARD_FRAMES = 1; // tiny volume ramp at each cut so joins don't click

// The kept segments of the recording(s), back to back.
export const FootageSegments: React.FC<{
	muted?: boolean;
	objectPosition?: string;
	style?: React.CSSProperties;
}> = ({muted, objectPosition = '50% 50%', style}) => {
	const {project, edit, segments} = useEdit();
	const {fps} = useVideoConfig();
	return (
		<>
			{segments.map((seg, i) => {
				const source = edit.sources.find((s) => s.id === seg.source);
				if (!source) throw new Error(`Unknown source "${seg.source}" in cuts`);
				const d = seg.durationInFrames;
				return (
					<Sequence key={i} from={seg.editStartFrame} durationInFrames={d} premountFor={fps}>
						<OffthreadVideo
							src={staticFile(`${project}/${source.file}`)}
							trimBefore={seg.srcStartFrame}
							muted={muted}
							volume={(f) =>
								d < 4
									? 1
									: interpolate(f, [0, GUARD_FRAMES, d - GUARD_FRAMES - 1, d - 1], [0, 1, 1, 0], {
											extrapolateLeft: 'clamp',
											extrapolateRight: 'clamp',
										})
							}
							style={{width: '100%', height: '100%', objectFit: 'cover', objectPosition, ...style}}
						/>
					</Sequence>
				);
			})}
		</>
	);
};
