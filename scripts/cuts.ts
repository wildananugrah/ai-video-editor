// npm run cuts -- <command> <project> ...
//   list    <project>                      kept segments with edited times and their first words
//   propose <project> [--max-gap s] [--pad s] [--noise dB]   what the silence pass would remove (no changes)
//   silence <project> [--max-gap s] [--pad s] [--noise dB]   apply the silence pass
//     --noise re-detects pauses at that level (default -35; try -30 for noisy rooms)
//   remove  <project> <from> <to> [--source s1]   cut a range of the EDITED video (snaps to word edges),
//                                          or with --source a range of that ORIGINAL recording
//   trim    <project> [--start t] [--end t]     cut everything before/after (edited time)
//   reset   <project>                      back to the whole recording(s)
import {applySilence, removeEditedRange, removeSourceRange, toSegments, totalFrames, wordsInEditedTime} from '../src/lib/cuts.ts';
import {formatTime, parseTime} from '../src/lib/time.ts';
import type {Cut} from '../src/lib/types.ts';
import path from 'node:path';
import {projectDir} from './config.ts';
import {detectSilences, fail, parseArgs, readEdit, readSilences, readTranscript, writeEdit, writeEditedSrt, writeSilences} from './lib.ts';

const {pos, flags} = parseArgs();
const [cmd, name, a, b] = pos;
if (!cmd || !name) fail('usage: npm run cuts -- <list|propose|silence|remove|trim|reset> <project> ...');
const edit = readEdit(name);
const transcript = readTranscript(name);
const fps = edit.fps;
const opts = {
	maxGap: typeof flags['max-gap'] === 'string' ? Number(flags['max-gap']) : 0.6,
	pad: typeof flags.pad === 'string' ? Number(flags.pad) : 0.15,
};
const silences = () => {
	const all = readSilences(name);
	if (typeof flags.noise === 'string') {
		for (const s of edit.sources) {
			const wav = path.join(projectDir(name), '.state', `${s.id}.wav`);
			all[s.id] = detectSilences(wav, Number(flags.noise));
		}
		writeSilences(name, all);
	}
	return all;
};
const length = (cuts: Cut[]) => totalFrames(toSegments(cuts, fps)) / fps;

const list = (cuts: Cut[]) => {
	const segs = toSegments(cuts, fps);
	const words = wordsInEditedTime(transcript, segs, fps);
	segs.forEach((s, i) => {
		const start = s.editStartFrame / fps;
		const end = (s.editStartFrame + s.durationInFrames) / fps;
		const text = words
			.filter((w) => w.start >= start && w.start < end)
			.map((w) => w.text)
			.join(' ');
		const short = text.length > 70 ? `${text.slice(0, 70)}…` : text;
		console.log(
			`${String(i + 1).padStart(3)}  ${formatTime(start)}–${formatTime(end)}  [${s.source} ${formatTime(
				s.srcStartFrame / fps,
			)}–${formatTime(s.srcEndFrame / fps)}]  ${short}`,
		);
	});
	console.log(`total ${formatTime(length(cuts))}`);
};

const save = (cuts: Cut[], what: string) => {
	const before = length(edit.cuts);
	edit.cuts = cuts;
	writeEdit(name, edit);
	writeEditedSrt(name);
	console.log(`✓ ${what}: ${formatTime(before)} → ${formatTime(length(cuts))}. transcript.edited.srt updated.`);
	if (edit.entries.length) console.log('! Graphics exist: run `npm run recut -- ' + name + '` to move them with the words.');
};

// Move a cut edge out of the middle of a word.
const snap = (t: number, edge: 'start' | 'end') => {
	const words = wordsInEditedTime(transcript, toSegments(edit.cuts, fps), fps);
	const w = words.find((x) => t > x.start && t < x.end);
	return w ? (edge === 'start' ? w.start : w.end) : t;
};

switch (cmd) {
	case 'list':
		list(edit.cuts);
		break;
	case 'propose': {
		const next = applySilence(edit.cuts, silences(), opts);
		console.log(`Silence pass (gaps > ${opts.maxGap}s, ${opts.pad}s padding): ${formatTime(length(edit.cuts))} → ${formatTime(length(next))}`);
		list(next);
		break;
	}
	case 'silence':
		save(applySilence(edit.cuts, silences(), opts), 'silence pass');
		break;
	case 'remove': {
		if (!a || !b) fail('usage: npm run cuts -- remove <project> <from> <to>');
		if (typeof flags.source === 'string') {
			save(removeSourceRange(edit.cuts, flags.source, parseTime(a), parseTime(b)), `removed ${a}–${b} of ${flags.source}`);
			break;
		}
		const from = snap(parseTime(a), 'start');
		const to = snap(parseTime(b), 'end');
		save(removeEditedRange(edit.cuts, fps, from, to), `removed ${formatTime(from)}–${formatTime(to)}`);
		break;
	}
	case 'trim': {
		let cuts = edit.cuts;
		if (typeof flags.end === 'string') cuts = removeEditedRange(cuts, fps, snap(parseTime(flags.end), 'end'), Infinity);
		if (typeof flags.start === 'string') cuts = removeEditedRange(cuts, fps, 0, snap(parseTime(flags.start), 'start'));
		save(cuts, 'trimmed');
		break;
	}
	case 'reset':
		save(edit.sources.map((s) => ({source: s.id, from: 0, to: s.durationInSeconds})), 'reset');
		break;
	default:
		fail(`Unknown command "${cmd}"`);
}
