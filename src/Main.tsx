import './fonts';
import React, {useMemo} from 'react';
import {AbsoluteFill, Sequence} from 'remotion';
import {EditContext} from './context';
import {toSegments} from './lib/cuts';
import type {EditFile, Word} from './lib/types';
import {getPiece} from './pieces';
import {Speaker} from './Speaker';
import {Texture} from './Texture';
import {colors} from './theme';
import {timeEntries} from './timing';

export type MainProps = {project: string; edit?: EditFile; words?: Word[]};

// Scenes go under everything else so overlays can sit on top of them.
const layer = (type: string) => (type === 'scene' ? 0 : 1);

export const Main: React.FC<MainProps> = ({project, edit, words}) => {
	if (!edit) throw new Error(`No edit.json loaded for project "${project}"`);
	const segments = useMemo(() => toSegments(edit.cuts, edit.fps), [edit]);
	const timed = useMemo(() => timeEntries(edit.entries, edit.fps), [edit]);
	const ordered = [...timed].sort((a, b) => layer(a.type) - layer(b.type) || a.index - b.index);
	return (
		<EditContext.Provider value={{project, edit, segments, words: words ?? []}}>
			<AbsoluteFill style={{background: colors.ink}}>
				<Speaker entries={timed} />
				{ordered
					.filter((e) => e.type !== 'zoom')
					.map((e) => {
						const piece = getPiece(e.type, edit.style);
						const Comp = piece.Component;
						return (
							<Sequence
								key={e.index}
								from={e.startFrame}
								durationInFrames={e.durationInFrames}
								name={`${e.index}: ${e.type}`}
								premountFor={edit.fps}
							>
								<Comp p={piece.schema.parse(e.props)} durationInFrames={e.durationInFrames} startFrame={e.startFrame} />
							</Sequence>
						);
					})}
				<Texture />
			</AbsoluteFill>
		</EditContext.Provider>
	);
};
