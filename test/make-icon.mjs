const ROOT = decodeURI(new URL('..', import.meta.url).pathname); // repo root, wherever it is checked out
// Renders the app icon from the game's own pixel art into assets/icon*.png (run after a build): node test/make-icon.mjs
import { chromium } from 'playwright-core';
import { writeFileSync, mkdirSync } from 'fs';
const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const p = await b.newPage(); await p.goto('file://' + ROOT + 'dist/index.html'); await p.waitForTimeout(800);
mkdirSync(ROOT + 'assets', { recursive: true });
for (const s of [512, 256, 128, 64, 32, 16]) {
  const d = await p.evaluate(s => window.__kyoka.iconPNG(s), s);
  writeFileSync(`${ROOT}assets/${s === 512 ? 'icon' : 'icon-' + s}.png`, Buffer.from(d.split(',')[1], 'base64'));
}
console.log('icons written'); await b.close();
