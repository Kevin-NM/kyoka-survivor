import './mkshots.mjs';
import { chromium } from 'playwright-core';
const ROOT = decodeURI(new URL('..', import.meta.url).pathname); // repo root, wherever it is checked out
const diffGo = async (pg, d = 'normal', tap = false) => { await pg.waitForTimeout(150); if (await pg.evaluate(() => !document.getElementById('diff').classList.contains('hide'))) { const s = '#df-list .dbtn[data-d="' + d + '"]'; if (tap) await pg.tap(s); else await pg.click(s); await pg.waitForTimeout(400); } };
const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 960, height: 540 } });
await p.goto('file://' + ROOT + 'dist/index.html'); await p.waitForTimeout(1000);
await p.click('#startbtn'); await p.waitForTimeout(300); await diffGo(p);
await p.evaluate(() => { const k = window.__kyoka; window.__kyokaTest = true; ['seal','seal','seal','lariat','beam','penlight','penlight','berry','berry'].forEach(x => k.give(x)); k.skipTo(180); k.setAuto(true); });
for (const N of [100, 400, 600]) {
  await p.evaluate(N => { const k = window.__kyoka; k.G.enemies.length = 0; k.spawn(N); k.G.p.hp = 1e9; }, N);
  // pure update cost, no render
  const upd = await p.evaluate(N => { const k = window.__kyoka; const G = k.G; let t = 0, c = 0; for (let i = 0; i < 120; i++) { if (G.enemies.length < N) k.spawn(N - G.enemies.length); if (k.state === 'levelup') k.pick(0); const a = performance.now(); k.step(1 / 60); t += performance.now() - a; c++; } return { ms: t / c, n: G.enemies.length }; }, N);
  await p.evaluate(() => { window.__kyokaProf = { n: 0, js: 0, render: 0 }; });
  const t0 = Date.now(); while (Date.now() - t0 < 3000) { await p.evaluate(N => { const k = window.__kyoka; if (k.state === 'levelup') k.pick(0); if (k.G.enemies.length < N) k.spawn(N - k.G.enemies.length); }, N); await p.waitForTimeout(200); }
  const pr = await p.evaluate(() => { const P = window.__kyokaProf; return { fps: P.n / 3, jsFrame: P.js / P.n, renderCPU: P.render / P.n, enemies: window.__kyoka.G.enemies.length }; });
  console.log(N, 'update ms/step', upd.ms.toFixed(2), 'n', upd.n, '| frame', JSON.stringify(pr));
}
await p.screenshot({ path: ROOT + 'shots/14-perf-600.png' });
await b.close();
