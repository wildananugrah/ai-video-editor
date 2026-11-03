import type {Time} from './types';

export const parseTime = (t: Time): number => {
	if (typeof t === 'number') return t;
	const parts = t.trim().split(':').map(Number);
	if (parts.some((p) => Number.isNaN(p))) throw new Error(`Bad time: "${t}"`);
	return parts.reduce((acc, p) => acc * 60 + p, 0);
};

export const formatTime = (seconds: number): string => {
	const s = Math.max(0, seconds);
	const h = Math.floor(s / 3600);
	const m = Math.floor((s % 3600) / 60);
	const rest = (s % 60).toFixed(1).padStart(4, '0');
	const mm = String(m).padStart(2, '0');
	return h > 0 ? `${h}:${mm}:${rest}` : `${mm}:${rest}`;
};

export const formatSrtTime = (seconds: number): string => {
	const ms = Math.round(Math.max(0, seconds) * 1000);
	const h = Math.floor(ms / 3_600_000);
	const m = Math.floor((ms % 3_600_000) / 60_000);
	const s = Math.floor((ms % 60_000) / 1000);
	const pad = (n: number, w = 2) => String(n).padStart(w, '0');
	return `${pad(h)}:${pad(m)}:${pad(s)},${pad(ms % 1000, 3)}`;
};
