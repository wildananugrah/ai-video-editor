// npm run recut -- <project>
// After the cut list changes, moves every graphic so it stays on the same words.
// Graphics whose whole range was cut out are removed and listed (saved in .state/).
import fs from 'node:fs';
import path from 'node:path';
import {editedToSource, sourceToEditedAll, toSegments} from '../src/lib/cuts.ts';
import {formatTime, parseTime} from '../src/lib/time.ts';
import type {Entry} from '../src/lib/types.ts';
import {projectDir} from './config.ts';
import {fail, parseArgs, readCutStamp, readEdit, writeCutStamp, writeEdit} from './lib.ts';

const {pos} = parseArgs();
const [name] = pos;
if (!name) fail('usage: npm run recut -- <project>');
const edit = readEdit(name);
const fps = edit.fps;
const oldCuts = readCutStamp(name);
if (!oldCuts || JSON.stringify(oldCuts) === JSON.stringify(edit.cuts)) {
	writeCutStamp(name, edit.cuts);
	console.log('✓ nothing to do: graphics already match the cuts');
	process.exit(0);
}
const oldSegs = toSegments(oldCuts, fps);
const newSegs = toSegments(edit.cuts, fps);
const map = (t: number) => {
	const src = editedToSource(oldSegs, t, fps);
	if (!src) return null;
	// A cold open can reuse a line: stay near where the graphic already was.
	const places = sourceToEditedAll(newSegs, src.source, src.seconds, fps);
	return places.length ? places.reduce((a, b) => (Math.abs(b - t) < Math.abs(a - t) ? b : a)) : null;
};
// Walk inwards one frame at a time until we land on footage that survived.
const mapInward = (from: number, to: number, dir: 1 | -1) => {
	const step = dir / fps;
	for (let t = dir === 1 ? from : to; dir === 1 ? t <= to : t >= from; t += step) {
		const m = map(t);
		if (m !== null) return m;
	}
	return null;
};

const kept: Entry[] = [];
const dropped: Entry[] = [];
for (const e of edit.entries) {
	const from = parseTime(e.from);
	const to = parseTime(e.to);
	const nf = mapInward(from, to, 1);
	const nt = mapInward(from, to, -1);
	if (nf === null || nt === null || nt - nf < 2 / fps) {
		dropped.push(e);
		continue;
	}
	if (nf !== map(from) || nt !== map(to)) console.log(`! ${e.type} ${e.from}–${e.to}: part of its range was cut, shortened`);
	kept.push({...e, from: formatTime(nf), to: formatTime(nt)});
}
edit.entries = kept;
writeEdit(name, edit);
writeCutStamp(name, edit.cuts);
console.log(`✓ moved ${kept.length} graphics`);
if (dropped.length) {
	const p = path.join(projectDir(name), '.state', `removed-entries-${Date.now()}.json`);
	fs.writeFileSync(p, JSON.stringify(dropped, null, '\t'));
	console.log(`! ${dropped.length} graphics were on footage that's now cut, removed (saved in ${path.relative(process.cwd(), p)}):`);
	for (const e of dropped) console.log(`  ${e.type} ${e.from}–${e.to} ${JSON.stringify(e).slice(0, 80)}`);
}
