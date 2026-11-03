// Film grain and a light vignette over the whole frame.
import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {useStyleName} from './context';
import {texture} from './theme';

export const Texture: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const seed = Math.floor((frame * 12) / fps) % 50; // grain changes 12x a second
	if (useStyleName() === 'clean') {
		return <AbsoluteFill style={{pointerEvents: 'none', background: 'radial-gradient(ellipse at center, transparent 65%, rgba(0,0,0,0.12) 100%)'}} />;
	}
	return (
		<AbsoluteFill style={{pointerEvents: 'none'}}>
			<AbsoluteFill
				style={{background: `radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,${texture.vignette}) 100%)`}}
			/>
			<svg width="100%" height="100%" style={{position: 'absolute', inset: 0, opacity: texture.grain, mixBlendMode: 'overlay'}}>
				<filter id="grain">
					<feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={2} seed={seed} stitchTiles="stitch" />
					<feColorMatrix type="saturate" values="0" />
				</filter>
				<rect width="100%" height="100%" filter="url(#grain)" />
			</svg>
		</AbsoluteFill>
	);
};
