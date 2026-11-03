// npm run still -- <project> <time> [<time> ...] [--scale 0.5]
// Renders single frames (edited time) to projects/<project>/out/still-<time>.png.
import path from 'node:path';
import {renderStill, selectComposition} from '@remotion/renderer';
import {parseTime} from '../src/lib/time.ts';
import {BROWSER, projectDir} from './config.ts';
import {getBundle} from './bundle.ts';
import {cutsChangedSinceEntries, fail, parseArgs, readEdit} from './lib.ts';

const {pos, flags} = parseArgs();
const [name, ...times] = pos;
if (!name || times.length === 0) fail('usage: npm run still -- <project> <time> [<time> ...] [--scale 0.5]');
const edit = readEdit(name);
if (cutsChangedSinceEntries(name, edit)) fail(`cuts changed since graphics were placed: run \`npm run recut -- ${name}\` first`);
const scale = typeof flags.scale === 'string' ? Number(flags.scale) : 0.5;
const serveUrl = await getBundle();
const inputProps = {project: name};
const composition = await selectComposition({serveUrl, id: 'Edit', inputProps, browserExecutable: BROWSER});
for (const t of times) {
	const frame = Math.min(composition.durationInFrames - 1, Math.round(parseTime(t) * composition.fps));
	const output = path.join(projectDir(name), 'out', `still-${t.replace(/:/g, '-')}.png`);
	await renderStill({browserExecutable: BROWSER, serveUrl, composition, inputProps, frame, output, scale, imageFormat: 'png'});
	console.log(`✓ ${path.relative(process.cwd(), output)}`);
}
