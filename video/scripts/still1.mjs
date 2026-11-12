import {bundle} from '@remotion/bundler';
import {renderStill, selectComposition} from '@remotion/renderer';
import path from 'node:path';
const frames = process.argv.slice(2).map(Number);
const serveUrl = await bundle({entryPoint: path.resolve('src/index.ts')});
const browserExecutable = '/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell';
const composition = await selectComposition({serveUrl, id: 'TesseraLaunch', browserExecutable});
for (const frame of frames) {
  const output = `out/full/f${String(frame).padStart(4, '0')}.png`;
  await renderStill({composition, serveUrl, frame, output, imageFormat: 'png', browserExecutable});
  console.log(output);
}
