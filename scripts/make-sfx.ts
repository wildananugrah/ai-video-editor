// Generates the built-in sound effects into projects/_shared/sfx/ (synthesised, license-free).
import fs from 'node:fs';
import path from 'node:path';
import {PROJECTS_DIR} from './config.ts';
import {run} from './lib.ts';

const dir = path.join(PROJECTS_DIR, '_shared', 'sfx');
fs.mkdirSync(dir, {recursive: true});
const sounds: Record<string, string[]> = {
	whoosh: ['-f', 'lavfi', '-i', 'anoisesrc=d=0.5:c=pink:a=0.6', '-af', 'highpass=f=500,lowpass=f=5000,afade=t=in:d=0.22,afade=t=out:st=0.25:d=0.25'],
	pop: ['-f', 'lavfi', '-i', "aevalsrc='0.8*sin(2*PI*(500+1800*exp(-40*t))*t)*exp(-28*t)':d=0.18"],
	stamp: ['-f', 'lavfi', '-i', "aevalsrc='0.9*sin(2*PI*(55+140*exp(-30*t))*t)*exp(-11*t)+0.35*(random(0)*2-1)*exp(-70*t)':d=0.45"],
	click: ['-f', 'lavfi', '-i', "aevalsrc='0.7*(random(0)*2-1)*exp(-350*t)':d=0.05"],
	riser: ['-f', 'lavfi', '-i', "aevalsrc='0.5*sin(2*PI*(180*t+500*t*t))*t/1.2':d=1.2", '-af', 'afade=t=out:st=1.1:d=0.1'],
	ding: ['-f', 'lavfi', '-i', "aevalsrc='0.6*sin(2*PI*1320*t)*exp(-4*t)+0.25*sin(2*PI*2640*t)*exp(-6*t)':d=1.2"],
};
for (const [name, args] of Object.entries(sounds)) {
	run('ffmpeg', ['-y', '-v', 'error', ...args, '-ar', '48000', '-ac', '2', path.join(dir, `${name}.wav`)]);
}
console.log(`✓ ${Object.keys(sounds).length} sounds in projects/_shared/sfx/`);
