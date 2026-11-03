import assert from 'node:assert/strict';
import {test} from 'node:test';
import {alignWordsToSpeech, applySilence, editedToSource, removeEditedRange, sourceToEdited, toSegments, totalFrames, wordsInEditedTime} from './cuts';
import {formatSrtTime, formatTime, parseTime} from './time';

const fps = 30;
const cuts = [
	{source: 'a', from: '00:01.0', to: '00:03.0'},
	{source: 'a', from: '00:10.0', to: '00:11.0'},
	{source: 'b', from: 0, to: 2},
];

test('parse and format times', () => {
	assert.equal(parseTime('01:02.5'), 62.5);
	assert.equal(parseTime('1:00:00'), 3600);
	assert.equal(parseTime(4), 4);
	assert.equal(formatTime(62.5), '01:02.5');
	assert.equal(formatSrtTime(3661.25), '01:01:01,250');
	assert.throws(() => parseTime('aa:bb'));
});

test('segments are laid back to back', () => {
	const segs = toSegments(cuts, fps);
	assert.deepEqual(segs.map((s) => s.editStartFrame), [0, 60, 90]);
	assert.equal(totalFrames(segs), 150);
	assert.throws(() => toSegments([{source: 'a', from: 5, to: 4}], fps));
});

test('source <-> edited time', () => {
	const segs = toSegments(cuts, fps);
	assert.equal(sourceToEdited(segs, 'a', 2, fps), 1);
	assert.equal(sourceToEdited(segs, 'a', 10.5, fps), 2.5);
	assert.equal(sourceToEdited(segs, 'a', 5, fps), null);
	assert.equal(sourceToEdited(segs, 'b', 1, fps), 4);
	assert.deepEqual(editedToSource(segs, 2.5, fps), {source: 'a', seconds: 10.5});
	assert.deepEqual(editedToSource(segs, 5, fps), {source: 'b', seconds: 2});
	assert.equal(editedToSource(segs, 6, fps), null);
});

test('words are retimed and cut words dropped', () => {
	const segs = toSegments(cuts, fps);
	const w = (text: string, start: number, end: number) => ({text, start, end, confidence: 1});
	const out = wordsInEditedTime({a: [w('halo', 1.5, 2), w('hilang', 5, 6), w('lagi', 10.2, 10.6)]}, segs, fps);
	assert.deepEqual(out.map((x) => x.text), ['halo', 'lagi']);
	assert.ok(Math.abs(out[1].start - 2.2) < 1e-9);
});

test('removing an edited range splits cuts', () => {
	const out = removeEditedRange(cuts, fps, 1.5, 2.5);
	assert.deepEqual(out, [
		{source: 'a', from: 1, to: 2.5, note: undefined},
		{source: 'a', from: 10.5, to: 11, note: undefined},
		{source: 'b', from: 0, to: 2},
	]);
	// Spanning a whole segment drops it.
	assert.deepEqual(
		removeEditedRange(cuts, fps, 1.9, 3.1).map((c) => [c.source, c.from, c.to]),
		[
			["a", 1, 2.9],
			["b", 0.1, 2],
		],
	);
});

test('silence pass keeps manual trims', () => {
	const silences = {a: [{start: 0, end: 1.2}, {start: 3, end: 3.4}, {start: 4, end: 6}]};
	const out = applySilence([{source: 'a', from: 0.5, to: 8}], silences, {maxGap: 0.6, pad: 0.15});
	assert.deepEqual(out.map((c) => [c.from, c.to]), [
		[1.05, 4.15],
		[5.85, 8],
	]);
});

test('words drifting into pauses are moved onto the speech', () => {
	const w = (text: string, start: number, end: number) => ({text, start, end, confidence: 1});
	// Real speech: 0-1, 3-7. Whisper put "hari ini" inside the pause.
	const out = alignWordsToSpeech(
		[w('halo', 0.1, 0.9), w('hari', 1.0, 2.0), w('ini', 2.0, 3.0), w('bahas', 3.0, 7.0)],
		[{start: 1, end: 3}],
		7,
	);
	assert.deepEqual(out.map((x) => [x.text, x.start, x.end]), [
		['halo', 0.1, 0.9],
		['hari', 3, 3.667],
		['ini', 3.667, 4.333],
		['bahas', 4.333, 7],
	]);
});
