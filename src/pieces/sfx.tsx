// A sound effect. Built-ins live in projects/_shared/sfx/.
import React from 'react';
import {Audio, staticFile} from 'remotion';
import {z} from 'zod';
import {useEdit} from '../context';

export const builtInSounds = ['whoosh', 'pop', 'stamp', 'click', 'riser', 'ding'] as const;

export const schema = z
	.object({
		sound: z.string(), // a built-in name, or a file in the project ("assets/boom.mp3")
		volume: z.number().min(0).max(2).optional(), // default 0.7
	})
	.strict();

export const soundPath = (project: string, sound: string) =>
	(builtInSounds as readonly string[]).includes(sound) ? `_shared/sfx/${sound}.wav` : `${project}/${sound}`;

export const Component: React.FC<{p: z.infer<typeof schema>}> = ({p}) => {
	const {project} = useEdit();
	return <Audio src={staticFile(soundPath(project, p.sound))} volume={p.volume ?? 0.7} />;
};
