// Every piece type usable in edit.json. Add new pieces here.
import type React from 'react';
import type {z} from 'zod';
import * as badge from './badge';
import * as caption from './caption';
import * as card from './card';
import * as fade from './fade';
import * as highlight from './highlight';
import * as image from './image';
import * as keyword from './keyword';
import * as lowerthird from './lowerthird';
import * as marker from './marker';
import * as note from './note';
import * as quote from './quote';
import * as scene from './scene';
import * as sfx from './sfx';
import * as spectrum from './spectrum';
import * as split from './split';
import * as stamp from './stamp';
import * as sticker from './sticker';
import * as tape from './tape';
import * as zoom from './zoom';
import * as cleanCaption from './clean/caption';
import * as cleanCard from './clean/card';
import * as cleanKeyword from './clean/keyword';
import * as cleanNote from './clean/note';
import * as cleanQuote from './clean/quote';
import * as cleanSpectrum from './clean/spectrum';
import * as cleanStamp from './clean/stamp';
import * as cleanTape from './clean/tape';
import type {StyleName} from '../lib/types';

type Piece = {schema: z.ZodTypeAny; Component: React.FC<any>};

export const pieces: Record<string, Piece> = {
	keyword,
	card,
	spectrum,
	split,
	zoom,
	image,
	sticker,
	stamp,
	marker,
	highlight,
	badge,
	quote,
	note,
	caption,
	scene,
	sfx,
	tape,
	fade,
	lowerthird,
};

// Pieces that look different in the clean style. They share the collage schema,
// so the same entry works in both. Pieces not listed adapt in place.
const cleanPieces: Record<string, Piece> = {
	keyword: cleanKeyword,
	card: cleanCard,
	spectrum: cleanSpectrum,
	stamp: cleanStamp,
	tape: cleanTape,
	quote: cleanQuote,
	note: cleanNote,
	caption: cleanCaption,
};

export const getPiece = (type: string, style: StyleName = 'collage'): Piece => {
	const piece = (style === 'clean' ? cleanPieces[type] : undefined) ?? pieces[type];
	if (!piece) throw new Error(`Unknown piece type "${type}". Known: ${Object.keys(pieces).join(', ')}`);
	return piece;
};
