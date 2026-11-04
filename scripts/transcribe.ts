// npm run transcribe -- <project> [source-id] [--realign]
// --realign redoes word alignment from the saved Whisper output, without re-transcribing.
// Local whisper.cpp transcription (Bahasa Indonesia) with word timestamps.
// Writes transcript.json, transcript.srt (source time) and transcript.edited.srt.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {toCaptions, transcribe} from '@remotion/install-whisper-cpp';
import {alignWordsToSpeech} from '../src/lib/cuts.ts';
import {formatTime} from '../src/lib/time.ts';
import type {Word} from '../src/lib/types.ts';
import {WHISPER_DIR, WHISPER_MODEL, WHISPER_VERSION, projectDir} from './config.ts';
import {detectSilences, fail, parseArgs, readEdit, readSilences, readTranscript, run, toSrt, writeEditedSrt, writeSilences} from './lib.ts';

const LOW_CONFIDENCE = 0.4;

export const transcribeSource = async (name: string, id: string, realign = false) => {
	const edit = readEdit(name);
	const source = edit.sources.find((s) => s.id === id) ?? fail(`No source "${id}"`);
	if (!fs.existsSync(path.join(WHISPER_DIR, `ggml-${WHISPER_MODEL}.bin`))) fail('Whisper not installed: run `npm run setup` first');
	const dir = projectDir(name);
	const wav = path.join(dir, '.state', `${id}.wav`);
	fs.mkdirSync(path.dirname(wav), {recursive: true});
	run('ffmpeg', ['-y', '-v', 'error', '-i', path.join(dir, source.file), '-ar', '16000', '-ac', '1', '-c:a', 'pcm_s16le', wav]);

	const rawPath = path.join(dir, '.state', `${id}.whisper.json`);
	let out: Parameters<typeof toCaptions>[0]['whisperCppOutput'];
	if (realign) {
		if (!fs.existsSync(rawPath)) fail(`No saved Whisper output for ${id}: run transcribe without --realign`);
		out = JSON.parse(fs.readFileSync(rawPath, 'utf8'));
	} else {
		console.log(`→ transcribing ${id} (${formatTime(source.durationInSeconds)})…`);
		out = await transcribe({
			inputPath: wav,
			whisperPath: WHISPER_DIR,
			whisperCppVersion: WHISPER_VERSION,
			model: WHISPER_MODEL,
			tokenLevelTimestamps: true,
			language: 'id',
			splitOnWord: true,
			printOutput: false,
			onProgress: (p) => process.stdout.write(`\r  ${Math.round(p * 100)}%`),
		});
		process.stdout.write('\n');
		fs.writeFileSync(rawPath, JSON.stringify(out));
	}
	const silences = readSilences(name);
	if (!realign || !silences[id]) silences[id] = detectSilences(wav);
	writeSilences(name, silences);
	const raw: Word[] = toCaptions({whisperCppOutput: out})
		.captions.map((c) => ({
			text: c.text.trim(),
			start: c.startMs / 1000,
			end: c.endMs / 1000,
			confidence: Number((c.confidence ?? 1).toFixed(2)),
		}))
		.filter((w) => w.text.length > 0 && !/^\[.*\]$/.test(w.text));
	const words = alignWordsToSpeech(raw, silences[id], source.durationInSeconds);

	const transcript = readTranscript(name);
	transcript[id] = words;
	fs.writeFileSync(path.join(dir, 'transcript.json'), JSON.stringify(transcript));
	const srtName = edit.sources.length > 1 ? `transcript.${id}.srt` : 'transcript.srt';
	fs.writeFileSync(path.join(dir, srtName), toSrt(words));
	writeEditedSrt(name);

	console.log(`✓ ${words.length} words → projects/${name}/${srtName}`);
	const unsure = words.filter((w) => w.confidence < LOW_CONFIDENCE);
	if (unsure.length) {
		console.log(`! ${unsure.length} words with low confidence (check these):`);
		for (const w of unsure.slice(0, 40)) console.log(`  ${formatTime(w.start)}  "${w.text}" (${w.confidence})`);
	}
};

if (process.argv[1] === fileURLToPath(import.meta.url)) {
	const {pos, flags} = parseArgs();
	const [name, id] = pos;
	if (!name) fail('usage: npm run transcribe -- <project> [source-id] [--realign]');
	const ids = id ? [id] : readEdit(name).sources.map((s) => s.id);
	for (const s of ids) await transcribeSource(name, s, Boolean(flags.realign));
}
