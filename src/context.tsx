import React, {createContext, useContext} from 'react';
import {useVideoConfig} from 'remotion';
import {safeArea, isVertical} from './theme';
import type {Segment} from './lib/cuts';
import type {EditFile, StyleName, Word} from './lib/types';

export type EditData = {
	project: string;
	edit: EditFile;
	segments: Segment[];
	words: Word[]; // edited time
};

export const EditContext = createContext<EditData | null>(null);

// Style of the current project; 'collage' outside an edit (e.g. in tests).
export const useStyleName = (): StyleName => useContext(EditContext)?.edit.style ?? 'collage';

export const useEdit = () => {
	const ctx = useContext(EditContext);
	if (!ctx) throw new Error('EditContext missing');
	return ctx;
};

// The area a piece is laid out in: the whole frame, or a panel inside it.
export type Box = {
	width: number;
	height: number;
	vertical: boolean;
	pad: {top: number; bottom: number; left: number; right: number}; // px
};

export const BoxContext = createContext<Box | null>(null);

export const useBox = (): Box => {
	const ctx = useContext(BoxContext);
	const {width, height} = useVideoConfig();
	if (ctx) return ctx;
	const v = isVertical(width, height);
	const s = safeArea(v);
	return {
		width,
		height,
		vertical: v,
		pad: {top: s.top * height, bottom: s.bottom * height, left: s.left * width, right: s.right * width},
	};
};

// Size unit: 1 at 1080px on the short side, so pieces look the same in every format.
export const useUnit = () => {
	const {width, height} = useVideoConfig();
	return Math.min(width, height) / 1080;
};

export const BoxProvider: React.FC<{box: Box; children: React.ReactNode}> = ({box, children}) => (
	<BoxContext.Provider value={box}>{children}</BoxContext.Provider>
);
