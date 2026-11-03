import fs from 'node:fs';
import path from 'node:path';

export const ROOT = path.resolve(import.meta.dirname, '..');
export const PROJECTS_DIR = path.join(ROOT, 'projects');
export const WHISPER_DIR = path.join(ROOT, '.whisper');
export const WHISPER_VERSION = '1.7.6';
// large-v3-turbo: large-v3 accuracy class, much faster on an M1.
export const WHISPER_MODEL = 'large-v3-turbo' as const;

export const projectDir = (name: string) => path.join(PROJECTS_DIR, name);

// Remotion's downloaded headless shell crashes on this macOS version; use the
// installed Chrome when present. Override with REMOTION_BROWSER.
const SYSTEM_CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
export const BROWSER: string | null = process.env.REMOTION_BROWSER ?? (fs.existsSync(SYSTEM_CHROME) ? SYSTEM_CHROME : null);
