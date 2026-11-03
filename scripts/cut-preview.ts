// npm run cut-preview -- <project>
// Fast 720p preview of just the cuts (no graphics), via ffmpeg.
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
const inputs: string[] = [];
const parts: string[] = [];
const fade = 0.02;
segs.forEach((s, i) => {
	const src = edit.sources.find((x) => x.id === s.source)!;
	const start = s.srcStartFrame / fps;
	const dur = s.durationInFrames / fps;
	inputs.push('-ss', start.toFixed(3), '-t', dur.toFixed(3), '-i', path.join(dir, src.file));
	parts.push(
		`[${i}:v]setpts=PTS-STARTPTS,scale='if(gt(iw,ih),-2,720)':'if(gt(iw,ih),720,-2)',fps=${fps}[v${i}]`,
		`[${i}:a]asetpts=PTS-STARTPTS,afade=t=in:d=${fade},afade=t=out:st=${(dur - fade).toFixed(3)}:d=${fade}[a${i}]`,
	);
});
const concat = segs.map((_, i) => `[v${i}][a${i}]`).join('') + `concat=n=${segs.length}:v=1:a=1[v][a]`;
const out = path.join(dir, 'out', 'cut-preview.mp4');
run('ffmpeg', ['-y', '-v', 'error', ...inputs, '-filter_complex', [...parts, concat].join(';'), '-map', '[v]', '-map', '[a]', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '26', '-c:a', 'aac', out]);
const srt = writeEditedSrt(name);
console.log(`✓ ${path.relative(process.cwd(), out)}\n✓ ${path.relative(process.cwd(), srt)}`);
