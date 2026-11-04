// npm run cut-preview -- <project>
// Fast 720p preview of just the cuts (no graphics), via ffmpeg. Segments are encoded
// one at a time and joined, so long videos with hundreds of cuts work.
import fs from 'node:fs';
import path from 'node:path';
import {toSegments} from '../src/lib/cuts.ts';
import {projectDir} from './config.ts';
import {fail, parseArgs, readEdit, run, writeEditedSrt} from './lib.ts';

const {pos} = parseArgs();
const [name] = pos;
if (!name) fail('usage: npm run cut-preview -- <project>');
const edit = readEdit(name);
const fps = edit.fps;
const segs = toSegments(edit.cuts, fps);
const dir = projectDir(name);
const tmp = path.join(dir, '.state', 'cut-preview');
fs.rmSync(tmp, {recursive: true, force: true});
fs.mkdirSync(tmp, {recursive: true});
const fade = 0.02;
const list: string[] = [];
segs.forEach((s, i) => {
	const src = edit.sources.find((x) => x.id === s.source)!;
	const dur = s.durationInFrames / fps;
	const file = path.join(tmp, `${String(i).padStart(4, '0')}.ts`);
	run('ffmpeg', [
		'-y', '-v', 'error',
		'-ss', (s.srcStartFrame / fps).toFixed(3), '-t', dur.toFixed(3), '-i', path.join(dir, src.file),
		'-vf', `scale='if(gt(iw,ih),-2,720)':'if(gt(iw,ih),720,-2)',fps=${fps}`,
		'-af', `afade=t=in:d=${fade},afade=t=out:st=${(dur - fade).toFixed(3)}:d=${fade}`,
		'-c:v', 'libx264', '-preset', 'veryfast', '-crf', '26', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-ar', '48000', '-ac', '2',
		file,
	]);
	list.push(`file '${file}'`);
});
const listFile = path.join(tmp, 'list.txt');
fs.writeFileSync(listFile, list.join('\n'));
const out = path.join(dir, 'out', 'cut-preview.mp4');
run('ffmpeg', ['-y', '-v', 'error', '-f', 'concat', '-safe', '0', '-i', listFile, '-c', 'copy', '-movflags', '+faststart', out]);
fs.rmSync(tmp, {recursive: true, force: true});
const srt = writeEditedSrt(name);
console.log(`✓ ${path.relative(process.cwd(), out)}\n✓ ${path.relative(process.cwd(), srt)}`);
