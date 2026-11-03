// One-time setup: whisper.cpp + model, the Python env for stickers, built-in SFX.
import fs from 'node:fs';
import path from 'node:path';
import {downloadWhisperModel, installWhisperCpp} from '@remotion/install-whisper-cpp';
import {ROOT, WHISPER_DIR, WHISPER_MODEL, WHISPER_VERSION} from './config.ts';
import {run} from './lib.ts';

await installWhisperCpp({to: WHISPER_DIR, version: WHISPER_VERSION});
await downloadWhisperModel({folder: WHISPER_DIR, model: WHISPER_MODEL});
console.log('✓ whisper');

const venv = path.join(ROOT, '.venv');
if (!fs.existsSync(path.join(venv, 'bin', 'python'))) run('python3', ['-m', 'venv', venv]);
run(path.join(venv, 'bin', 'pip'), ['install', '-q', 'rembg[cpu]', 'pillow']);
run(path.join(venv, 'bin', 'python'), ['-I', '-c', "from rembg import new_session; new_session('isnet-general-use')"], true);
console.log('✓ sticker env');

await import('./make-sfx.ts');
