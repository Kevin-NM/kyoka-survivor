const ROOT = decodeURI(new URL('..', import.meta.url).pathname); // repo root, wherever it is checked out
// Runtime sweep: every evolution, the new weapons/passives/heal items, and the ranger character, with no console errors.
import './mkshots.mjs';
import { chromium } from 'playwright-core';
const out = ROOT + 'shots/';
const errs = [];
const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required'] });
const p = await b.newPage({ viewport: { width: 960, height: 540 } });
p.on('pageerror', e => { errs.push(e.stack); console.log('pageerror', e.stack); });
p.on('console', m => { if (m.type() === 'error') { errs.push(m.text()); console.log('console', m.text()); } });
await p.goto('file://' + ROOT + 'dist/index.html'); await p.waitForTimeout(1200);
const keep = () => p.evaluate(() => { const k = window.__kyoka; if (k.state === 'levelup') k.pick(0); if (k.G) k.G.p.hp = k.G.p.maxHp; return k.state; });
const pairs = { berry: 'ribbon', beam: 'gobelt', seal: 'shoes', brush: 'suzuri', drum: 'metro', mic: 'nodoame', apple: 'basket' };
const STAGE = { brush: 'cage', drum: 'race', mic: 'night', apple: 'zoo' };
for (const [w, pas] of Object.entries(pairs)) {
  await p.evaluate(({ w, pas, st }) => {
    const k = window.__kyoka; window.__kyokaTest = true;
    k.setProfile({ ...k.profile, cheats: 4, ach: 2 ** 28 - 1, up: { panier: 3, shodo: 5, drumbeat: 2, magnet: 2, toys: 3, domino: 3, ohayo: 2, michi: 1 } });
    k.select(w === 'beam' ? 'ranger' : 'kyon', st); k.start();
    k.maxWeapon(w); k.give(pas); if (w !== 'drum') k.give('drum'); if (w !== 'brush') k.give('brush');
    const r = k.evoReady(); if (r !== w) throw new Error('not ready ' + w + ' got ' + r); k.applyEvo(r);
    k.setAuto(true); k.skipTo(150); k.spawn(80);
    const G = k.G; for (const it of ['yaki', 'ebi', 'coin']) G.items.push({ x: G.p.x + 30, y: G.p.y, k: it });
  }, { w, pas, st: STAGE[w] || 'apple' });
  for (let i = 0; i < 16; i++) { await keep(); await p.waitForTimeout(250); }
  const s = await p.evaluate(() => { const G = window.__kyoka.G; return { evo: G.evo, kills: G.kills, ch: G.char, rc: G.rc, enemies: G.enemies.length }; });
  console.log(w, JSON.stringify(s));
  for (let i = 0; i < 20; i++) { await keep(); await p.waitForTimeout(150); if (await p.evaluate(() => window.__kyoka.state) === 'play') break; }
  await p.evaluate(() => { const G = window.__kyoka.G; G.pending = 0; G.xp = 0; G.xpNext = 1e9; }); await p.waitForTimeout(500);
  await p.screenshot({ path: out + 'p1-evo-' + w + '.png' });
  await p.evaluate(() => window.__kyoka.end(false)); await p.waitForTimeout(400);
}
// endless 10 minutes path + boss respawn
await p.evaluate(() => { const k = window.__kyoka; k.select('kyon', 'apple'); k.start(); k.setAuto(true); k.skipTo(299.5); });
for (let i = 0; i < 12; i++) { const st = await keep(); if (st === 'win') break; await p.waitForTimeout(250); }
await p.waitForTimeout(500);
await p.evaluate(() => { const k = window.__kyoka; k.continueEndless(); k.skipTo(605); });
for (let i = 0; i < 12; i++) { await keep(); await p.waitForTimeout(250); }
console.log('endless', JSON.stringify(await p.evaluate(() => ({ t: window.__kyoka.G.t, s: window.__kyoka.state, e: window.__kyoka.G.enemies.length, endless10: window.__kyoka.has('endless10') }))));
await p.screenshot({ path: out + 'p1-endless.png' });
console.log('errors', errs.length ? errs : 'none');
await b.close(); if (errs.length) process.exit(1);
