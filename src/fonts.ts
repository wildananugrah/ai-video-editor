import '@fontsource/barlow-condensed/800.css';
import '@fontsource/barlow-condensed/900.css';
import '@fontsource/archivo/600.css';
import '@fontsource/newsreader/400-italic.css';
import '@fontsource/newsreader/600-italic.css';
import '@fontsource/courier-prime/400.css';
import '@fontsource/courier-prime/700.css';
import '@fontsource/caveat-brush/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/500-italic.css';
import '@fontsource/inter/600.css';
import '@fontsource/inter/700.css';
import '@fontsource/inter/800.css';
import {continueRender, delayRender} from 'remotion';

const faces = [
	'800 40px "Barlow Condensed"',
	'900 40px "Barlow Condensed"',
	'600 40px Archivo',
	'italic 400 40px Newsreader',
	'italic 600 40px Newsreader',
	'400 40px "Courier Prime"',
	'700 40px "Courier Prime"',
	'400 40px "Caveat Brush"',
	'500 40px Inter',
	'italic 500 40px Inter',
	'600 40px Inter',
	'700 40px Inter',
	'800 40px Inter',
];

const handle = delayRender('Loading fonts');
Promise.all(faces.map((f) => document.fonts.load(f)))
	.then(() => continueRender(handle))
	.catch((err) => {
		console.error(err);
		continueRender(handle);
	});
