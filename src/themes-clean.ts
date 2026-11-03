// The "clean" corporate style: cards, one accent colour, Inter, smooth motion.
// Uses the house palette (paper/ink/yellow/marker red/card/solution/normal).
export const clean = {
	colors: {
		surface: '#FBFAF4', // card
		paper: '#ECE9DF',
		ink: '#141414',
		muted: '#5F5C55', // ink at ~65% on paper
		line: '#D9D5C8', // paper, darker
		dark: '#141414', // ink
		accent: '#FFE600', // yellow
		success: '#22C55E', // solution
		info: '#22D3EE', // normal
		danger: '#E4352B', // marker red
		white: '#FFFFFF',
	},
	// Dark translucent boxes behind text on footage.
	scrim: (alpha: number) => `rgba(20, 20, 20, ${alpha})`,
	font: 'Inter, sans-serif',
	radius: 18, // px at 1080
	shadow: (u: number) => `0 ${12 * u}px ${36 * u}px rgba(20, 20, 20, 0.22), 0 ${2 * u}px ${6 * u}px rgba(20, 20, 20, 0.12)`,
};

export type CleanColor = keyof typeof clean.colors;

// Collage colour names used in prompts map onto the clean palette.
const fromCollage: Record<string, CleanColor> = {
	yellow: 'accent',
	red: 'danger',
	solution: 'success',
	normal: 'info',
	card: 'surface',
};

export const cleanColor = (c: string | undefined, fallback: CleanColor, accent: string): string => {
	const name = c === undefined ? fallback : (fromCollage[c] ?? c);
	if (name === 'accent') return accent;
	return name in clean.colors ? clean.colors[name as CleanColor] : name;
};

// Ink or white, whichever reads better on a background colour.
export const textOn = (bg: string): string => {
	const m = bg.match(/^#([0-9a-f]{6})$/i);
	if (!m) return clean.colors.white;
	const n = parseInt(m[1], 16);
	const lum = (0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255;
	return lum > 0.6 ? clean.colors.ink : clean.colors.white;
};
