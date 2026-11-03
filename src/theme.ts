// The house style. Every piece reads from here.
export const colors = {
	paper: '#ECE9DF',
	ink: '#141414',
	yellow: '#FFE600',
	red: '#E4352B',
	card: '#FBFAF4',
	solution: '#22C55E',
	normal: '#22D3EE',
	white: '#FFFFFF',
} as const;

export type ColorName = keyof typeof colors;

// Accepts a theme colour name or any CSS colour.
export const color = (c: string | undefined, fallback: ColorName): string =>
	c === undefined ? colors[fallback] : c in colors ? colors[c as ColorName] : c;

export const fonts = {
	title: '"Barlow Condensed", sans-serif', // 800/900 uppercase
	caption: 'Archivo, sans-serif', // 600
	quote: 'Newsreader, serif', // italic
	label: '"Courier Prime", monospace',
	hand: '"Caveat Brush", cursive',
} as const;

export const texture = {
	jitterFps: 6,
	jitterPx: 3, // at 1080 short side
	jitterDeg: 0.6,
	grain: 0.07,
	vignette: 0.35,
};

// Fractions of the frame kept clear of platform UI.
export const safeArea = (vertical: boolean) =>
	vertical
		? {top: 0.12, bottom: 0.2, left: 0.05, right: 0.15}
		: {top: 0.06, bottom: 0.08, left: 0.05, right: 0.05};

export const isVertical = (width: number, height: number) => height > width * 1.1;
