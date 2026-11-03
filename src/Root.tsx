import React from 'react';
import {CalculateMetadataFunction, Composition, staticFile} from 'remotion';
import {toSegments, totalFrames, wordsInEditedTime} from './lib/cuts';
import type {EditFile, Transcript} from './lib/types';
import {Main, MainProps} from './Main';

const fetchJson = async <T,>(path: string): Promise<T | null> => {
	const res = await fetch(`${staticFile(path)}?t=${Date.now()}`);
	return res.ok ? ((await res.json()) as T) : null;
};

const calculateMetadata: CalculateMetadataFunction<MainProps> = async ({props}) => {
	const edit = await fetchJson<EditFile>(`${props.project}/edit.json`);
	if (!edit) throw new Error(`projects/${props.project}/edit.json not found`);
	const transcript = (await fetchJson<Transcript>(`${props.project}/transcript.json`)) ?? {};
	const segments = toSegments(edit.cuts, edit.fps);
	return {
		durationInFrames: Math.max(1, totalFrames(segments)),
		width: edit.width,
		height: edit.height,
		fps: edit.fps,
		props: {...props, edit, words: wordsInEditedTime(transcript, segments, edit.fps)},
	};
};

export const Root: React.FC = () => (
	<Composition
		id="Edit"
		component={Main}
		defaultProps={{project: 'demo'} as MainProps}
		calculateMetadata={calculateMetadata}
		// Overwritten by calculateMetadata.
		durationInFrames={1}
		fps={30}
		width={1080}
		height={1920}
	/>
);
