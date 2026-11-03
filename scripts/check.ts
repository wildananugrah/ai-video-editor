// npm run check -- <project> [--list]
// Validates edit.json (pieces, props, times, asset files) without rendering.
// --list prints the timeline compactly.
import fs from 'node:fs';
import path from 'node:path';
import {toSegments, totalFrames} from '../src/lib/cuts.ts';
import {formatTime, parseTime} from '../src/lib/time.ts';
import {childSchema} from '../src/pieces/child.ts';
import {pieces} from '../src/pieces/index.ts';
import {builtInSounds} from '../src/pieces/sfx.tsx';
import {projectDir} from './config.ts';
import {cutsChangedSinceEntries, fail, parseArgs, readEdit} from './lib.ts';

const {pos, flags} = parseArgs();
const [name] = pos;
if (!name) fail('usage: npm run check -- <project> [--list]');
const edit = readEdit(name);
const dir = projectDir(name);
const errors: string[] = [];

if (edit.style !== undefined && !['collage', 'clean'].includes(edit.style)) errors.push(`style must be "collage" or "clean"`);
for (const s of edit.sources) if (!fs.existsSync(path.join(dir, s.file))) errors.push(`source ${s.id}: ${s.file} missing`);
let duration = 0;
try {
	const segs = toSegments(edit.cuts, edit.fps);
	duration = totalFrames(segs) / edit.fps;
	for (const c of edit.cuts) {
		const s = edit.sources.find((x) => x.id === c.source);
		if (!s) errors.push(`cut uses unknown source "${c.source}"`);
		else if (parseTime(c.to) > s.durationInSeconds + 0.05) errors.push(`cut ${c.from}–${c.to} goes past the end of ${s.id}`);
	}
} catch (e) {
	errors.push((e as Error).message);
}

const checkFiles = (where: string, type: string, props: Record<string, unknown>) => {
	for (const key of ['src', 'speakerSrc']) {
		const v = props[key];
		if (typeof v === 'string' && !fs.existsSync(path.join(dir, v))) errors.push(`${where}: ${key} "${v}" not found in projects/${name}/`);
	}
	const sticker = type === 'sticker' ? props.src : props.speakerSrc;
	if ((edit.style ?? 'collage') === 'collage' && typeof sticker === 'string' && !sticker.endsWith('-sticker.png')) {
		errors.push(`${where}: "${sticker}" isn't a processed sticker. Run \`npm run sticker -- ${name} ${sticker}\` and use the -sticker.png it makes`);
	}
	if (typeof props.sound === 'string' && !(builtInSounds as readonly string[]).includes(props.sound) && !fs.existsSync(path.join(dir, props.sound))) {
		errors.push(`${where}: sound "${props.sound}" is not built in (${builtInSounds.join(', ')}) and not a file`);
	}
};

const checkPiece = (where: string, type: string, props: Record<string, unknown>) => {
	const piece = pieces[type];
	if (!piece) return errors.push(`${where}: unknown type "${type}" (known: ${Object.keys(pieces).join(', ')})`);
	const r = piece.schema.safeParse(props);
	if (!r.success) {
		for (const issue of r.error.issues) errors.push(`${where}: ${issue.path.join('.') || '(props)'}: ${issue.message}`);
	}
	checkFiles(where, type, props);
	const children = props.children;
	if (Array.isArray(children)) {
		children.forEach((c, i) => {
			const parsed = childSchema.safeParse(c);
			if (!parsed.success) return errors.push(`${where}.children[${i}]: needs a "type"`);
			const {type: ct, delay, duration: d, ...rest} = parsed.data;
			checkPiece(`${where}.children[${i}] ${ct}`, ct, rest);
		});
	}
};

edit.entries.forEach((e, i) => {
	const {type, from, to, ...props} = e;
	const where = `entries[${i}] ${type} ${from}`;
	try {
		const f = parseTime(from);
		const t = parseTime(to);
		if (t <= f) errors.push(`${where}: "to" must be after "from"`);
		if (f > duration + 0.05) errors.push(`${where}: starts after the video ends (${formatTime(duration)})`);
	} catch (err) {
		errors.push(`${where}: ${(err as Error).message}`);
	}
	checkPiece(where, type, props);
});

if (cutsChangedSinceEntries(name, edit)) errors.push(`cuts changed since graphics were placed: run \`npm run recut -- ${name}\``);

if (flags.list) {
	edit.entries.forEach((e, i) => {
		const {type, from, to, ...props} = e;
		const label = String(props.text ?? props.title ?? props.label ?? props.src ?? props.sound ?? props.shape ?? '');
		console.log(`${String(i).padStart(3)}  ${from}–${to}  ${type}${label ? `  ${label.replace(/\n/g, ' / ').slice(0, 50)}` : ''}`);
	});
}
if (errors.length) {
	for (const e of errors) console.error(`✗ ${e}`);
	process.exit(1);
}
console.log(`✓ ${name}: ${edit.width}x${edit.height} @ ${edit.fps}fps, ${formatTime(duration)}, ${edit.cuts.length} cuts, ${edit.entries.length} entries`);
