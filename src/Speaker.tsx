// The speaker footage, reframed by any active zoom or split entry.
import React from 'react';
import {AbsoluteFill, Easing, interpolate, useCurrentFrame} from 'remotion';
import {useBox} from './context';
import {FootageSegments} from './Footage';
import {splitAmount} from './pieces/split';
import {TimedEntry, activeAt} from './timing';

const zoomScale = (z: TimedEntry, frame: number) => {
	const scale = (z.props.scale as number | undefined) ?? 1.25;
	const local = frame - z.startFrame;
	if (z.props.style === 'push') {
		return interpolate(local, [0, z.durationInFrames], [1, scale], {easing: Easing.inOut(Easing.quad)});
	}
	return interpolate(local, [0, 2, z.durationInFrames - 2, z.durationInFrames], [1, scale, scale, 1], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
};

export const Speaker: React.FC<{entries: TimedEntry[]}> = ({entries}) => {
	const frame = useCurrentFrame();
	const box = useBox();
	const zoom = activeAt(entries, 'zoom', frame);
	const split = activeAt(entries, 'split', frame);

	let rect = {left: 0, top: 0, width: box.width, height: box.height};
	let focusX = 0.5;
	if (split) {
		const t = splitAmount(frame - split.startFrame, split.durationInFrames);
		const first = (split.props.side ?? 'left') === 'left';
		focusX = (split.props.focusX as number | undefined) ?? 0.5;
		if (box.vertical) {
			const h = interpolate(t, [0, 1], [box.height, box.height / 2]);
			rect = {left: 0, width: box.width, height: h, top: first ? 0 : box.height - h};
		} else {
			const w = interpolate(t, [0, 1], [box.width, box.width / 2]);
			rect = {top: 0, height: box.height, width: w, left: first ? 0 : box.width - w};
		}
	}
	const scale = zoom ? zoomScale(zoom, frame) : 1;
	const zx = ((zoom?.props.x as number | undefined) ?? 0.5) * 100;
	const zy = ((zoom?.props.y as number | undefined) ?? 0.4) * 100;
	return (
		<AbsoluteFill>
			<div style={{position: 'absolute', overflow: 'hidden', ...rect}}>
				<div style={{position: 'absolute', inset: 0, transform: `scale(${scale})`, transformOrigin: `${zx}% ${zy}%`}}>
					<FootageSegments objectPosition={`${focusX * 100}% 50%`} />
				</div>
			</div>
		</AbsoluteFill>
	);
};
