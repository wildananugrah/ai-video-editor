// npm run render -- <project> [--preview] [--from t] [--to t]
// Full-quality MP4 at the source size, or --preview at half resolution.
// --from/--to render just a section (edited time).
import path from 'node:path';
import {renderMedia, selectComposition} from '@remotion/renderer';
import {formatTime, parseTime} from '../src/lib/time.ts';
import {BROWSER, projectDir} from './config.ts';
import {getBundle} from './bundle.ts';
import {cutsChangedSinceEntries, fail, parseArgs, readEdit} from './lib.ts';

const {pos, flags} = parseArgs();
const [name] = pos;
if (!name) fail('usage: npm run render -- <project> [--preview] [--from t] [--to t]');
const edit = readEdit(name);
if (cutsChangedSinceEntries(name, edit)) fail(`cuts changed since graphics were placed: run \`npm run recut -- ${name}\` first`);
const preview = Boolean(flags.preview);
const serveUrl = await getBundle();
const inputProps = {project: name};
const composition = await selectComposition({serveUrl, id: 'Edit', inputProps, browserExecutable: BROWSER});
const last = composition.durationInFrames - 1;
const from = typeof flags.from === 'string' ? Math.round(parseTime(flags.from) * composition.fps) : 0;
const to = typeof flags.to === 'string' ? Math.min(last, Math.round(parseTime(flags.to) * composition.fps)) : last;
const section = from > 0 || to < last ? `-${formatTime(from / composition.fps)}-${formatTime(to / composition.fps)}`.replace(/:/g, '.') : '';
const output = path.join(projectDir(name), 'out', `${name}${preview ? '-preview' : ''}${section}.mp4`);

const started = Date.now();
let lastLog = 0;
await renderMedia({
	browserExecutable: BROWSER,
	serveUrl,
	composition,
	inputProps,
	codec: 'h264',
	crf: preview ? 26 : 17,
	concurrency: typeof flags.concurrency === 'string' ? Number(flags.concurrency) : null,
	scale: preview ? 0.5 : 1,
	frameRange: [from, to],
	outputLocation: output,
	onProgress: ({progress}) => {
		if (Date.now() - lastLog > 3000) {
			lastLog = Date.now();
			console.log(`  ${Math.round(progress * 100)}%`);
		}
	},
});
console.log(`✓ ${path.relative(process.cwd(), output)} (${((Date.now() - started) / 1000).toFixed(0)}s)`);
