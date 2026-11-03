import {parseTime} from './lib/time';
import type {Entry} from './lib/types';

export type TimedEntry = {
	type: string;
	startFrame: number;
	durationInFrames: number;
	props: Record<string, unknown>;
	index: number;
};

export const timeEntries = (entries: Entry[], fps: number): TimedEntry[] =>
	entries.map(({type, from, to, ...props}, index) => {
		const startFrame = Math.round(parseTime(from) * fps);
		const end = Math.round(parseTime(to) * fps);
		return {type, startFrame, durationInFrames: Math.max(1, end - startFrame), props, index};
	});

export const activeAt = (entries: TimedEntry[], type: string, frame: number) =>
	entries.filter((e) => e.type === type && frame >= e.startFrame && frame < e.startFrame + e.durationInFrames).at(-1);
