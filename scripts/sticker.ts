// npm run sticker -- <project> <image> [--no-cutout]
// Cuts out the subject (local rembg), makes it high-contrast black and white with
// a white sticker outline, and saves assets/<name>-sticker.png in the project.
import fs from 'node:fs';
import path from 'node:path';
import {ROOT, projectDir} from './config.ts';
import {fail, parseArgs, run} from './lib.ts';

const {pos, flags} = parseArgs();
const [name, image] = pos;
if (!name || !image) fail('usage: npm run sticker -- <project> <image> [--no-cutout]');
const dir = projectDir(name);
const input = fs.existsSync(image) ? image : path.join(dir, image);
if (!fs.existsSync(input)) fail(`${image} not found`);
const python = path.join(ROOT, '.venv', 'bin', 'python');
if (!fs.existsSync(python)) fail('Python env missing: run `npm run setup`');
const out = path.join(dir, 'assets', `${path.parse(input).name}-sticker.png`);
fs.mkdirSync(path.dirname(out), {recursive: true});
run(python, ['-I', path.join(ROOT, 'scripts', 'sticker.py'), input, out, ...(flags['no-cutout'] ? ['--no-cutout'] : [])]);
console.log(`✓ assets/${path.basename(out)}  (use as "src" in a sticker entry)`);
