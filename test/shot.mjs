import { chromium } from 'playwright-core';
const [,, url, out, w = 1600, h = 1400] = process.argv;
const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: +w, height: +h } });
p.on('pageerror', e => console.log('pageerror', e.stack)); p.on('console', m => m.type() === 'error' && console.log('console', m.text()));
await p.goto(url); await p.waitForTimeout(800); await p.screenshot({ path: out }); await b.close();
