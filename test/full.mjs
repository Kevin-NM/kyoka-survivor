import './mkshots.mjs';
import { chromium } from 'playwright-core';
const ROOT = decodeURI(new URL('..', import.meta.url).pathname); // repo root, wherever it is checked out
const diffGo = async (pg, d = 'normal', tap = false) => { await pg.waitForTimeout(150); if (await pg.evaluate(() => !document.getElementById('diff').classList.contains('hide'))) { const s = '#df-list .dbtn[data-d="' + d + '"]'; if (tap) await pg.tap(s); else await pg.click(s); await pg.waitForTimeout(400); } };
const out = ROOT + 'shots/';
const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required'] });
const errs = [];
async function page(vp, touch) {
  const ctx = await b.newContext({ viewport: vp, hasTouch: !!touch, isMobile: !!touch, deviceScaleFactor: touch ? 2 : 1 });
  const p = await ctx.newPage();
  p.on('pageerror', e => errs.push('pageerror ' + e.message)); p.on('console', m => m.type() === 'error' && errs.push('console ' + m.text()));
  await p.goto('file://' + ROOT + 'dist/index.html'); await p.waitForTimeout(1200); return p;
}
const heal = p => p.evaluate(() => { const k = window.__kyoka; if (k.G) k.G.p.hp = Math.max(k.G.p.hp, k.G.p.maxHp * 0.7); });
const p = await page({ width: 960, height: 540 });
await p.screenshot({ path: out + '01-title-ja.png' });
await p.click('.langs button[data-l="zh"]'); await p.waitForTimeout(300); await p.screenshot({ path: out + '02-title-zh.png' });
await p.click('.langs button[data-l="en"]'); await p.waitForTimeout(300); await p.screenshot({ path: out + '03-title-en.png' });
await p.click('.langs button[data-l="ja"]');
await p.click('#startbtn'); await p.waitForTimeout(500); await diffGo(p);
// ~30s of real keyboard play, normal HP, auto-pick level ups by keyboard
const seq = ['KeyD', 'KeyS', 'KeyA', 'KeyW', 'ArrowRight', 'ArrowDown'];
let lvShot = false;
for (let i = 0; i < 30; i++) {
  const k = seq[i % seq.length]; await p.keyboard.down(k);
  if (i % 4 === 2) await p.keyboard.press('Space');
  await p.waitForTimeout(1000); await p.keyboard.up(k);
  const st = await p.evaluate(() => window.__kyoka.state);
  if (st === 'levelup') { await p.waitForTimeout(700); if (!lvShot) { await p.screenshot({ path: out + '05-levelup.png' }); lvShot = true; } await p.keyboard.press('Digit1'); }
  if (st === 'over') { console.log('died during keyboard play at', i); break; }
  if (i === 20) await p.screenshot({ path: out + '04-gameplay.png' });
}
const s1 = await p.evaluate(() => { const G = window.__kyoka.G; return { t: G.t.toFixed(1), hp: G.p.hp, lv: G.lvl, kills: G.kills, enemies: G.enemies.length }; });
console.log('after keyboard play', JSON.stringify(s1));
await p.evaluate(() => { const k = window.__kyoka; window.__kyokaTest = true; k.setAuto(true); ['seal', 'seal', 'lariat', 'beam', 'penlight', 'penlight'].forEach(x => { try { k.give(x); } catch (e) { } }); });
async function run(ms) { const n = ms / 300; for (let i = 0; i < n; i++) { await p.evaluate(() => { const k = window.__kyoka; if (k.state === 'levelup') k.pick(0); }); await heal(p); await p.waitForTimeout(300); } }
await p.evaluate(() => window.__kyoka.skipTo(125)); await run(5000); // stages no longer change mid-run (see phase2.mjs for every stage)
await p.evaluate(() => window.__kyoka.skipTo(209)); await run(6000); await p.screenshot({ path: out + '07-boss.png' });
await p.evaluate(() => window.__kyoka.skipTo(235)); await run(3000);
// perf: force ~400 enemies, measure update+prep time
const perf = await p.evaluate(() => { const k = window.__kyoka, G = k.G; return { n: G.enemies.length }; });
console.log('enemies before perf', perf.n);
await p.evaluate(() => window.__kyoka.skipTo(299.5)); await run(1500);
await p.waitForTimeout(800); await p.screenshot({ path: out + '09-victory.png' });
console.log('state at end', await p.evaluate(() => window.__kyoka.state));
// game over
await p.click('#retrybtn').catch(() => {}); await p.waitForTimeout(500);
await p.evaluate(() => { const k = window.__kyoka; k.skipTo(90); k.G.p.hp = 1; k.G.p.inv = 0; });
for (let i = 0; i < 40; i++) { if (await p.evaluate(() => window.__kyoka.state) === 'over') break; await p.evaluate(() => { const k = window.__kyoka; if (k.state === 'levelup') k.pick(0); k.G.p.inv = 0; k.G.p.hp = Math.min(k.G.p.hp, 1); }); await p.waitForTimeout(300); }
await p.waitForTimeout(800); await p.screenshot({ path: out + '10-gameover.png' });
console.log('state', await p.evaluate(() => window.__kyoka.state));
// phone
const q = await page({ width: 390, height: 844 }, true);
await q.screenshot({ path: out + '11-phone-title.png' });
await q.tap('#startbtn'); await q.waitForTimeout(600); await diffGo(q, 'normal', true);
await q.evaluate(() => { const k = window.__kyoka; window.__kyokaTest = true; k.give('seal'); k.skipTo(40); k.setAuto(true); });
for (let i = 0; i < 12; i++) { await q.evaluate(() => { const k = window.__kyoka; if (k.state === 'levelup') k.pick(0); k.G.p.hp = Math.max(k.G.p.hp, 60); }); await q.waitForTimeout(300); }
await q.screenshot({ path: out + '12-phone-play.png' });
await q.evaluate(() => { const k = window.__kyoka; k.setAuto(false); k.levelUp(); }); await q.waitForTimeout(1200);
await q.screenshot({ path: out + '13-phone-levelup.png' });
console.log('errors', errs.length ? errs : 'none');
await b.close();
