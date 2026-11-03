// Shape of projects/<name>/edit.json and transcript.json.

// "mm:ss.s", "hh:mm:ss.s" or plain seconds.
export type Time = string | number;

export type Source = {
	id: string;
	// Working copy (CFR H.264), relative to the project folder.
	file: string;
	// Untouched original, relative to the project folder.
	original: string;
	durationInSeconds: number;
};

// A kept piece of a source, in source time.
export type Cut = {source: string; from: Time; to: Time; note?: string};

export type Entry = {
	type: string;
	// Edited-video time.
	from: Time;
	to: Time;
	[prop: string]: unknown;
};

export type StyleName = 'collage' | 'clean';

export type EditFile = {
	style?: StyleName; // default collage
	accent?: string; // clean style accent colour, default blue
	width: number;
	height: number;
	fps: number;
	sources: Source[];
	cuts: Cut[];
	entries: Entry[];
};

export type Word = {
	text: string;
	start: number; // seconds
	end: number;
	confidence: number;
};

// transcript.json: words per source, in source time.
export type Transcript = Record<string, Word[]>;
