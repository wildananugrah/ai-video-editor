import fs from 'node:fs';
import {Config} from '@remotion/cli/config';

Config.setEntryPoint('src/index.ts');
Config.setPublicDir('./projects');
Config.setVideoImageFormat('jpeg');

// Remotion's downloaded headless shell crashes on this macOS version.
const chrome = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
if (fs.existsSync(chrome)) Config.setBrowserExecutable(chrome);
