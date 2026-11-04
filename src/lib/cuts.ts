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

// Every edited-video time showing this source moment; a cold open can reuse a line.
export const sourceToEditedAll = (segments: Segment[], source: string, seconds: number, fps: number): number[] => {
	const frame = seconds * fps;
	return segments
		.filter((s) => s.source === source && frame >= s.srcStartFrame && frame <= s.srcEndFrame)
		.map((s) => (s.editStartFrame + frame - s.srcStartFrame) / fps);
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

// Fastest plausible speech, and the slowest a word can be before its timing is suspect.
const MIN_SECONDS_PER_CHAR = 0.045;
const MAX_SECONDS_PER_CHAR = 0.35;

const norm = (s: string) => s.toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');

// Whisper sometimes outputs a line twice in a row. Nobody really repeats 5+ words
// exactly, so keep only the copy with the longer (more believable) timing.
export const dropRepeatedPhrases = (words: Word[], minWords = 5): Word[] => {
	const out = [...words];
	for (let n = Math.min(40, Math.floor(out.length / 2)); n >= minWords; n--) {
		for (let i = 0; i + 2 * n <= out.length; i++) {
			const same = Array.from({length: n}, (_, k) => k).every((k) => norm(out[i + k].text) === norm(out[i + n + k].text));
			if (!same) continue;
			const span = (from: number) => out[from + n - 1].end - out[from].start;
			out.splice(span(i) >= span(i + n) ? i + n : i, n);
			i--;
		}
	}
	return out;
};

// Whisper's word timings drift into pauses, and sometimes bunch many words onto
// one instant (or repeat a line). Work on a "speech clock" with pauses removed:
// words with believable durations stay put, the bunched ones between them are
// spread by length over the speech time available, and bunched lines that are
// repeated straight afterwards are dropped.
export const alignWordsToSpeech = (words: Word[], silences: Silence[], duration: number): Word[] => {
	const speech: Silence[] = [];
	let t = 0;
	for (const s of [...silences].sort((x, y) => x.start - y.start)) {
		if (s.start > t) speech.push({start: t, end: s.start});
		t = Math.max(t, s.end);
	}
	if (t < duration) speech.push({start: t, end: duration});
	if (speech.length === 0) return words;

	const cum: number[] = [0];
	for (const s of speech) cum.push(cum.at(-1)! + s.end - s.start);
	const total = cum.at(-1)!;
	const toClock = (x: number) => {
		let pos = 0;
		for (let i = 0; i < speech.length; i++) {
			if (x < speech[i].start) return pos;
			if (x <= speech[i].end) return pos + x - speech[i].start;
			pos = cum[i + 1];
		}
		return pos;
	};
	// A word starting on a pause boundary starts after it; one ending there ends before it.
	const fromClock = (pos: number, edge: 'start' | 'end') => {
		for (let i = 0; i < speech.length; i++) {
			if (edge === 'start' ? pos < cum[i + 1] : pos <= cum[i + 1]) return speech[i].start + pos - cum[i];
		}
		return speech.at(-1)!.end;
	};

	const chars = (w: Word) => Math.max(1, norm(w.text).length);
	const isGood = (w: Word, s: number, e: number) =>
		e > s && e - s >= chars(w) * MIN_SECONDS_PER_CHAR && e - s <= chars(w) * MAX_SECONDS_PER_CHAR + 0.3;

	let items = dropRepeatedPhrases(words).map((w) => {
		const s = toClock(w.start);
		const e = toClock(w.end);
		return {w, s, e, good: isGood(w, s, e)};
	});

	// Drop a bunched run of 3+ words when the same words follow immediately.
	for (let i = 0; i < items.length; i++) {
		if (items[i].good) continue;
		let j = i;
		while (j + 1 < items.length && !items[j + 1].good) j++;
		const len = j - i + 1;
		if (len >= 3) {
			const run = items.slice(i, j + 1).map((x) => norm(x.w.text));
			const next = items.slice(j + 1, j + 1 + len + 4).map((x) => norm(x.w.text));
			const firstMatch = next.indexOf(run[0]);
			const overlap = run.filter((r) => next.includes(r)).length;
			if (firstMatch !== -1 && firstMatch < 3 && overlap >= len * 0.7) {
				items = [...items.slice(0, i), ...items.slice(j + 1)];
				i--;
				continue;
			}
		}
		i = j;
	}

	const need = (from: number, to: number) => {
		let sum = 0;
		for (let k = from; k <= to; k++) sum += chars(items[k].w) * MIN_SECONDS_PER_CHAR;
		return sum;
	};
	const out = items.map((x) => ({s: x.s, e: x.e}));
	for (let i = 0; i < items.length; i++) {
		if (items[i].good) continue;
		let a = i;
		let b = i;
		while (b + 1 < items.length && !items[b + 1].good) b++;
		// Too little room: the neighbours are wrong too, so widen the run.
		const startOf = (k: number) => (k < 0 ? 0 : out[k].e);
		const endOf = (k: number) => (k >= items.length ? total : out[k].s);
		while (endOf(b + 1) - startOf(a - 1) < need(a, b) && (a > 0 || b < items.length - 1)) {
			if (a > 0) a--;
			if (b < items.length - 1) b++;
			while (a > 0 && !items[a - 1].good) a--;
			while (b < items.length - 1 && !items[b + 1].good) b++;
		}
		const from = startOf(a - 1);
		const span = Math.max(0, endOf(b + 1) - from);
		let totalChars = 0;
		for (let k = a; k <= b; k++) totalChars += chars(items[k].w);
		let pos = from;
		// Bunched words sit right after the previous word, at no slower than natural speech.
		const perChar = Math.min(span / totalChars, 0.09);
		for (let k = a; k <= b; k++) {
			const d = chars(items[k].w) * perChar;
			out[k] = {s: pos, e: pos + d};
			items[k].good = true;
			pos += d;
		}
		i = b;
	}

	const r = (x: number) => Math.round(x * 1000) / 1000;
	return items.map((x, k) => ({
		...x.w,
		start: r(fromClock(out[k].s, 'start')),
		end: r(fromClock(out[k].e, 'end')),
	}));
};

const r3 = (n: number) => Math.round(n * 1000) / 1000;

// Remove [from, to) (source seconds) from every cut of that source.
export const removeSourceRange = (cuts: Cut[], source: string, from: number, to: number): Cut[] =>
	cuts
		.flatMap((c) => {
			const a = parseTime(c.from);
			const b = parseTime(c.to);
			if (c.source !== source || to <= a || from >= b) return [c];
			return [
				...(from > a ? [{...c, from: r3(a), to: r3(from)}] : []),
				...(to < b ? [{...c, from: r3(to), to: r3(b)}] : []),
			];
		})
		.filter((c) => parseTime(c.to) - parseTime(c.from) > 0.05);

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
