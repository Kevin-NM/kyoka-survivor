import { chromium } from 'playwright-core';
const ROOT = decodeURI(new URL('..', import.meta.url).pathname); // repo root, wherever it is checked out
const diffGo = async (pg, d = 'normal', tap = false) => { await pg.waitForTimeout(150); if (await pg.evaluate(() => !document.getElementById('diff').classList.contains('hide'))) { const s = '#df-list .dbtn[data-d="' + d + '"]'; if (tap) await pg.tap(s); else await pg.click(s); await pg.waitForTimeout(400); } };
const out = ROOT + 'tmp/';
const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const p = await b.newPage({ viewport: { width: 960, height: 540 } });
p.on('pageerror', e => console.log('pageerror', e.stack)); p.on('console', m => (m.type() === 'error' || m.type() === 'warning') && console.log('console', m.type(), m.text()));
await p.goto('file://' + ROOT + 'dist/index.html'); await p.waitForTimeout(1500);
await p.screenshot({ path: out + 'q-title.png' });
await p.click('#startbtn'); await p.waitForTimeout(300); await diffGo(p);
await p.evaluate(() => { const k = window.__kyoka; k.give('seal'); k.give('seal'); k.give('penlight'); k.skipTo(50); k.setAuto(true); window.__kyokaTest = true; });
for (let i = 0; i < 10; i++) { await p.evaluate(() => { const k = window.__kyoka; if (k.state === 'levelup') k.pick(0); k.G.p.hp = k.G.p.maxHp; }); await p.waitForTimeout(400); }
await p.screenshot({ path: out + 'q-play.png' });
const fps = await p.evaluate(() => new Promise(r => { let n = 0; const t0 = performance.now(); const f = () => { n++; if (performance.now() - t0 < 2000) requestAnimationFrame(f); else r(n / 2); }; requestAnimationFrame(f); }));
console.log('fps (swiftshader)', fps);
await b.close();
