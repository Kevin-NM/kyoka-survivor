// Endless pressure check (one short scripted run, not a sim sweep): an idle player with a maxed build on ゲキムズ
// should not survive 15 minutes of game time. Also prints threat / boss timing as it goes.
import { chromium } from 'playwright-core';
const ROOT = decodeURI(new URL('..', import.meta.url).pathname);
const stage = process.argv[2] || 'road', diff = process.argv[3] || 'geki', boostK = +(process.env.BOOSTK || 1), noBoss = !!process.env.NOBOSS;
const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const ctx = await b.newContext({ viewport: { width: 960, height: 540 } });
await ctx.addInitScript(() => { localStorage.setItem('kyoka-lang', 'ja'); localStorage.removeItem('kyoka-run'); });
const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
await p.goto('file://' + ROOT + 'dist/index.html'); await p.waitForTimeout(600);
await p.evaluate(([c, stage, diff, bk, nb]) => {
  const k = window.__kyoka; k.setProfile(k.decode(c).profile); window.__kyokaTest = true;
  k.select('kyon', stage); k.setDiff(diff); k.start();
  for (const w of ['berry', 'lariat', 'beam', 'drum', 'mic', 'apple']) { k.maxWeapon(w); k.applyEvo(w); }
  for (const id of ['pannier', 'shoes', 'ribbon', 'suzuri', 'metro']) while (k.lvOf(id) < 3) k.give(id);
  for (const [id, n] of [['b_atk', 30], ['b_hp', 20], ['b_cd', 15], ['b_mag', 5]]) for (let i = 0; i < Math.min(id === 'b_cd' ? 25 : 999, n * bk); i++) k.give(id); // like a Lv100+ build
  if (stage !== 'road') { k.skipTo(300); k.step(1 / 30); k.continueEndless(); }
  window.__noBoss = nb;
}, [process.env.ALLCODE, stage, diff, boostK, noBoss]);
let res;
for (let i = 0; i < 64; i++) {
  res = await p.evaluate(() => { const k = window.__kyoka;
    for (let j = 0; j < (+window.__afkN || 450); j++) { if (k.state === 'chest') k.closeChest(); if (k.state === 'levelup') { window.__kyokaTest = true; k.pick(0); } if (k.state !== 'play') break; if (window.__noBoss) k.G.nextBoss = 1e9; k.step(1 / 30); }
    const G = k.G; return { st: k.state, t: Math.floor(G.t), hp: Math.round(G.p.hp), max: G.p.maxHp, thr: G.threat, lvl: G.lvl, en: G.enemies.length, bosses: G.bossKills, boss: !!G.boss, two: !!(G.boss && G.boss.twin) }; });
  if (i % 4 === 3 || process.env.V && res.t > 280 || res.st !== 'play') console.log(JSON.stringify(res));
  if (res.st !== 'play' || res.t >= 900 + (stage === 'road' ? 0 : 300)) break;
}
await b.close();
if (errs.length) console.log('errors:', errs.slice(0, 3));
const limit = stage === 'road' ? 900 : 1200;
console.log(res.st === 'over' && res.t <= limit ? `AFK died at ${Math.floor(res.t / 60)}:${String(res.t % 60).padStart(2, '0')} (threat Lv${res.thr}) ✔` : `AFK still alive at ${res.t}s ✗`);
