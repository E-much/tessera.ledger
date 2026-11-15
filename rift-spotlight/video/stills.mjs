// Usage: node stills.mjs outDir t1 t2 ...   (times in seconds)
import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition } from "@remotion/renderer";
import path from "node:path";
const [outDir, ...times] = process.argv.slice(2);
const browserExecutable = "/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell";
const serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts") });
const composition = await selectComposition({ serveUrl, id: "Spotlight", browserExecutable });
for (const t of times) {
  const frame = Math.round(parseFloat(t) * composition.fps);
  await renderStill({ composition, serveUrl, frame, output: path.join(outDir, `t${t}.png`), browserExecutable, scale: 1 });
  console.log("still", t);
}
