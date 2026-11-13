// Renders bakepoint.html frame-by-frame to MP4, split across parallel workers.
// Usage: node render.js [--fps 60] [--out out/bakepoint-teaser-silent.mp4] [--workers 4] [--stills 1,4,8]
const { chromium } = require('playwright');
const { spawn, execFileSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');

const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : d; };
const fps = parseInt(opt('fps', '60'), 10);
const out = path.resolve(__dirname, opt('out', 'out/bakepoint-teaser-silent.mp4'));
const stills = opt('stills', null);
const range = opt('range', null);          // internal: "start,end" frame range for a worker
const workers = parseInt(opt('workers', String(Math.max(1, os.cpus().length))), 10);

async function openPage() {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
  await page.goto('file://' + path.resolve(__dirname, 'bakepoint.html'));
  await page.evaluate(() => document.fonts.ready);
  return { browser, page, duration: await page.evaluate(() => window.DURATION) };
}

async function renderRange(a, b, file) {
  const { browser, page } = await openPage();
  const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(fps), '-i', '-',
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '14', '-pix_fmt', 'yuv420p', file],
    { stdio: ['pipe', 'inherit', 'inherit'] });
  for (let i = a; i < b; i++) {
    await page.evaluate(t => window.render(t), i / fps);
    const buf = await page.screenshot({ type: 'jpeg', quality: 97 });
    if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
  }
  ff.stdin.end();
  await new Promise(r => ff.on('close', r));
  await browser.close();
}

(async () => {
  fs.mkdirSync(path.dirname(out), { recursive: true });

  if (range) {                               // worker mode
    const [a, b] = range.split(',').map(Number);
    await renderRange(a, b, out);
    return;
  }

  if (stills) {
    const { browser, page } = await openPage();
    for (const s of stills.split(',')) {
      await page.evaluate(t => window.render(t), parseFloat(s));
      const f = path.join(path.dirname(out), `still-${s}.png`);
      await page.screenshot({ path: f });
      console.log(f);
    }
    await browser.close();
    return;
  }

  const { browser, duration } = await openPage();
  await browser.close();
  const total = Math.round(duration * fps);
  const per = Math.ceil(total / workers);
  const t0 = Date.now();
  const parts = [];
  await Promise.all([...Array(workers).keys()].map(w => {
    const a = w * per, b = Math.min(total, a + per);
    const file = out.replace(/\.mp4$/, `.part${w}.mp4`);
    parts.push(file);
    return new Promise((res, rej) => {
      const p = spawn(process.execPath, [__filename, '--range', `${a},${b}`, '--fps', String(fps), '--out', file], { stdio: 'inherit' });
      p.on('close', c => c === 0 ? res() : rej(new Error('worker ' + w + ' failed')));
    });
  }));
  const list = out + '.txt';
  fs.writeFileSync(list, parts.map(p => `file '${p}'`).join('\n'));
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', list, '-c', 'copy', '-movflags', '+faststart', out]);
  parts.forEach(p => fs.unlinkSync(p)); fs.unlinkSync(list);
  console.log(`wrote ${out} (${total} frames, ${((Date.now() - t0) / 1000).toFixed(0)}s)`);
})();
