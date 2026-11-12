// Captures app.tessera.fun pages. Works around the site's font redirect loop by
// serving Outfit locally. Usage: node scripts/shoot.cjs <url> <out.png> [width] [height]
const {chromium} = require('playwright');
const fs = require('fs');
const path = require('path');
(async () => {
  const [url, out, w = '1440', h = '900'] = process.argv.slice(2);
  const b = await chromium.launch();
  const pg = await b.newPage({viewport: {width: +w, height: +h}, deviceScaleFactor: 1});
  await pg.route(/Outfit_(\d+)\w+\./, (route) => {
    const weight = route.request().url().match(/Outfit_(\d+)/)[1];
    const file = path.join(__dirname, '..', 'node_modules/@fontsource/outfit/files', `outfit-latin-${weight}-normal.woff2`);
    route.fulfill({status: 200, contentType: 'font/woff2', body: fs.readFileSync(file)});
  });
  await pg.goto(url, {waitUntil: 'networkidle', timeout: 60000}).catch((e) => console.log('goto', e.message));
  await pg.waitForTimeout(7000);
  await pg.screenshot({path: out});
  console.log('URL', pg.url());
  console.log((await pg.innerText('body')).slice(0, 3000));
  const links = await pg.$$eval('a', (as) => [...new Set(as.map((a) => a.href))]);
  console.log('LINKS', links.slice(0, 50).join('\n'));
  await b.close();
})();
