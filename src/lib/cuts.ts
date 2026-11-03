// Maps between source time and edited-video time. Everything is snapped to
// frames so the scripts and the composition agree exactly.
import {parseTime} from './time';
import type {Cut, Transcript, Word} from './types';

export type Segment = {
	source: string;
	srcStartFrame: number;
	srcEndFrame: number;
	editStartFrame: number;
	durationInFrames: number;
};

export const toSegments = (cuts: Cut[], fps: number): Segment[] => {
	let editStartFrame = 0;
	return cuts.map((c) => {
		const srcStartFrame = Math.round(parseTime(c.from) * fps);
		const srcEndFrame = Math.round(parseTime(c.to) * fps);
		if (srcEndFrame <= srcStartFrame) {
			throw new Error(`Cut ${c.from}–${c.to} of "${c.source}" is empty or reversed`);
		}
		const seg = {
			source: c.source,
			srcStartFrame,
			srcEndFrame,
			editStartFrame,
			durationInFrames: srcEndFrame - srcStartFrame,
		};
		editStartFrame += seg.durationInFrames;
		return seg;
	});
};

export const totalFrames = (segments: Segment[]) =>
	segments.reduce((sum, s) => sum + s.durationInFrames, 0);

// Seconds in a source -> seconds in the edited video, or null if cut out.
export const sourceToEdited = (
	segments: Segment[],
	source: string,
	seconds: number,
	fps: number,
): number | null => {
	const frame = seconds * fps;
	for (const s of segments) {
		if (s.source === source && frame >= s.srcStartFrame && frame <= s.srcEndFrame) {
			return (s.editStartFrame + frame - s.srcStartFrame) / fps;
		}
	}
	return null;
};

// Seconds in the edited video -> {source, seconds in that source}.
export const editedToSource = (
	segments: Segment[],
	seconds: number,
	fps: number,
): {source: string; seconds: number} | null => {
	const frame = seconds * fps;
	for (let i = 0; i < segments.length; i++) {
		const s = segments[i];
		const isLast = i === segments.length - 1;
		const end = s.editStartFrame + s.durationInFrames;
		if (frame >= s.editStartFrame && (frame < end || (isLast && frame <= end))) {
			return {source: s.source, seconds: (s.srcStartFrame + frame - s.editStartFrame) / fps};
		}
	}
	return null;
};

// Words that survive the cuts, re-timed into the edited video.
export const wordsInEditedTime = (
	transcript: Transcript,
	segments: Segment[],
	fps: number,
): Word[] => {
	const out: Word[] = [];
	for (const seg of segments) {
		const words = transcript[seg.source] ?? [];
		const offset = (seg.editStartFrame - seg.srcStartFrame) / fps;
		const segStart = seg.srcStartFrame / fps;
		const segEnd = seg.srcEndFrame / fps;
		for (const w of words) {
			const mid = (w.start + w.end) / 2;
			if (mid < segStart || mid >= segEnd) continue;
			out.push({
				...w,
				start: Math.max(w.start, segStart) + offset,
				end: Math.min(w.end, segEnd) + offset,
			});
		}
	}
	return out;
};

export type Silence = {start: number; end: number};
export type SilenceOptions = {maxGap: number; pad: number};

// Whisper's word timings drift into pauses. Snap them to the real speech found
// in the audio: each word joins the stretch of speech its midpoint falls in (or
// the next one, if it falls in a pause), and each stretch's words are rescaled
// to fit it whenever they overflow it.
export const alignWordsToSpeech = (words: Word[], silences: Silence[], duration: number): Word[] => {
	const speech: Silence[] = [];
	let t = 0;
	for (const s of [...silences].sort((x, y) => x.start - y.start)) {
		if (s.start > t) speech.push({start: t, end: s.start});
		t = Math.max(t, s.end);
	}
	if (t < duration) speech.push({start: t, end: duration});
	if (speech.length === 0) return words;

	const groups: Word[][] = speech.map(() => []);
	for (const w of words) {
		const mid = (w.start + w.end) / 2;
		let i = speech.findIndex((s) => mid < s.end);
		if (i === -1) i = speech.length - 1;
		groups[i].push(w);
	}
	return groups.flatMap((g, i) => {
		if (g.length === 0) return [];
		const sp = speech[i];
		const a = g[0].start;
		const b = g.at(-1)!.end;
		if (a >= sp.start && b <= sp.end) return g;
		const from = Math.max(a, sp.start);
		const to = Math.min(b, sp.end);
		const k = (to - from) / Math.max(1e-6, b - a);
		const r = (x: number) => Math.round((from + (x - a) * k) * 1000) / 1000;
		return g.map((w) => ({...w, start: r(w.start), end: r(w.end)}));
	});
};

const r3 = (n: number) => Math.round(n * 1000) / 1000;

// Remove [from, to) (edited-video seconds) from the cut list, splitting cuts as needed.
export const removeEditedRange = (cuts: Cut[], fps: number, from: number, to: number): Cut[] => {
	const segs = toSegments(cuts, fps);
	const a = from * fps;
	const b = to * fps;
	const out: Cut[] = [];
	segs.forEach((s, i) => {
		const es = s.editStartFrame;
		const ee = es + s.durationInFrames;
		if (b <= es || a >= ee) {
			out.push(cuts[i]);
			return;
		}
		const {note} = cuts[i];
		if (a > es) out.push({source: s.source, from: r3(s.srcStartFrame / fps), to: r3((s.srcStartFrame + a - es) / fps), note});
		if (b < ee) out.push({source: s.source, from: r3((s.srcStartFrame + b - es) / fps), to: r3(s.srcEndFrame / fps), note});
	});
	// Drop slivers shorter than 2 frames.
	return out.filter((c) => (parseTime(c.to) - parseTime(c.from)) * fps >= 2);
};

// Remove every pause longer than maxGap from the cuts, leaving `pad` seconds of air
// on each side. Manual trims are kept.
export const applySilence = (
	cuts: Cut[],
	silences: Record<string, Silence[]>,
	{maxGap, pad}: SilenceOptions,
): Cut[] =>
	cuts.flatMap((c) => {
		let pieces = [{from: parseTime(c.from), to: parseTime(c.to)}];
		for (const s of silences[c.source] ?? []) {
			if (s.end - s.start <= maxGap) continue;
			const a = s.start + pad;
			const b = s.end - pad;
			pieces = pieces.flatMap((p) =>
				b <= p.from || a >= p.to
					? [p]
					: [
							...(a > p.from ? [{from: p.from, to: a}] : []),
							...(b < p.to ? [{from: b, to: p.to}] : []),
						],
			);
		}
		return pieces
			.filter((p) => p.to - p.from > 0.1)
			.map((p) => ({source: c.source, from: r3(p.from), to: r3(p.to), note: c.note}));
	});
