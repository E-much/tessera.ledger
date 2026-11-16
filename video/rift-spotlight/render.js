// Usage: node render.js <outDir> [fps] [t0] [t1] [step]
// Renders index.html frame by frame (deterministic, time-driven) to PNGs.
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

(async () => {
  const out = process.argv[2] || 'frames';
  const fps = Number(process.argv[3] || 30);
  const t0 = Number(process.argv[4] || 0);
  const t1 = Number(process.argv[5] || 25);
  const step = process.argv[6] ? Number(process.argv[6]) : 1 / fps;
  fs.mkdirSync(out, { recursive: true });

  const browser = await chromium.launch({ args: ['--allow-file-access-from-files', '--force-color-profile=srgb'] });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
  await page.goto('file://' + path.resolve(__dirname, 'index.html'));
  await page.evaluate(async () => {
    await document.fonts.ready;
    const urls = new Set();
    document.querySelectorAll('[style*="url("]').forEach(el => {
      const m = el.getAttribute('style').match(/url\(([^)]+)\)/g) || [];
      m.forEach(u => urls.add(u.slice(4, -1)));
    });
    await Promise.all([...urls].map(u => new Promise(r => { const i = new Image(); i.onload = i.onerror = r; i.src = u; })));
  });

  let n = 0;
  for (let t = t0; t < t1 - 1e-9; t += step) {
    const frame = Math.round(t * fps);
    await page.evaluate(([t, f]) => window.render(t, f), [t, frame]);
    const name = process.argv[6] ? `t_${t.toFixed(2)}.png` : `f_${String(n).padStart(4, '0')}.png`;
    await page.screenshot({ path: path.join(out, name), type: 'png' });
    n++;
  }
  await browser.close();
  console.log(`rendered ${n} frames -> ${out}`);
})();
