// npm run srt -- <project> [--from mm:ss] [--to mm:ss] [--source]
// Prints what's said in a time range (edited time by default), one cue per
// line, so only the relevant part of the transcript needs reading.
import {toSegments, wordsInEditedTime} from '../src/lib/cuts.ts';
import {formatTime, parseTime} from '../src/lib/time.ts';
import {fail, parseArgs, readEdit, readTranscript, wordsToCues, writeEditedSrt} from './lib.ts';

const {pos, flags} = parseArgs();
const [name] = pos;
if (!name) fail('usage: npm run srt -- <project> [--from mm:ss] [--to mm:ss] [--source] [--words]');
const edit = readEdit(name);
const transcript = readTranscript(name);
const words = flags.source
	? edit.sources.flatMap((s) => transcript[s.id] ?? [])
	: wordsInEditedTime(transcript, toSegments(edit.cuts, edit.fps), edit.fps);
const from = typeof flags.from === 'string' ? parseTime(flags.from) : 0;
const to = typeof flags.to === 'string' ? parseTime(flags.to) : Infinity;
const inRange = words.filter((w) => w.end >= from && w.start <= to);
if (flags.words) {
	for (const w of inRange) console.log(`${formatTime(w.start)}–${formatTime(w.end)}  ${w.text}${w.confidence < 0.4 ? '  (?)' : ''}`);
} else {
	for (const c of wordsToCues(inRange)) console.log(`${formatTime(c.start)}–${formatTime(c.end)}  ${c.text}`);
}
if (!flags.source) writeEditedSrt(name);
