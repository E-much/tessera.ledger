import React from 'react';
import {Composition, Folder} from 'remotion';
import {TesseraDemo} from './TesseraDemo';
import './theme';

export const RemotionRoot: React.FC = () => (
	<Folder name="Tessera">
		<Composition
			id="TesseraDemo-Landscape"
			component={TesseraDemo}
			durationInFrames={900}
			fps={30}
			width={1920}
			height={1080}
		/>
		<Composition
			id="TesseraDemo-Portrait"
			component={TesseraDemo}
			durationInFrames={900}
			fps={30}
			width={1080}
			height={1920}
		/>
	</Folder>
);
