// Phase 5 headless test: level-up pool (slots, maxed items, no food leak), stacking boosts once everything is maxed,
// the full-slot note, chests that respect slots, endless scaling / threat level / elite waves / record, and the サイリウム cap.
// Screenshots go to shots/p5-*.png.
import './mkshots.mjs';
import { chromium } from 'playwright-core';
const ROOT = decodeURI(new URL('..', import.meta.url).pathname); // repo root, wherever it is checked out
const out = ROOT + 'shots/';
const errs = []; let n = 0;
const ok = (c, m) => { if (!c) throw new Error('FAIL: ' + m); n++; console.log('ok -', m); };
const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required'] });
async function page(vp, lang) {
  const ctx = await b.newContext({ viewport: vp });
  await ctx.addInitScript(l => { localStorage.setItem('kyoka-lang', l); }, lang || 'ja');
  const p = await ctx.newPage();
  p.on('pageerror', e => { errs.push('pageerror ' + e.message); console.log('pageerror', e.stack); });
  p.on('console', m => { if (m.type() === 'error') { errs.push('console ' + m.text()); console.log('console', m.text()); } });
  await p.goto('file://' + ROOT + 'dist/index.html'); await p.waitForTimeout(1000); return p;
}
const K = (p, f, a) => p.evaluate(f, a);
const W6 = ['berry', 'lariat', 'beam', 'drum', 'mic', 'apple'], P5 = ['shoes', 'ribbon', 'gobelt', 'suzuri', 'metro'];
const start = (p, d) => K(p, d => { const k = window.__kyoka; k.setProfile({ cheats: 4 }); k.setDiff(d || 'normal'); k.select('kyon', 'apple'); k.start(); window.__kyokaTest = true; k.G.xpNext = 1e9; }, d);

let p = await page({ width: 960, height: 540 }, 'ja');
await start(p);
// ---------- 1. regression: full slots with items under max still get offered; nothing unowned, no food ----------
const r1 = await K(p, ([W6, P5]) => { const k = window.__kyoka, G = k.G;
  for (const w of W6) k.give(w); for (const w of ['berry', 'lariat', 'beam']) k.maxWeapon(w); k.give('drum'); // drum 2, mic 1, apple 1
  for (const id of P5) k.give(id); k.give('shoes'); k.give('shoes'); // shoes maxed (3), the rest at 1
  const under = W6.concat(P5).filter(id => k.lvOf(id) < k.MAXLV[id]), seen = new Set(); let food = 0, stranger = 0, boost = 0;
  for (let i = 0; i < 200; i++) for (const id of k.offersFor()) { if (id.startsWith('evo:')) continue; seen.add(id); if (id === 'oyaki') food++; else if (id.startsWith('b_')) boost++; else if (!k.lvOf(id)) stranger++; }
  return { under, missing: under.filter(id => !seen.has(id)), food, stranger, boost, maxedSeen: ['shoes'].filter(id => seen.has(id)) }; }, [W6, P5]);
ok(r1.under.length === 7 && r1.missing.length === 0, `full slots: every owned item under max shows up (${r1.under.join(',')}; missing: ${r1.missing.join(',') || 'none'})`);
ok(r1.stranger === 0 && r1.maxedSeen.length === 0, 'full slots: no unowned item and no maxed item is offered');
ok(r1.food === 0 && r1.boost === 0, 'no food or boost cards while real upgrades are left');
const hudFull = await K(p, () => { window.__kyoka.refreshWeps(); const f = document.querySelector('#slotsfull'); return f && f.textContent; });
ok(hudFull === 'スロット満タン', 'HUD shows スロット満タン when the slots are full');
// chests never add a 7th weapon or 6th passive
const ch = await K(p, () => { const k = window.__kyoka, G = k.G; let extra = 0; for (let i = 0; i < 30; i++) { const before = new Set(Object.keys(G.weapons).concat(Object.keys(G.passives))); k.chestRoll(); for (const id of Object.keys(G.weapons).concat(Object.keys(G.passives))) if (!before.has(id)) extra++; }
  return { extra, nW: Object.keys(G.weapons).length, nP: Object.keys(G.passives).length }; });
ok(ch.extra === 0 && ch.nW === 6 && ch.nP === 5, `chests respect the slots (${ch.nW} weapons, ${ch.nP} passives)`);

// ---------- 2. free slots: unowned items are eligible ----------
await K(p, () => window.__kyoka.closeScreen && 0);
let p2 = await page({ width: 960, height: 540 }, 'ja'); await start(p2);
const r2 = await K(p2, () => { const k = window.__kyoka; k.give('lariat'); const seen = new Set(); for (let i = 0; i < 200; i++) for (const id of k.offersFor()) seen.add(id); return { fresh: [...seen].filter(id => !k.lvOf(id) && !id.startsWith('b_') && id !== 'oyaki').length, food: seen.has('oyaki'), boost: [...seen].some(id => id.startsWith('b_')) }; });
ok(r2.fresh >= 10 && !r2.food && !r2.boost, `free slots: unowned items are offered (${r2.fresh} different), no food or boosts`);
const noFull = await K(p2, () => { window.__kyoka.refreshWeps(); return !document.querySelector('#slotsfull'); });
ok(noFull, 'no スロット満タン note while slots are free');
await p2.context().close();

// ---------- 3. everything maxed: stacking boosts replace the food cards ----------
const r3 = await K(p, () => { const k = window.__kyoka, G = k.G;
  for (const id of Object.keys(G.weapons)) { k.maxWeapon(id); G.evo[id] = true; } for (const id of Object.keys(G.passives)) while (k.lvOf(id) < k.MAXLV[id]) k.give(id);
  const kinds = new Set(); let food = 0; for (let i = 0; i < 200; i++) for (const id of k.offersFor()) { if (id === 'oyaki') food++; else kinds.add(id); }
  return { kinds: [...kinds].sort(), food }; });
ok(r3.food === 0 && r3.kinds.join() === 'b_atk,b_cd,b_coin,b_hp,b_mag,b_spd', 'all maxed: only the 6 stacking boosts are offered, never food (' + r3.kinds.join(',') + ')');
const r4 = await K(p, () => { const k = window.__kyoka, G = k.G; const dm0 = G.dm, hp0 = G.p.maxHp, sp0 = G.p.speed, c0 = G.picked;
  for (let i = 0; i < 3; i++) k.give('b_atk'); k.give('b_hp'); k.give('b_spd'); k.give('b_coin'); k.step(1 / 60);
  for (let i = 0; i < 30; i++) k.give('b_cd'); const seen = new Set(); for (let i = 0; i < 100; i++) for (const id of k.offersFor()) seen.add(id);
  return { atk: G.boost.b_atk, dmUp: G.dm / dm0, hp: G.p.maxHp - hp0, spd: G.p.speed / sp0, coin: G.picked - c0, cd: G.boost.b_cd, cdOffered: seen.has('b_cd'), cdm: G.cdm }; });
ok(r4.atk === 3 && Math.abs(r4.dmUp - 1.09) < 0.005 && r4.hp === 5 && Math.abs(r4.spd - 1.02) < 1e-6 && r4.coin === 10, `boosts stack: damage ×${r4.dmUp.toFixed(3)}, max HP +${r4.hp}, speed ×${r4.spd.toFixed(2)}, +${r4.coin} coins`);
ok(r4.cd === 25 && r4.cdOffered === false, `cooldown boost stops at its cap (${r4.cd} stacks taken, offered again: ${r4.cdOffered})`);
await K(p, () => { const k = window.__kyoka; k.levelUp(); });
const card = await K(p, () => [...document.querySelectorAll('#cards .card')].map(c => c.textContent.replace(/\s+/g, ' ')));
ok(card.length === 3 && card.every(t => /ずっと/.test(t) && /いま ×\d+/.test(t)), 'boost cards show the ずっと tag and the stack count: ' + card[0]);
await p.waitForTimeout(500); await p.screenshot({ path: out + 'p5-01-boost-cards.png' });
await K(p, () => window.__kyoka.pick(0));
const hud = await K(p, () => [...document.querySelectorAll('#weps .w.bst b')].map(b => b.textContent));
ok(hud.length >= 3 && hud.includes('×3') && hud.includes('×25'), 'HUD lists the boosts with their stack counts: ' + hud.join(' '));
await p.waitForTimeout(400); await p.screenshot({ path: out + 'p5-02-hud-slots-full.png' });

// ---------- 4. サイリウム: few zones at once, soft glow ----------
const cy = await K(p, () => { const k = window.__kyoka, G = k.G; k.maxWeapon('cyalume'); let mx = 0; for (let i = 0; i < 900; i++) { k.step(1 / 30); mx = Math.max(mx, G.cys.filter(c => c.t >= c.T).length); if (G.p) G.p.hp = G.p.maxHp; }
  G.evo.cyalume = true; let mx2 = 0; for (let i = 0; i < 900; i++) { k.step(1 / 30); mx2 = Math.max(mx2, G.cys.filter(c => c.t >= c.T).length); G.p.hp = G.p.maxHp; } return [mx, mx2]; });
ok(cy[0] <= 5 && cy[1] <= 8 && cy[1] >= 2, `サイリウム zones capped: ${cy[0]} at once (max 5), ミニライブ ${cy[1]} (max 8)`);
await p.context().close();

// ---------- 5. endless: stronger every minute, elite waves, threat chip, a maxed build still falls ----------
p = await page({ width: 960, height: 540 }, 'ja'); await start(p, 'easy');
const e1 = await K(p, () => { const k = window.__kyoka, G = k.G; G.t = 300; G.endless = true;
  const a = (k.spawn(1, 'crow'), G.enemies.pop()); G.t = 300 + 600; const z = (k.spawn(1, 'crow'), G.enemies.pop());
  return { hp: z.maxHp / a.maxHp, dmg: z.dmg / a.dmg, spd: z.spd / a.spd }; });
ok(e1.hp > 9 && e1.dmg > 4 && e1.spd > 1.2, `endless +10 min: foes ×${e1.hp.toFixed(1)} HP, ×${e1.dmg.toFixed(1)} damage, ×${e1.spd.toFixed(2)} speed (random spread)`);
const e2 = await K(p, () => { const k = window.__kyoka, G = k.G; G.enemies.length = 0; G.t = 300; G.eliteWaveT = 0; k.step(1 / 30); const t1 = G.eliteWaveT; G.t = t1; k.step(1 / 30);
  const el = G.enemies.filter(e => e.elite).length; G.t = 300 + 125; k.step(1 / 30); return { t1, el, thr: G.threat }; });
await p.waitForTimeout(300); e2.chip = await K(p, () => document.querySelector('#diffchip').textContent);
ok(Math.round(e2.t1) === 420 && e2.el >= 14, `elite ring every 2 minutes in endless (${e2.el} elites at 7:00)`);
ok(e2.thr === 3 && /きけん Lv3/.test(e2.chip), 'threat level shows on the HUD: ' + e2.chip);
await K(p, () => { const k = window.__kyoka, G = k.G; G.enemies.length = 0; for (let i = 0; i < 40; i++) k.spawn(1); for (let i = 0; i < 20; i++) k.step(1 / 30); });
await p.waitForTimeout(500); await p.screenshot({ path: out + 'p5-03-endless-threat.png' });
const e3 = await K(p, () => { const k = window.__kyoka, G = k.G; G.enemies.length = 0; G.t = 300; G.eliteWaveT = 0; G.xpNext = 30;
  for (const w of ['berry', 'lariat', 'mic', 'drum', 'apple', 'cyalume']) { k.maxWeapon(w); k.applyEvo(w); } for (const id of ['shoes', 'ribbon', 'gobelt', 'suzuri', 'metro']) while (k.lvOf(id) < 3) k.give(id);
  k.setAuto('smart'); let g = 0, maxE = 0; while ((k.state === 'play' || k.state === 'levelup' || k.state === 'chest') && g++ < 30 * 60 * 40) { if (k.state === 'levelup') { k.pick(0); continue; } if (k.state === 'chest') { k.closeChest(); continue; } k.step(1 / 30); maxE = Math.max(maxE, G.enemies.length); }
  return { state: k.state, t: Math.round(G.t), maxE, rec: (document.querySelector('#e-endless') || {}).textContent || '' }; });
ok(e3.state === 'over' && e3.t < 300 + 40 * 60, `a maxed, fully evolved build still falls in endless (at ${Math.floor(e3.t / 60)}:${String(e3.t % 60).padStart(2, '0')})`);
ok(e3.maxE <= 470, `the crowd stays under the cap (${e3.maxE})`);
ok(/∞ エンドレス \d+:\d\d/.test(e3.rec), 'result screen shows the endless survival time: ' + e3.rec);
await p.waitForTimeout(400); await p.screenshot({ path: out + 'p5-04-endless-result.png' });
const best = await K(p, () => { const k = window.__kyoka; document.querySelector('#titlebtn').click(); k.openSelect(); k.openDiff && k.openDiff(); return document.body.innerText.match(/∞ さいこう \d+:\d\d/)?.[0] || ''; });
ok(/∞ さいこう \d+:\d\d/.test(best), 'difficulty picker shows the endless best: ' + best);
await p.waitForTimeout(300); await p.screenshot({ path: out + 'p5-05-endless-best.png' });
await p.context().close();

// ---------- 6. zh / en labels ----------
for (const [lang, full, stack, thr] of [['zh', '欄位已滿', '目前 ×', '危險 Lv'], ['en', 'Slots full', 'Now ×', 'Threat Lv']]) {
  const q = await page({ width: 960, height: 540 }, lang); await start(q);
  const t = await K(q, ([W6, P5]) => { const k = window.__kyoka, G = k.G; for (const w of W6) { k.maxWeapon(w); G.evo[w] = true; } for (const id of P5) while (k.lvOf(id) < 3) k.give(id); k.refreshWeps(); k.levelUp();
    const r = { full: document.querySelector('#slotsfull').textContent, card: document.querySelector('#cards .card').textContent }; k.pick(0); G.t = 400; G.endless = true; k.step(1 / 30); return r; }, [W6, P5]);
  await q.waitForTimeout(300); t.chip = await K(q, () => document.querySelector('#diffchip').textContent);
  ok(t.full === full && t.card.includes(stack) && t.chip.includes(thr), `${lang}: "${t.full}", "${stack}…", "${t.chip}"`);
  if (lang === 'zh') { await q.waitForTimeout(400); await q.screenshot({ path: out + 'p5-06-zh-hud.png' }); }
  await q.context().close();
}

ok(errs.length === 0, 'zero console errors (' + errs.length + ')');
console.log(n + ' phase 5 checks passed');
await b.close();
