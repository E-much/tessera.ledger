// Renders bakepoint.html frame-by-frame to MP4.
// Usage: node render.js [--fps 60] [--out out/bakepoint-teaser.mp4] [--stills 1,4,8]
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : d; };
const fps = parseInt(opt('fps', '60'), 10);
const out = path.resolve(__dirname, opt('out', 'out/bakepoint-teaser.mp4'));
const stills = opt('stills', null);

(async () => {
  fs.mkdirSync(path.dirname(out), { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
  await page.goto('file://' + path.resolve(__dirname, 'bakepoint.html'));
  await page.evaluate(() => document.fonts.ready);
  const duration = await page.evaluate(() => window.DURATION);

  if (stills) {
    for (const s of stills.split(',')) {
      await page.evaluate(t => window.render(t), parseFloat(s));
      const f = path.join(path.dirname(out), `still-${s}.png`);
      await page.screenshot({ path: f });
      console.log(f);
    }
    await browser.close();
    return;
  }

  const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(fps), '-i', '-',
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '14', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', out],
    { stdio: ['pipe', 'inherit', 'inherit'] });

  const total = Math.round(duration * fps);
  for (let i = 0; i < total; i++) {
    await page.evaluate(t => window.render(t), i / fps);
    const buf = await page.screenshot({ type: 'png' });
    if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
    if (i % fps === 0) process.stdout.write(`\r${i}/${total}`);
  }
  ff.stdin.end();
  await new Promise(r => ff.on('close', r));
  await browser.close();
  console.log(`\nwrote ${out}`);
})();
