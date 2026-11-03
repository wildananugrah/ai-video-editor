// Renders pieces nested inside a split panel or collage scene.
import React from 'react';
import {Sequence, useVideoConfig} from 'remotion';
import {useEdit} from './context';
import {getPiece} from './pieces';
import type {Child} from './pieces/child';

export const Children: React.FC<{items: Child[]; parentStart: number; parentDuration: number}> = ({
	items,
	parentStart,
	parentDuration,
}) => {
	const {fps} = useVideoConfig();
	const {edit} = useEdit();
	return (
		<>
			{items.map((c, i) => {
				const {type, delay = 0, duration, ...props} = c;
				const piece = getPiece(type, edit.style);
				const from = Math.round(delay * fps);
				const dur = Math.max(1, Math.min(parentDuration - from, duration ? Math.round(duration * fps) : Infinity));
				const Comp = piece.Component as React.FC<any>;
				return (
					<Sequence key={i} from={from} durationInFrames={dur} name={type}>
						<Comp p={piece.schema.parse(props)} durationInFrames={dur} startFrame={parentStart + from} />
					</Sequence>
				);
			})}
		</>
	);
};
