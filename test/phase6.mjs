// Phase 6 headless test: the nine new stages and the encore loop (bosses, gimmicks, pickups), the seven new weapons
// and their evolutions, new characters, the paged select screen, the v6 save code and the gated weapon pool.
// Screenshots go to shots/p6-*.png.
import './mkshots.mjs';
import { chromium } from 'playwright-core';
const ROOT = decodeURI(new URL('..', import.meta.url).pathname);
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
const NEW = ['halloween', 'runway', 'ring', 'dawn', 'cherry', 'station', 'clinic', 'okinawa', 'hq'];
const BOSS = { halloween: 'woofer', runway: 'msew', ring: 'champ', dawn: 'nabe', cherry: 'oushou', station: 'loco', clinic: 'sushim', okinawa: 'shisaA', hq: 'scroll' };
const NEWW = ['ttable', 'para', 'hlock', 'koma', 'whis', 'syr', 'chaka'];
// run the game for s seconds with the auto bot, answering level-ups and chests
const run = (p, s) => K(p, s => { const k = window.__kyoka; for (let i = 0; i < s * 30; i++) { if (k.state === 'levelup') k.pick(0); else if (k.state === 'chest') k.closeChest(); else if (k.state !== 'play') break; k.G.p.hp = k.G.p.maxHp; k.step(1 / 30); } return k.state; }, s);

const p = await page({ width: 960, height: 540 }, 'ja');
// ---------- data ----------
const d = await K(p, () => { const k = window.__kyoka; return { stages: Object.keys(k.SDEF).length, weapons: k.WEAPONS.length, ach: k.ACH_IDS.length }; });
ok(d.stages === 19 && d.weapons === 21 && d.ach === 64, `19 stages, 21 weapons, 64 achievements (${JSON.stringify(d)})`);
// ---------- gated weapon pool: new weapons stay out of the old stages until their stage is cleared ----------
const g = await K(p, NEWW => { const k = window.__kyoka; k.setProfile({ cheats: 4 }); k.setDiff('normal'); k.select('kyon', 'apple'); k.start(); window.__kyokaTest = true; k.G.xpNext = 1e9;
  const seen = new Set(); for (let i = 0; i < 400; i++) for (const id of k.offersFor()) seen.add(id); const inApple = NEWW.filter(w => seen.has(w)); k.end(false);
  k.select('kyon', 'halloween'); k.start(); window.__kyokaTest = true; const s2 = new Set(); for (let i = 0; i < 400; i++) for (const id of k.offersFor()) s2.add(id); k.end(false);
  return { inApple, ttHere: s2.has('ttable'), others: NEWW.filter(w => w !== 'ttable' && s2.has(w)) }; }, NEWW);
ok(!g.inApple.length && g.ttHere && !g.others.length, `new weapons gated by stage (apple: ${g.inApple}, halloween offers ターンテーブル only)`);
await K(p, () => document.querySelector('#titlebtn').click());

// ---------- each new stage: foes, boss, gimmicks, screenshot ----------
for (const sid of NEW) {
  await K(p, sid => { const k = window.__kyoka; k.setProfile({ cheats: 4 }); k.setDiff('normal'); k.select('kyon', sid); k.start(); window.__kyokaTest = true; k.setAuto('smart'); }, sid);
  await run(p, 40);
  const r = await K(p, ([sid, NEWW]) => { const k = window.__kyoka, G = k.G; const types = new Set(G.enemies.map(e => e.type));
    for (const w of NEWW) { k.maxWeapon(w); k.applyEvo(w); } // only for coverage of the weapon code
    k.skipTo(200); const boss = k.spawnBoss(); return { types: [...types], boss, stage: G.stage, ok: G.sid === sid }; }, [sid, NEWW]);
  ok(r.ok && r.types.length >= 1 && r.boss === BOSS[sid], `${sid}: foes ${r.types.join('/')} · boss ${r.boss}`);
  await run(p, 6);
  const extra = await K(p, sid => { const G = window.__kyoka.G; return { twin: sid === 'okinawa' ? G.enemies.filter(e => e.boss).length : 0, guards: sid === 'cherry' ? G.enemies.filter(e => e.type === 'kin' || e.type === 'gin').length : 0, night: G.stage, mis: !!G.mis || G.misN > 0, cards: G.cardN }; }, sid);
  if (sid === 'okinawa') ok(extra.twin === 2 && extra.mis, 'okinawa: two シーサー and a mission');
  if (sid === 'cherry') ok(extra.guards === 2, 'cherry: 王将 comes with 金 and 銀');
  if (sid === 'runway') ok(extra.night === 21, 'runway: night falls at 2:30');
  if (sid === 'dawn') ok(extra.cards >= 4, 'dawn: ハムナンバーカード turn up');
  await p.waitForTimeout(400);
  await p.screenshot({ path: out + 'p6-' + sid + '.png' });
  const k2 = await K(p, () => { const k = window.__kyoka; for (let i = 0; i < 3 && k.G.boss; i++) k.killBoss(); return { boss: !!k.G.boss, items: k.G.items.some(i => i.k === 'chest') }; });
  ok(!k2.boss && k2.items, `${sid}: boss down drops a chest`);
  await K(p, () => { const k = window.__kyoka; k.skipTo(299.9); for (let i = 0; i < 10 && k.state !== 'win'; i++) { if (k.state === 'levelup') k.pick(0); else if (k.state === 'chest') k.closeChest(); else k.step(1 / 30); } });
  const won = await K(p, sid => ({ st: window.__kyoka.state, has: window.__kyoka.has('clear' + sid[0].toUpperCase() + sid.slice(1)) }), sid);
  ok(won.st === 'win' && won.has, `${sid}: clear at 5:00 grants its clear achievement`);
  await K(p, () => document.querySelector('#titlebtn').click());
}

// ---------- pickups ----------
const pk = await K(p, () => { const k = window.__kyoka; k.select('kyon', 'okinawa'); k.start(); window.__kyokaTest = true; const G = k.G, out = {};
  for (const it of ['usamimi', 'cbelt', 'kanzashi', 'ekicho', 'nurse', 'kakigori', 'hamcoin', 'kusuri', 'emono', 'towel', 'cherry', 'okisoba', 'miso']) { k.drop(it); k.step(1 / 30); out[it] = !G.items.some(x => x.k === it); }
  out.speed = G.usaT > 0; out.shield = G.shield > 0; out.slow = G.slowT > 0; out.frz = G.frzT > 0; for (let i = 0; i < 5; i++) { k.drop('hamcard'); k.step(1 / 30); } out.ham = k.has('hamcards'); k.end(false); return out; });
ok(Object.values(pk).every(Boolean), 'stage pickups all work (' + Object.keys(pk).filter(x => !pk[x]).join(',') + ')');
await K(p, () => document.querySelector('#titlebtn').click());

// ---------- new characters ----------
const ch = await K(p, () => { const k = window.__kyoka, out = {}; k.setProfile({ cheats: 6 });
  for (const c of ['dj', 'amaroli', 'waroli', 'machi', 'ekicho', 'redgt', 'kumicho', 'sapphire']) { k.select(c, 'apple'); k.start(); window.__kyokaTest = true; for (let i = 0; i < 60; i++) k.step(1 / 30); out[c] = { w: Object.keys(k.G.weapons).join('+'), hp: k.G.p.maxHp, spr: k.G.spr }; k.end(false); }
  return out; });
ok(ch.dj.w === 'ttable' && ch.amaroli.w.includes('para') && ch.machi.w === 'koma' && ch.kumicho.w === 'chaka' && ch.sapphire.hp === 70 && ch.sapphire.spr === 'bs', 'new characters start with their weapons ' + JSON.stringify(ch));
await K(p, () => document.querySelector('#titlebtn').click());

// ---------- the encore loop ----------
await K(p, () => { const k = window.__kyoka; k.setProfile({ cheats: 4 }); k.select('kyon', 'road'); k.start(); window.__kyokaTest = true; k.setAuto('smart'); k.G.p.maxHp = 1e7; });
await run(p, 20);
const l0 = await K(p, () => { const G = window.__kyoka.G; return { endless: G.endless, chip: document.querySelector('#p6chip').textContent, era: G.eraN }; });
ok(l0.endless && /2007/.test(l0.chip), 'loop: starts at 芸歴 2007 (' + l0.chip + ')');
await K(p, () => window.__kyoka.skipTo(299)); await run(p, 3);
const l1 = await K(p, () => { const k = window.__kyoka, G = k.G; return { era: G.eraN, stage: G.stage, clr: k.has('clearRoad') }; });
ok(l1.era === 1 && l1.stage === 19 && l1.clr, 'loop: the era changes every 5 minutes; 5:00 clears the stage');
await K(p, () => window.__kyoka.skipTo(1199)); await run(p, 3);
await p.waitForTimeout(400); await p.screenshot({ path: out + 'p6-road.png' });
const l2 = await K(p, () => { const k = window.__kyoka; return { chip: document.querySelector('#p6chip').textContent, enc: k.has('encore') }; });
ok(/∞/.test(l2.chip) && l2.enc, 'loop: past 2027 the counter shows ∞ and the encore plays (' + l2.chip + ')');
await K(p, () => window.__kyoka.skipTo(1799)); await run(p, 3);
ok(await K(p, () => window.__kyoka.G.lap === 2 && window.__kyoka.has('loop2')), 'loop: lap 2 after six eras');
await K(p, () => window.__kyoka.end(false));
const end = await K(p, () => document.querySelector('#e-title').textContent);
ok(end === '本日の公演は終了しました', 'loop: game over reads 本日の公演は終了しました');
await p.waitForTimeout(300); await p.screenshot({ path: out + 'p6-road-end.png' });
await K(p, () => document.querySelector('#titlebtn').click());

// ---------- save code v6 ----------
const sv = await K(p, () => { const k = window.__kyoka, c = k.encode(k.profile), r = k.decode(c); return { len: c.replace(/-/g, '').length, ok: r && r.ok !== false, road: r && (r.profile || r).st && (r.profile || r).st.road }; });
ok(sv.len === 84 && sv.ok, 'save code is 84 characters and decodes');
await p.close();

// ---------- paged select on a phone ----------
const q = await page({ width: 375, height: 667 }, 'zh');
await K(q, () => { const k = window.__kyoka; k.setProfile({ cheats: 6 }); k.openSelect(); });
await q.waitForTimeout(300);
const sel = await K(q, () => ({ stages: document.querySelectorAll('#s-stages .scard').length, chars: document.querySelectorAll('#s-chars .scard').length, pgs: document.querySelectorAll('#select .pg').length }));
ok(sel.stages === 10 && sel.chars === 5 && sel.pgs === 5, 'select is paged (10 stages, 5 characters per page)');
await q.screenshot({ path: out + 'p6-select-1.png' });
await K(q, () => document.querySelectorAll('#s-l-stage .pg')[1].click());
const sel2 = await K(q, () => [...document.querySelectorAll('#s-stages .scard .tn')].map(e => e.textContent).join(','));
ok(sel2.startsWith('11,') && sel2.endsWith('19'), 'stage page 2 shows 11–19');
await q.screenshot({ path: out + 'p6-select-2.png' });
await q.close();

ok(errs.length === 0, 'no console errors (' + errs.slice(0, 3).join(' | ') + ')');
console.log(`\n${n} checks passed`);
await b.close();
