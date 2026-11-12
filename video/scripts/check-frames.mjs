// Renders a contact sheet of stills for visual QA.
// Usage: node scripts/check-frames.mjs <outDir> <frame,frame,...> [Landscape|Portrait|both]
import {bundle} from '@remotion/bundler';
import {renderStill, selectComposition} from '@remotion/renderer';
import {existsSync, mkdirSync} from 'node:fs';
import {globSync} from 'node:fs';
import path from 'node:path';

const [outDir, framesArg, which = 'both'] = process.argv.slice(2);
const frames = framesArg.split(',').map(Number);
mkdirSync(outDir, {recursive: true});

const shell = globSync('/opt/pw-browsers/chromium_headless_shell-*/*/chrome-headless-shell')[0];
const browserExecutable = shell && existsSync(shell) ? shell : null;

const serveUrl = await bundle({entryPoint: path.resolve('src/index.ts')});
const ids = which === 'both' ? ['Landscape', 'Portrait'] : [which];
for (const id of ids) {
	const composition = await selectComposition({serveUrl, id: `TesseraDemo-${id}`, browserExecutable});
	for (const frame of frames) {
		const output = path.join(outDir, `${id}-${String(frame).padStart(3, '0')}.png`);
		await renderStill({composition, serveUrl, frame, output, browserExecutable, scale: 0.5});
		console.log(output);
	}
}
