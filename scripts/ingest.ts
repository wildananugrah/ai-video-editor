// npm run ingest -- <video> <project> [--append]
// Creates projects/<project>/, keeps the original, makes a constant-frame-rate
// H.264 working copy, then transcribes. --append adds another recording to an
// existing project (played after the previous ones).
import fs from 'node:fs';
import path from 'node:path';
import type {EditFile} from '../src/lib/types.ts';
import {projectDir} from './config.ts';
import {editPath, fail, parseArgs, probe, readEdit, run, standardFps, writeEdit} from './lib.ts';
import {transcribeSource} from './transcribe.ts';

const {pos, flags} = parseArgs();
const [input, name] = pos;
if (!input || !name) fail('usage: npm run ingest -- <video> <project> [--append]');
if (!fs.existsSync(input)) fail(`${input} not found`);

const dir = projectDir(name);
const exists = fs.existsSync(editPath(name));
if (exists && !flags.append) fail(`Project "${name}" exists. Use --append to add a recording to it.`);
if (!exists && flags.append) fail(`Project "${name}" doesn't exist yet.`);

const edit: EditFile | null = exists ? readEdit(name) : null;
const id = `s${(edit?.sources.length ?? 0) + 1}`;
fs.mkdirSync(path.join(dir, 'source'), {recursive: true});
fs.mkdirSync(path.join(dir, 'assets'), {recursive: true});
fs.mkdirSync(path.join(dir, 'out'), {recursive: true});

const original = `source/${id}-original${path.extname(input).toLowerCase()}`;
fs.copyFileSync(input, path.join(dir, original), fs.constants.COPYFILE_FICLONE);

const info = probe(input);
const fps = edit?.fps ?? standardFps(info.fps);
const width = edit?.width ?? info.width - (info.width % 2);
const height = edit?.height ?? info.height - (info.height % 2);
console.log(`→ ${info.width}x${info.height} @ ${info.fps.toFixed(2)}fps, ${info.duration.toFixed(1)}s${info.hdr ? ', HDR' : ''}`);

const filters: string[] = [];
if (info.hdr) {
	// No proper tone mapping in this ffmpeg build: approximate BT.2020 -> BT.709.
	console.warn('! HDR footage: colours are converted approximately. For best results record in SDR (iPhone: Settings > Camera > Formats > HDR Video off).');
	filters.push('colorspace=all=bt709:iall=bt2020:itrc=bt2020-10:fast=1');
}
// Appended recordings are fitted into the first one's frame.
filters.push(`scale=${width}:${height}:force_original_aspect_ratio=decrease`, `pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2`, 'format=yuv420p');

const work = `source/${id}.mp4`;
console.log('→ making working copy…');
run('ffmpeg', [
	'-y', '-v', 'error',
	'-i', input,
	'-vf', filters.join(','),
	'-fps_mode', 'cfr', '-r', String(fps),
	'-c:v', 'libx264', '-preset', 'fast', '-crf', '16', '-g', String(fps),
	'-color_primaries', 'bt709', '-color_trc', 'bt709', '-colorspace', 'bt709',
	...(info.hasAudio ? ['-c:a', 'aac', '-b:a', '192k', '-ar', '48000'] : ['-f', 'lavfi', '-i', 'anullsrc=r=48000:cl=stereo', '-shortest', '-c:a', 'aac']),
	'-movflags', '+faststart',
	path.join(dir, work),
]);

const duration = probe(path.join(dir, work)).duration;
const next: EditFile = edit ?? {width, height, fps, sources: [], cuts: [], entries: []};
next.sources.push({id, file: work, original, durationInSeconds: duration});
next.cuts.push({source: id, from: 0, to: Number(duration.toFixed(3))});
writeEdit(name, next);
console.log(`✓ projects/${name}/edit.json (${width}x${height} @ ${fps}fps, source ${id})`);

await transcribeSource(name, id);
