// Renders a contact sheet of frames for self-review: node scripts/stills.mjs 0 120 300 ...
import {bundle} from '@remotion/bundler';
import {renderStill, selectComposition} from '@remotion/renderer';
import path from 'node:path';
const frames = process.argv.slice(2).map(Number);
const outDir = process.env.OUT_DIR || 'out/stills';
const serveUrl = await bundle({entryPoint: path.resolve('src/index.ts')});
const browserExecutable = '/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell';
const composition = await selectComposition({serveUrl, id: 'TesseraLaunch', browserExecutable});
for (const frame of frames) {
  const output = `${outDir}/f${String(frame).padStart(4, '0')}.jpg`;
  await renderStill({composition, serveUrl, frame, output, imageFormat: 'jpeg', jpegQuality: 85, browserExecutable, scale: 0.5});
  console.log(output);
}
