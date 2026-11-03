// Bundles the Remotion project once and reuses it until src/ changes.
import fs from 'node:fs';
import path from 'node:path';
import {bundle} from '@remotion/bundler';
import {PROJECTS_DIR, ROOT} from './config.ts';

const newestMtime = (dir: string): number =>
	fs
		.readdirSync(dir, {withFileTypes: true})
		.map((d) => (d.isDirectory() ? newestMtime(path.join(dir, d.name)) : fs.statSync(path.join(dir, d.name)).mtimeMs))
		.reduce((a, b) => Math.max(a, b), 0);

export const getBundle = async () => {
	const out = path.join(ROOT, '.cache', 'bundle');
	const stampFile = path.join(ROOT, '.cache', 'bundle.stamp');
	const stamp = String(Math.max(newestMtime(path.join(ROOT, 'src')), fs.statSync(path.join(ROOT, 'package.json')).mtimeMs));
	if (fs.existsSync(path.join(out, 'index.html')) && fs.existsSync(stampFile) && fs.readFileSync(stampFile, 'utf8') === stamp) {
		return out;
	}
	console.log('→ bundling…');
	fs.rmSync(out, {recursive: true, force: true});
	await bundle({
		entryPoint: path.join(ROOT, 'src', 'index.ts'),
		outDir: out,
		publicDir: PROJECTS_DIR,
		symlinkPublicDir: true, // don't copy gigabytes of footage
	});
	fs.writeFileSync(stampFile, stamp);
	return out;
};
