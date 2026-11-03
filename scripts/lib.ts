import {spawnSync} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import {type Silence, toSegments, wordsInEditedTime} from '../src/lib/cuts.ts';
import {formatSrtTime} from '../src/lib/time.ts';
import type {Cut, EditFile, Transcript, Word} from '../src/lib/types.ts';
import {projectDir} from './config.ts';

export const fail = (msg: string): never => {
	console.error(`✗ ${msg}`);
	process.exit(1);
};

// Positional args and --flags (--flag value / --flag).
export const parseArgs = (argv = process.argv.slice(2)) => {
	const pos: string[] = [];
	const flags: Record<string, string | true> = {};
	for (let i = 0; i < argv.length; i++) {
		const a = argv[i];
		if (a.startsWith('--')) {
			const next = argv[i + 1];
			if (next !== undefined && !next.startsWith('--')) {
				flags[a.slice(2)] = next;
				i++;
			} else flags[a.slice(2)] = true;
		} else pos.push(a);
	}
	return {pos, flags};
};

export const run = (bin: string, args: string[], quiet = false) => {
	const r = spawnSync(bin, args, {stdio: quiet ? ['ignore', 'pipe', 'pipe'] : 'inherit', encoding: 'utf8'});
	if (r.status !== 0) fail(`${bin} failed${quiet ? `:\n${r.stderr?.slice(-2000)}` : ''}`);
	return r.stdout ?? '';
};

export type Probe = {
	width: number;
	height: number;
	fps: number;
	duration: number;
	hdr: boolean;
	hasAudio: boolean;
};

export const probe = (file: string): Probe => {
	const out = run('ffprobe', ['-v', 'error', '-print_format', 'json', '-show_streams', '-show_format', file], true);
	const j = JSON.parse(out);
	const v = j.streams.find((s: any) => s.codec_type === 'video');
	if (!v) fail(`${file} has no video stream`);
	const [n, d] = String(v.avg_frame_rate || v.r_frame_rate).split('/').map(Number);
	const rotation = Number(
		v.side_data_list?.find((s: any) => s.rotation !== undefined)?.rotation ?? v.tags?.rotate ?? 0,
	);
	const sideways = Math.abs(rotation) % 180 === 90;
	return {
		width: sideways ? v.height : v.width,
		height: sideways ? v.width : v.height,
		fps: d ? n / d : n,
		duration: Number(j.format.duration),
		hdr: ['smpte2084', 'arib-std-b67'].includes(v.color_transfer),
		hasAudio: j.streams.some((s: any) => s.codec_type === 'audio'),
	};
};

// Phone footage is often 29.97/59.94 or variable: snap to a standard rate.
export const standardFps = (fps: number) => {
	const rates = [24, 25, 30, 50, 60];
	return rates.reduce((best, r) => (Math.abs(r - fps) < Math.abs(best - fps) ? r : best));
};

export const editPath = (name: string) => path.join(projectDir(name), 'edit.json');

export const readEdit = (name: string): EditFile => {
	const p = editPath(name);
	if (!fs.existsSync(p)) fail(`No project "${name}" (missing ${p})`);
	return JSON.parse(fs.readFileSync(p, 'utf8'));
};

export const writeEdit = (name: string, edit: EditFile) =>
	fs.writeFileSync(editPath(name), JSON.stringify(edit, null, '\t') + '\n');

export const readTranscript = (name: string): Transcript => {
	const p = path.join(projectDir(name), 'transcript.json');
	return fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, 'utf8')) : {};
};

// Group words into subtitle cues: break on long pauses, sentence ends, or length.
export const wordsToCues = (words: Word[]) => {
	const cues: {start: number; end: number; text: string}[] = [];
	let cur: Word[] = [];
	const flush = () => {
		if (cur.length) cues.push({start: cur[0].start, end: cur.at(-1)!.end, text: cur.map((w) => w.text).join(' ')});
		cur = [];
	};
	for (const w of words) {
		const prev = cur.at(-1);
		if (prev && (w.start - prev.end > 0.5 || cur.map((x) => x.text).join(' ').length > 38)) flush();
		cur.push(w);
		if (/[.?!]$/.test(w.text)) flush();
	}
	flush();
	return cues;
};

export const toSrt = (words: Word[]) =>
	wordsToCues(words)
		.map((c, i) => `${i + 1}\n${formatSrtTime(c.start)} --> ${formatSrtTime(c.end)}\n${c.text}\n`)
		.join('\n');

export const writeEditedSrt = (name: string) => {
	const edit = readEdit(name);
	const words = wordsInEditedTime(readTranscript(name), toSegments(edit.cuts, edit.fps), edit.fps);
	const p = path.join(projectDir(name), 'transcript.edited.srt');
	fs.writeFileSync(p, toSrt(words));
	return p;
};

// The cut list that entries' times were written against (see recut).
const stampPath = (name: string) => path.join(projectDir(name), '.state', 'entries-cuts.json');

export const readCutStamp = (name: string): Cut[] | null => {
	const p = stampPath(name);
	return fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, 'utf8')) : null;
};

export const writeCutStamp = (name: string, cuts: Cut[]) => {
	fs.mkdirSync(path.dirname(stampPath(name)), {recursive: true});
	fs.writeFileSync(stampPath(name), JSON.stringify(cuts));
};

// True when graphics exist that were timed against a different cut list.
export const cutsChangedSinceEntries = (name: string, edit: EditFile) => {
	const stamp = readCutStamp(name);
	if (edit.entries.length === 0) {
		writeCutStamp(name, edit.cuts);
		return false;
	}
	if (!stamp) {
		writeCutStamp(name, edit.cuts);
		return false;
	}
	return JSON.stringify(stamp) !== JSON.stringify(edit.cuts);
};

// Pauses in a recording, from the audio level (more reliable than word timings).
export const detectSilences = (file: string, noiseDb = -35, minDur = 0.25): Silence[] => {
	const r = spawnSync('ffmpeg', ['-v', 'info', '-i', file, '-af', `silencedetect=noise=${noiseDb}dB:d=${minDur}`, '-f', 'null', '-'], {
		encoding: 'utf8',
	});
	const duration = Number(run('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', file], true));
	const out: Silence[] = [];
	let start: number | null = null;
	for (const line of r.stderr.split('\n')) {
		const s = line.match(/silence_start: (-?[\d.]+)/);
		const e = line.match(/silence_end: ([\d.]+)/);
		if (s) start = Math.max(0, Number(s[1]));
		if (e && start !== null) {
			out.push({start, end: Number(e[1])});
			start = null;
		}
	}
	if (start !== null) out.push({start, end: duration});
	// A pause that runs to the end of the audio runs to the end of the video too.
	const last = out.at(-1);
	if (last && duration - last.end < 0.05) last.end = 1e9;
	return out;
};

const silencesPath = (name: string) => path.join(projectDir(name), 'silences.json');

export const readSilences = (name: string): Record<string, Silence[]> => {
	const p = silencesPath(name);
	return fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, 'utf8')) : {};
};

export const writeSilences = (name: string, silences: Record<string, Silence[]>) =>
	fs.writeFileSync(silencesPath(name), JSON.stringify(silences));
