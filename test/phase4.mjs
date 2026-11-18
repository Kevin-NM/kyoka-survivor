const ROOT = decodeURI(new URL('..', import.meta.url).pathname); // repo root, wherever it is checked out
// Phase 4 headless test (花のチャペル batch): ドレスきょん / ゴスロリきょん, the 花のチャペル stage (foes, props, boss, ring cake),
// wedding foods + tapioca speed boost, the サイリウム weapon and its ミニライブ evolution, the yakiniku dad line, v5 save codes.
// Screenshots go to shots/p4-*.png.
import './mkshots.mjs';
import { chromium } from 'playwright-core';
const out = ROOT + 'shots/';
const ALL = '77C5-TQAS-J6Z9-UKUT-MDBH-MJHW-X8ED-49PW-23DA-69H4-QRYX-AHPY-CU2S-KEZ7-4UUW'; // the v5 all-unlock code (README)
const OLD52 = '2RKM-ZBUS-2WAC-WYDY-JPBC-ZS8T-9PWJ-PH4N-4PET-8ZH7-9893-AFY5-JQ3D'; // the Phase 3 all-unlock code
const errs = []; let n = 0;
const ok = (c, m) => { if (!c) throw new Error('FAIL: ' + m); n++; console.log('ok -', m); };
const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required'] });
async function page(vp, lang) {
  const ctx = await b.newContext({ viewport: vp });
  if (lang) await ctx.addInitScript(l => { if (!localStorage.getItem('kyoka-lang')) localStorage.setItem('kyoka-lang', l); }, lang);
  const p = await ctx.newPage();
  p.on('pageerror', e => { errs.push('pageerror ' + e.message); console.log('pageerror', e.stack); });
  p.on('console', m => { if (m.type() === 'error') { errs.push('console ' + m.text()); console.log('console', m.text()); } });
  await p.goto('file://' + ROOT + 'dist/index.html'); await p.waitForTimeout(1000); return p;
}
const K = (p, f, a) => p.evaluate(f, a);
const keep = p => K(p, () => { const k = window.__kyoka; if (k.state === 'levelup') k.pick(0); if (k.state === 'chest') k.closeChest(); if (k.G) k.G.p.hp = k.G.p.maxHp; return k.state; });
// no level-up cards in the way of a screenshot
async function snap(p, name) { await K(p, () => { const k = window.__kyoka; if (k.G) { k.G.xpNext = 1e9; k.G.pending = 0; } while (k.state === 'levelup') k.pick(0); }); await p.waitForTimeout(800); await p.screenshot({ path: out + name }); }
async function runFor(p, ms) { for (let i = 0; i < ms / 250; i++) { await keep(p); await p.waitForTimeout(250); } }

let p = await page({ width: 960, height: 540 }, 'ja');
// ---------- 1. save codes: old v4 still loads, new v5 unlocks everything ----------
const old = await K(p, c => { const d = window.__kyoka.decode(c); return d.ok && d.old && d.profile.st.chapel.t === 0; }, OLD52);
ok(old, 'the old 52-letter all-unlock code still decodes (chapel not cleared)');
const lockedBefore = await K(p, c => { const k = window.__kyoka; k.setProfile(k.decode(c).profile); k.openSelect(); return [...document.querySelectorAll('#select .scard.locked')].map(b => b.dataset.id); }, OLD52);
ok(lockedBefore.includes('dress') && !lockedBefore.includes('chapel') && !lockedBefore.includes('goth'), 'with the old code: chapel open (night cleared), ゴスロリ open (hard clears), ドレス still locked: ' + lockedBefore.join());
await K(p, c => { const k = window.__kyoka; k.closeScreen && k.closeScreen(); k.setProfile(k.decode(c).profile); k.openSelect(); }, ALL);
await p.waitForTimeout(400);
ok(await K(p, () => document.querySelectorAll('#select .scard.locked').length === 0 && !!document.querySelector('#select .scard[data-id="chapel"]') && !!document.querySelector('#select .scard[data-id="china"]') && !!document.querySelector('#select .scard[data-id="dress"]') && !!document.querySelector('#select .scard[data-id="goth"]')), 'v5 all-unlock code opens 5 characters + 9 stages');
await K(p, () => { document.querySelector('#select .scard[data-id="dress"]').click(); }); await p.waitForTimeout(200);
await K(p, () => { document.querySelector('#select .scard[data-id="chapel"]').click(); }); await p.waitForTimeout(300);
await p.screenshot({ path: out + 'p4-01-select-dress-chapel.png' });

// ---------- 2. title preview shows the chosen character ----------
await K(p, () => { const k = window.__kyoka; k.closeScreen(); });
await p.waitForTimeout(700);
await p.screenshot({ path: out + 'p4-02-title-dress.png' });

// ---------- 3. ドレスきょん in the chapel: glitter bursts ----------
const dr = await K(p, () => { const k = window.__kyoka; window.__kyokaTest = true; k.setDiff('normal'); k.select('dress', 'chapel'); k.start(); const G = k.G; return { spr: G.spr, g: G.stage, song: G.D.song, mag: G.p.magnet }; });
ok(dr.spr === 'dr' && dr.g === 7 && dr.song === 'chapel', 'ドレスきょん uses the dress sprite in 花のチャペル (ground 7, chapel song)');
const kills = await K(p, () => { const k = window.__kyoka, G = k.G; G.t = 70; G.weapons = {}; k.setAuto(false); let rings = 0;
  for (let i = 0; i < 60 * 9; i++) { if (i % 60 === 0) for (let j = 0; j < 6; j++) k.spawn(1, 'tulip'), Object.assign(G.enemies[G.enemies.length - 1], { x: G.p.x + 20 - j * 8, y: G.p.y + 10 }); const r0 = G.rings.length; k.step(1 / 60); G.p.hp = G.p.maxHp; if (G.rings.length > r0) rings++; }
  return rings > 0 ? G.kills : 0; });
ok(kills > 0, 'glitter bursts alone (no weapons) defeat chapel foes (' + kills + ' kills)');
ok(await K(p, () => ['tulip', 'heartb', 'bouq'].every(t => window.__kyoka.SDEF.chapel.mix(300).some(([k, w]) => k === t && w > 0))), 'tulips, flying hearts and bouquets are in the chapel mix');
await K(p, () => { const k = window.__kyoka; for (const t of ['tulip', 'heartb', 'bouq']) k.spawn(5, t); k.setAuto(false); });
await p.waitForTimeout(500);
await snap(p, 'p4-03-dress-in-chapel.png');

// ---------- 4. boss: wedding bell → ring cake ----------
const boss = await K(p, () => window.__kyoka.spawnBoss());
ok(boss === 'bell', 'the chapel boss is the wedding bell');
await K(p, () => { const k = window.__kyoka, G = k.G; G.boss.x = G.p.x + 70; G.boss.y = G.p.y - 10; G.boss.atk = 0; });
const atk = await K(p, () => { const k = window.__kyoka, G = k.G; let ring = 0, hearts = 0; for (let i = 0; i < 60 * 8; i++) { k.step(1 / 60); G.p.hp = G.p.maxHp; while (k.state === 'levelup') k.pick(0); if (G.hazards.length) ring = 1; if (G.ebul.some(b => b.k === 'heartb0')) hearts = 1; if (ring && hearts) break; } return ring + hearts; });
ok(atk === 2, 'the bell alternates a ringing shock wave and a spray of hearts');
await snap(p, 'p4-04-bell-boss.png');
await K(p, () => window.__kyoka.killBoss());
ok(await K(p, () => window.__kyoka.G.items.some(i => i.k === 'ringcake') && !window.__kyoka.G.items.some(i => i.k === 'chest')), 'the bell drops a ring-shaped cake instead of a chest');
await p.waitForTimeout(300);
await snap(p, 'p4-05-ring-cake-drop.png');
await K(p, () => { const k = window.__kyoka, G = k.G; G.gems.length = 0; G.enemies.length = 0; while (k.state === 'levelup') k.pick(0); G.pending = 0; const it = G.items.find(i => i.k === 'ringcake'); G.p.x = it.x; G.p.y = it.y; });
for (let i = 0; i < 8 && await K(p, () => window.__kyoka.state) !== 'chest'; i++) { await K(p, () => { if (window.__kyoka.state === 'levelup') window.__kyoka.pick(0); }); await p.waitForTimeout(150); }
const ch = await K(p, () => ({ st: window.__kyoka.state, t: document.getElementById('ch-title').textContent, ach: window.__kyoka.G.newAch.includes('ringCake') || window.__kyoka.has('ringCake') }));
ok(ch.st === 'chest' && ch.t === 'リングケーキ！' && ch.ach, 'picking it up opens the リングケーキ treasure + achievement ' + JSON.stringify(ch));
await p.waitForTimeout(2500);
await p.screenshot({ path: out + 'p4-06-ring-cake-open.png' });
await K(p, () => window.__kyoka.closeChest());

// ---------- 5. foods ----------
const food = await K(p, () => { const k = window.__kyoka, G = k.G; G.enemies.length = 0; const r = {};
  for (const f of ['rbeef', 'steak', 'nikujaga', 'buri']) { G.p.hp = 1; k.drop(f); k.step(1 / 60); r[f] = G.p.hp - 1; }
  const sp0 = G.p.x; k.drop('tapi'); k.step(1 / 60); r.speedT = G.speedT; r.gourmet = G.newAch.includes('gourmet') || k.has('gourmet');
  G.p.hp = 1; k.drop('tsand'); k.step(1 / 60); r.tsand = G.p.hp - 1; G.p.hp = 1; k.drop('mala'); k.step(1 / 60); r.mala = G.p.hp - 1; r.fireT = G.fireT;
  k.spawn(1, 'tulip'); const e = G.enemies[G.enemies.length - 1]; e.x = G.p.x + 20; e.y = G.p.y; e.hp = e.maxHp = 1e6; for (let i = 0; i < 40; i++) { e.x = G.p.x + 20; e.y = G.p.y; k.step(1 / 60); } r.burn = 1e6 - e.hp; G.enemies.length = 0;
  G.p.hp = 1; k.drop('yaki'); k.step(1 / 60); r.yaki = G.p.hp === G.p.maxHp; r.banner = document.getElementById('banner').textContent; return r; });
ok(food.rbeef === 35 && food.steak === 45 && food.nikujaga === 25 && food.buri === 25, 'roast beef 35 / steak 45 / 肉じゃが 25 / ぶり大根 25 HP');
ok(food.speedT > 5 && food.gourmet, 'タピオカミルクティー gives a speed boost; eating all four dishes gives ごちそうさま！');
ok(food.tsand === 30 && food.mala === 20 && food.fireT > 5 && food.burn > 0, `台湾サンドイッチ 30 HP; 麻辣スープ 20 HP + fire aura (${food.burn | 0} damage to a foe in 0.66 s)`);
ok(food.yaki && /お父さん/.test(food.banner), 'yakiniku heals fully with the dad line: ' + food.banner);
const fast = await K(p, () => { const k = window.__kyoka, G = k.G; G.auto = false; const m = []; for (const st of [0, 6]) { G.speedT = st; G.p.dashT = 0; const x0 = G.p.x; window.dispatchEvent(new KeyboardEvent('keydown', { code: 'ArrowRight' })); for (let i = 0; i < 30; i++) k.step(1 / 60); window.dispatchEvent(new KeyboardEvent('keyup', { code: 'ArrowRight' })); m.push(G.p.x - x0); } return m; });
ok(fast[1] > fast[0] * 1.25, `tapioca makes her faster (${fast[0].toFixed(1)} → ${fast[1].toFixed(1)})`);
const FD = ['rbeef', 'steak', 'nikujaga', 'buri', 'tapi', 'tsand', 'mala'];
for (const f of FD) await K(p, ([f, i]) => window.__kyoka.drop(f, -90 + i * 30, 40), [f, FD.indexOf(f)]);
await K(p, () => { window.__kyoka.G.fireT = 6; });
await p.waitForTimeout(400);
await snap(p, 'p4-07-foods.png');

// ---------- 6. サイリウム → ミニライブ ----------
const cy = await K(p, () => { const k = window.__kyoka; k.select('kyon', 'chapel'); k.start(); const G = k.G; k.give('cyalume'); k.spawn(30); for (let i = 0; i < 120; i++) k.step(1 / 60); return { n: G.cys.length, w: G.weapons.cyalume, k: G.kills }; });
ok(cy.w === 1 && cy.n > 0, 'サイリウム throws glowsticks that stay glowing (' + cy.n + ')');
const ev = await K(p, () => { const k = window.__kyoka, G = k.G; k.maxWeapon('cyalume'); const ready = k.evoReady(); k.applyEvo('cyalume'); G.enemies.length = 0; k.spawn(40); for (let i = 0; i < 240; i++) { k.step(1 / 60); G.p.hp = G.p.maxHp; } return { ready, evo: G.evo.cyalume, ach: G.newAch.includes('evoCyalume') || k.has('evoCyalume'), n: G.cys.length }; });
ok(ev.ready === 'cyalume' && ev.evo && ev.ach && ev.n >= 6, 'Lv5 サイリウム evolves into ミニライブ (' + ev.n + ' glowsticks) + achievement');
await K(p, () => { const k = window.__kyoka; k.spawn(20); });
await runFor(p, 1500);
await snap(p, 'p4-08-minilive.png');

// ---------- 7. ゴスロリきょん ----------
const gs = await K(p, () => { const k = window.__kyoka; k.select('goth', 'night'); k.start(); const G = k.G; return { spr: G.spr, w: Object.keys(G.weapons).sort().join(), hp: G.p.maxHp }; });
ok(gs.spr === 'gs' && /berry/.test(gs.w) && /guitar/.test(gs.w), 'ゴスロリきょん starts with strawberries + guitar (' + JSON.stringify(gs) + ')');
await K(p, () => { const k = window.__kyoka; k.select('goth', 'chapel'); k.start(); const G = k.G; G.t = 40; k.spawn(8, 'tulip'); for (let i = 0; i < 90; i++) k.step(1 / 60); });
await snap(p, 'p4-09-goth.png');

// ---------- 8. zh / en texts for the new things ----------
const p2 = await page({ width: 960, height: 540 }, 'zh');
await K(p2, c => { const k = window.__kyoka; k.setProfile(k.decode(c).profile); k.openSelect(); }, ALL);
await p2.waitForTimeout(400);
const zt = await K(p2, () => document.getElementById('select').textContent);
ok(/花之教堂/.test(zt) && /ドレスきょん/.test(zt) && /ゴスロリきょん/.test(zt), 'zh: 花之教堂, character names stay in Japanese');
await p2.screenshot({ path: out + 'p4-10-select-zh.png' });
await K(p2, () => { const k = window.__kyoka; k.closeScreen(); k.openZukan(); });
await p2.waitForTimeout(400);
ok(await K(p2, () => /擂台蛋糕|夢想中的婚禮/.test(document.body.textContent) && /和爸爸吃燒肉/.test(document.body.textContent) && /好吃的麻辣湯/.test(document.body.textContent)), 'zh 図鑑 shows the wedding entries');
await p2.screenshot({ path: out + 'p4-11-zukan-zh.png' });

// ---------- 9. 中華街: stage, foes, dragon boss, Chinese-food pickups ----------
const cn = await K(p, () => { const k = window.__kyoka; k.select('kyon', 'china'); k.start(); const G = k.G; return { g: G.stage, song: G.D.song, boss: G.D.boss }; });
ok(cn.g === 8 && cn.song === 'china' && cn.boss === 'cdragon', '中華街: ground 8, its own song and the firecracker dragon boss');
ok(await K(p, () => ['gyoza', 'lantb', 'capsb'].every(t => window.__kyoka.SDEF.china.mix(300).some(([k, w]) => k === t && w > 0))), 'dumplings, lantern ghosts and capsules are in the 中華街 mix');
await K(p, () => { const k = window.__kyoka, G = k.G; G.t = 60; for (const t of ['gyoza', 'lantb', 'capsb']) k.spawn(5, t); for (let i = 0; i < 60; i++) { k.step(1 / 60); G.p.hp = G.p.maxHp; } });
await snap(p, 'p4-12-chinatown.png');
ok(await K(p, () => window.__kyoka.spawnBoss()) === 'cdragon', 'the 中華街 boss spawns');
const dra = await K(p, () => { const k = window.__kyoka, G = k.G; G.boss.x = G.p.x + 110; G.boss.y = G.p.y; G.boss.atk = 0; let fire = 0, caps = 0; for (let i = 0; i < 60 * 8; i++) { k.step(1 / 60); G.p.hp = G.p.maxHp; while (k.state === 'levelup') k.pick(0); if (G.ebul.some(b => b.k === 'fireb')) fire = 1; if (G.ebul.some(b => b.k.startsWith('capsb'))) caps = 1; if (fire && caps) break; } return fire + caps; });
ok(dra === 2, 'the dragon alternates fireballs and a ring of capsules');
await snap(p, 'p4-13-dragon-boss.png');
await K(p, () => { const k = window.__kyoka; k.killBoss(); const G = k.G; G.items.length = 0; G.gems.length = 0; G.enemies.length = 0; G.ebul.length = 0; G.xpNext = 1e9; while (k.state === 'levelup') k.pick(0); });
const cf = await K(p, () => { const k = window.__kyoka, G = k.G; G.enemies.length = 0; const r = {}; for (const f of ['aman', 'xlb', 'jpai']) { G.p.hp = 1; k.drop(f); k.step(1 / 60); r[f] = G.p.hp - 1; if (f === 'xlb') r.hot = document.getElementById('banner').textContent; } return r; });
ok(cf.aman === 25 && cf.xlb === 20 && cf.jpai === 50 && /あちち/.test(cf.hot), 'アニマルまん 25 / 焼き小籠包 20 + あちちっ！ / 大鶏排 50: ' + cf.hot);
for (const [f, i] of [['aman', 0], ['xlb', 1], ['jpai', 2]]) await K(p, ([f, i]) => window.__kyoka.drop(f, -40 + i * 40, 36), [f, i]);
await snap(p, 'p4-14-china-foods.png');

// GitHub link on the title screen: new tab, labelled per language, clear of the language pills and the logo
for (const [vp, lang, want] of [[{ width: 960, height: 540 }, 'ja', 'GitHub で みる'], [{ width: 390, height: 844 }, 'zh', '在 GitHub 上看'], [{ width: 844, height: 390 }, 'en', 'View on GitHub']]) {
  const gp = await page(vp, lang);
  const g = await K(gp, () => { const a = document.querySelector('#ghbtn'), r = a.getBoundingClientRect(), L = document.querySelector('.langs').getBoundingClientRect(), t = document.querySelector('#t-title').getBoundingClientRect(), s = document.querySelector('#startbtn').getBoundingClientRect();
    return { href: a.href, tgt: a.target, rel: a.rel, label: a.getAttribute('aria-label'), w: r.width, inView: r.right <= innerWidth && r.top >= 0, clear: !(r.left < L.right && r.top < L.bottom) && !(r.left < t.right && r.right > t.left && r.bottom > t.top) && r.bottom < s.top }; });
  ok(g.href === 'https://github.com/Kevin-NM/kyoka-survivor' && g.tgt === '_blank' && /noopener/.test(g.rel) && g.label === want && g.w > 20 && g.inView && g.clear, `${vp.width}x${vp.height} ${lang}: GitHub button "${want}" opens the repo in a new tab, out of the way`);
  if (vp.width === 960) await gp.screenshot({ path: out + 'p5-title-github.png' });
  await gp.context().close();
}

ok(errs.length === 0, 'zero console errors (' + errs.length + ')');
console.log(n + ' phase 4 checks passed');
await b.close();
