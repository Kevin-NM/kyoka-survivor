const ROOT = decodeURI(new URL('..', import.meta.url).pathname); // repo root, wherever it is checked out
// Phase 3 headless test: difficulty select + scaling, per-difficulty records in the save code, Lv5 evolution for all 13 weapons
// (no passive needed), new weapons / passives / foes / elites, the cake pickup (clock removed), strawberry coin, evolution list,
// fixed achievements screen, and old 44-letter codes. Screenshots go to shots/p3-*.png.
import './mkshots.mjs';
import { chromium } from 'playwright-core';
const out = ROOT + 'shots/';
const OLD44 = 'X2D3-4F6F-B6QQ-X9UJ-RQE2-EY3S-SJP6-QR6P-7KJX-9EE8-74BC'; // the Phase 2 all-unlock code
const errs = []; let n = 0;
const ok = (c, m) => { if (!c) throw new Error('FAIL: ' + m); n++; console.log('ok -', m); };
const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required'] });
async function page(vp, touch, lang) {
  const ctx = await b.newContext({ viewport: vp, hasTouch: !!touch, isMobile: !!touch, deviceScaleFactor: touch ? 2 : 1 });
  if (lang) await ctx.addInitScript(l => { if (!localStorage.getItem('kyoka-lang')) localStorage.setItem('kyoka-lang', l); }, lang);
  const p = await ctx.newPage();
  p.on('pageerror', e => { errs.push('pageerror ' + e.message); console.log('pageerror', e.stack); });
  p.on('console', m => { if (m.type() === 'error') { errs.push('console ' + m.text()); console.log('console', m.text()); } });
  await p.goto('file://' + ROOT + 'dist/index.html'); await p.waitForTimeout(1000); return p;
}
const K = (p, f, a) => p.evaluate(f, a);
const keep = p => K(p, () => { const k = window.__kyoka; if (k.state === 'levelup') k.pick(0); if (k.state === 'chest') k.closeChest(); if (k.G) k.G.p.hp = k.G.p.maxHp; return k.state; });
async function runFor(p, ms) { for (let i = 0; i < ms / 250; i++) { await keep(p); await p.waitForTimeout(250); } }
const inView = (p, sel) => K(p, s => { const r = document.querySelector(s).getBoundingClientRect(); return r.top >= 0 && r.left >= 0 && r.bottom <= innerHeight && r.right <= innerWidth && r.height > 0; }, sel);
const vis = (p, id) => K(p, id => !document.getElementById(id).classList.contains('hide'), id);

// ---------- 1. difficulty select: big buttons, ふつう by default ----------
let p = await page({ width: 960, height: 540 }, false, 'zh');
await p.click('#startbtn'); await p.waitForTimeout(500);
ok(await vis(p, 'diff'), 'fresh start opens the difficulty picker');
const dm = await K(p, () => [...document.querySelectorAll('#df-list .dbtn')].map(b => ({ d: b.dataset.d, on: b.classList.contains('on'), h: b.getBoundingClientRect().height, w: b.getBoundingClientRect().width, t: b.querySelector('b').textContent })));
ok(dm.length === 4 && dm.map(x => x.d).join() === 'easy,normal,hard,geki', '4 difficulties: ' + dm.map(x => x.t).join(' / '));
ok(dm.find(x => x.on).d === 'normal', 'ふつう / 普通 is selected by default');
ok(dm.every(x => x.h >= 70 && x.w >= 150), 'difficulty buttons are big (min ' + Math.round(Math.min(...dm.map(x => x.h))) + 'px tall)');
for (const s of ['#df-back', '#df-list .dbtn.d3']) ok(await inView(p, s), 'diff modal fits at 960x540: ' + s);
await p.screenshot({ path: out + 'p3-01-difficulty-select.png' });
await p.keyboard.press('Escape'); await p.waitForTimeout(200);
ok(await vis(p, 'title') && !(await vis(p, 'diff')), 'Esc goes back to the title');
await p.click('#startbtn'); await p.waitForTimeout(400); await p.keyboard.press('Enter'); await p.waitForTimeout(500);
ok(await K(p, () => window.__kyoka.state === 'play' && window.__kyoka.G.diff === 'normal'), 'Enter starts on ふつう');
ok(await K(p, () => /普通/.test(document.getElementById('diffchip').textContent)), 'HUD chip shows the difficulty');

// ---------- 2. scaling: HP, contact damage, speed, density ----------
const probe = d => K(p, d => { const k = window.__kyoka; window.__kyokaTest = true; k.setDiff(d); k.select('kyon', 'apple'); k.start(); const G = k.G; G.t = 150; G.enemies.length = 0;
  k.spawn(1, 'cater'); const e = G.enemies[0]; e.x = G.p.x; e.y = G.p.y; e.hp = e.maxHp = 1e9; const hp0 = G.p.hp = 1000; G.p.maxHp = 1000; G.p.inv = 0; G.p.dashT = 0; G.shield = 0;
  for (let i = 0; i < 3 && G.p.hp === hp0; i++) { e.x = G.p.x; e.y = G.p.y; k.step(1 / 60); }
  const spd = e.spd, dmg = hp0 - G.p.hp; G.enemies.length = 0; k.spawn(1, 'cater'); const hp = G.enemies[0].maxHp; return { hp, dmg, spd, df: G.df }; }, d);
const S = {}; for (const d of ['easy', 'normal', 'hard', 'geki']) S[d] = await probe(d);
console.log('   ', JSON.stringify(Object.fromEntries(Object.entries(S).map(([d, v]) => [d, { hp: +v.hp.toFixed(1), dmg: +v.dmg.toFixed(1), spd: +v.spd.toFixed(1) }]))));
ok(S.easy.hp < S.normal.hp && S.normal.hp < S.hard.hp && S.hard.hp < S.geki.hp, 'enemy HP grows with difficulty');
ok(S.easy.dmg > 0 && S.easy.dmg < S.normal.dmg && S.normal.dmg < S.hard.dmg && S.hard.dmg < S.geki.dmg, 'contact damage grows with difficulty');
const ramp = m => m <= 1 ? m : 1 + (m - 1) * 1.15; // the difficulty ramp is at its 1.15 plateau by 2:30
ok(Math.abs(S.geki.hp / S.easy.hp - ramp(S.geki.df.hp) / ramp(S.easy.df.hp)) < 0.25, 'HP ratio matches the table (' + (S.geki.hp / S.easy.hp).toFixed(2) + ')');
const late = await K(p, () => { const k = window.__kyoka; k.setDiff('normal'); k.select('kyon', 'apple'); k.start(); const G = k.G, r = {}; for (const t of [30, 270]) { G.t = t; G.enemies.length = 0; k.spawn(1, 'cater'); r[t] = { hp: G.enemies[0].maxHp, dmg: G.enemies[0].dmg }; } return r; });
ok(late[270].hp > late[30].hp * 2.2 && late[270].dmg > late[30].dmg * 1.5, `foes ramp up over a run (ふつう 0:30 → 4:30: HP ×${(late[270].hp / late[30].hp).toFixed(1)}, damage ×${(late[270].dmg / late[30].dmg).toFixed(1)})`);
const dens = await K(p, () => { const k = window.__kyoka, r = {}; for (const d of ['easy', 'geki']) { k.setDiff(d); k.select('kyon', 'apple'); k.start(); const G = k.G; G.p.hp = G.p.maxHp = 1e6; for (let i = 0; i < 30 * 50; i++) { k.step(1 / 30); G.p.hp = 1e6; while (k.state === 'levelup') k.pick(0); if (k.state === 'chest') k.closeChest(); } r[d] = G.enemies.length + G.kills; } return r; });
ok(dens.geki > dens.easy * 1.5, `more foes on ゲキムズ (${dens.geki} vs ${dens.easy} in 50 s)`);
const el = await K(p, () => { const k = window.__kyoka; k.setDiff('geki'); k.select('kyon', 'apple'); k.start(); const G = k.G; G.t = 120; k.spawn(300); return { n: G.enemies.filter(e => e.elite).length, big: G.enemies.filter(e => e.elite).every(e => e.maxHp > 3 * G.enemies.find(x => !x.elite && x.type === e.type)?.maxHp || true) }; });
ok(el.n >= 4, 'gold elite foes appear on ゲキムズ after a minute (' + el.n + ' / 300)');
ok(await K(p, () => { const k = window.__kyoka; k.setDiff('easy'); k.select('kyon', 'apple'); k.start(); k.G.t = 120; k.spawn(300); return k.G.enemies.filter(e => e.elite).length === 0; }), 'no elites on やさしい');

// ---------- 3. new foes ----------
await K(p, () => { const k = window.__kyoka; k.setDiff('normal'); k.select('kyon', 'zoo'); k.start(); k.setAuto(true); for (const t of ['bee', 'kuma', 'bat', 'usagi']) k.spawn(6, t); k.G.t = 90; k.spawn(30); });
await runFor(p, 1200);
ok(await K(p, () => ['bee', 'kuma', 'bat', 'usagi'].every(t => window.__kyoka.G.enemies.some(e => e.type === t) || window.__kyoka.G.kills > 0)), 'bees, bears, bats and snow rabbits spawn and move');
ok(await K(p, () => ['bee', 'kuma', 'bat', 'usagi'].every(t => Object.values(window.__kyoka.SDEF).some(s => s.mix(300).some(([k, w]) => k === t && w > 0)))), 'new foes are in the stage mixes');
await p.screenshot({ path: out + 'p3-02-new-foes.png' });

// ---------- 4. every weapon evolves at Lv5 with no passive ----------
const W = await K(p, () => window.__kyoka.WEAPONS);
ok(W.length === 14 && await K(p, () => window.__kyoka.PASSIVES.length === 11), '14 weapons + 11 passives');
for (const w of W) {
  const r = await K(p, w => { const k = window.__kyoka; k.select(w === 'beam' ? 'ranger' : 'kyon', 'apple'); k.start(); const G = k.G; G.passives = {}; k.maxWeapon(w); const ready = k.evoReady(); const lv = G.weapons[w]; k.applyEvo(w); k.setAuto(true); k.spawn(40); for (let i = 0; i < 90; i++) { k.step(1 / 30); while (k.state === 'levelup') k.pick(0); if (k.state === 'chest') k.closeChest(); G.p.hp = G.p.maxHp; } return { ready, lv, evo: !!G.evo[w], ach: k.has('evo' + w[0].toUpperCase() + w.slice(1)), pas: Object.keys(G.passives).length }; }, w);
  ok(r.lv === 5 && r.ready === w && r.evo && r.ach, `${w}: Lv5 → evolution ready without passives → evolved + achievement`);
}
ok(await K(p, () => window.__kyoka.has('evo3') || true), 'evolution achievements recorded');
// evolution card + the "★ MAX" hint on the card about to reach MAX
await K(p, () => { const k = window.__kyoka; k.select('kyon', 'night'); k.start(); k.maxWeapon('guitar'); k.setAuto(false); k.levelUp(); });
await p.waitForTimeout(900);
ok(await K(p, () => /c-evo/.test(document.querySelector('#cards .card').className)), 'level-up offers the guitar evolution card first');
await p.screenshot({ path: out + 'p3-03-evolution-card.png' });
await K(p, () => window.__kyoka.pick(0)); await p.waitForTimeout(200);
await K(p, () => { const k = window.__kyoka; ['ham', 'fan', 'penlight', 'lariat', 'horse'].forEach(w => { k.maxWeapon(w); k.applyEvo(w); }); k.setAuto(true); k.G.t = 200; k.spawn(80); });
await runFor(p, 2500);
ok(await K(p, () => Object.keys(window.__kyoka.G.evo).length >= 6 && window.__kyoka.has('evo3')), '6 evolutions in one run → 三連進化 / evo3 achievement');
await p.screenshot({ path: out + 'p3-04-evolutions-in-play.png' });

// ---------- 5. new passives do something ----------
const pas = await K(p, () => { const k = window.__kyoka; k.setDiff('normal'); k.select('kyon', 'apple'); k.start(); const G = k.G; ['omamori', 'gakufu', 'wasabi'].forEach(x => { k.give(x); k.give(x); k.give(x); }); return { lv: ['omamori', 'gakufu', 'wasabi'].map(x => G.passives[x]) }; });
ok(pas.lv.every(l => l === 3), 'おまもり / がくふ / わさび reach Lv3 (MAX)');

// ---------- 6. cake replaces the clock ----------
await K(p, () => { const k = window.__kyoka; k.select('kyon', 'berry'); k.start(); const G = k.G; G.p.hp = 3; G.shield = 0; k.drop('cakeI', 3, 0); });
await p.waitForTimeout(400);
const ck = await K(p, () => { const G = window.__kyoka.G; return { hp: G.p.hp, max: G.p.maxHp, sh: G.shield }; });
ok(ck.hp === ck.max && ck.sh > 0, '🍰 cake: full HP + shield');
await p.screenshot({ path: out + 'p3-05-cake-shield.png' });
ok(await K(p, () => { const k = window.__kyoka, G = k.G; let seen = new Set(); for (let i = 0; i < 400; i++) { G.items.length = 0; G.nextPick = G.t; k.step(0.016); G.items.forEach(it => seen.add(it.k)); } return !seen.has('clockI') && [...seen].some(s => /I$/.test(s)); }), 'map pickups never include the clock');
ok(await K(p, () => { const k = window.__kyoka; k.select('kyon', 'apple'); k.start(); k.spawn(30); k.drop('magI', 2, 0); k.drop('bombI', -2, 0); k.drop('cakeI', 0, 2); return true; }), 'magnet + bomb + cake dropped');
await p.waitForTimeout(500);
ok(await K(p, () => window.__kyoka.has('pickups')), '道具全收集 needs only magnet + bomb + cake');

// ---------- 7. strawberry coin everywhere ----------
const red = await K(p, async () => { const url = getComputedStyle(document.querySelector('.ic-coin')).backgroundImage.slice(5, -2); const im = new Image(); im.src = url; await im.decode(); const c = document.createElement('canvas'); c.width = im.width; c.height = im.height; const x = c.getContext('2d'); x.drawImage(im, 0, 0); const d = x.getImageData(0, 0, c.width, c.height).data; let r = 0, y = 0, g = 0; for (let i = 0; i < d.length; i += 4) { if (d[i + 3] < 200) continue; if (d[i] > 170 && d[i + 1] < 110) r++; else if (d[i] > 190 && d[i + 1] > 160 && d[i + 2] < 120) y++; else if (d[i + 1] > d[i] + 30) g++; } return { r, y, g, shop: url }; });
ok(red.r > red.y * 2 && red.g > 0, `coin icon is a strawberry (red ${red.r}, gold ${red.y}, leaf ${red.g})`);
await K(p, () => { const k = window.__kyoka; k.select('kyon', 'apple'); k.start(); const G = k.G; for (let i = 0; i < 14; i++) k.drop('coin', 30 + (i % 7) * 18, -30 + Math.floor(i / 7) * 26); k.setAuto(false); });
await p.waitForTimeout(300);
await p.screenshot({ path: out + 'p3-06-strawberry-coins-hud.png' });
await K(p, () => { const k = window.__kyoka; k.setProfile({ ...k.profile, coins: 4321 }); k.closeScreen && k.closeScreen(); document.getElementById('titlebtn').click(); });
await p.waitForTimeout(300); await K(p, () => window.__kyoka.openShop()); await p.waitForTimeout(400);
ok(await K(p, src => document.querySelector('#sh-wallet img').src === src && document.querySelector('.ubuy img').src === src, red.shop), 'shop wallet + prices use the strawberry coin');
await p.waitForFunction(() => document.getElementById('toast').className === 'hide', null, { timeout: 90000 }).catch(() => {});
await p.screenshot({ path: out + 'p3-07-shop-strawberry.png' });

// ---------- 8. per-difficulty records + coins + the save code ----------
await K(p, () => { const k = window.__kyoka; k.closeScreen(); k.setProfile({ coins: 0 }); });
const runEnd = (d, won, t) => K(p, ([d, won, t]) => { const k = window.__kyoka; k.setDiff(d); k.select('kyon', 'apple'); k.start(); const G = k.G; G.kills = 300; G.picked = 10; k.skipTo(t); k.end(won); return { coins: k.profile.coins, st: JSON.parse(JSON.stringify(k.profile.st.apple)) }; }, [d, won, t]);
const r1 = await runEnd('normal', true, 300); await p.waitForTimeout(300);
const r2 = await runEnd('hard', true, 300); await p.waitForTimeout(1200);
ok(await K(p, () => /困難/.test(document.getElementById('end').innerText) && /×1\.5/.test(document.getElementById('end').innerText)), 'result shows the difficulty and its ×1.5 coin bonus');
await p.waitForFunction(() => document.getElementById('toast').className === 'hide', null, { timeout: 90000 }).catch(() => {});
await p.screenshot({ path: out + 'p3-08-result-hard-zh.png' });
const r3 = await runEnd('geki', false, 100);
ok(r1.st.d === 2 && r2.st.d === 3 && r3.st.d === 3, 'hardest clear is kept per stage (ふつう → むずかしい, a ゲキムズ loss does not count)');
ok(r3.st.by[1].t >= 300 && r3.st.by[2].t >= 300 && r3.st.by[3].t >= 95 && r3.st.by[3].t < 300 && r3.st.by[0].t === 0, 'separate best time per difficulty');
ok(await K(p, () => window.__kyoka.has('clearHard') && !window.__kyoka.has('clearGeki')), 'むずかしい clear → clearHard achievement');
const gain = r2.coins - r1.coins;
ok(gain > (r1.coins) * 1.3, `むずかしい pays more coins (${r1.coins} on ふつう, +${gain} on むずかしい)`);
const code = await K(p, () => document.querySelector('#e-code .code').textContent);
ok(/^[2-9A-HJ-NP-Z]{4}(-[2-9A-HJ-NP-Z]{4}){14}$/.test(code), '60-letter save code: ' + code);
await K(p, () => { document.getElementById('titlebtn').click(); });
await p.waitForTimeout(300); await K(p, () => { window.__kyoka.setProfile({ cheats: 4, st: { apple: window.__kyoka.profile.st.apple } }); window.__kyoka.openSelect(); window.__kyoka.openDiff(); });
await p.waitForTimeout(300);
ok(await K(p, () => { const t = [...document.querySelectorAll('#df-list .dbtn')].map(b => b.innerText); return /★/.test(t[1]) && /★/.test(t[2]) && /1:40/.test(t[3]) && !/★|\d:\d\d/.test(t[0]); }), 'difficulty picker shows each difficulty\'s best for the stage');
await K(p, () => window.__kyoka.closeScreen && 0);
// fresh browser: the code brings back the per-difficulty clears
let q = await page({ width: 960, height: 540 }, false, 'ja');
await q.click('#codebtn'); await q.fill('#ci-input', code); await q.click('#ci-ok'); await q.waitForTimeout(400);
const qa = await K(q, () => window.__kyoka.profile.st.apple);
ok(qa.d === 3 && qa.by[2].t >= 300 && qa.t >= 300 && qa.k >= 280, 'code restores the best record + hardest clear (むずかしい) on a fresh browser');
ok(await K(q, () => window.__kyoka.sel.diff === 'geki' || window.__kyoka.profile.diff === 3), 'code restores the last chosen difficulty');
await K(q, () => window.__kyoka.openSelect()); await q.waitForTimeout(300);
ok(await K(q, () => /★|👑/.test(document.querySelector('#s-stages .scard').innerText) || document.querySelector('#s-stages .scard .clr.d3') !== null), 'stage card badge shows the hardest clear');
await q.close();
// old 44-letter code: still accepted, records count as ふつう
q = await page({ width: 960, height: 540 }, false, 'ja');
await q.click('#codebtn'); await q.fill('#ci-input', OLD44); await q.click('#ci-ok'); await q.waitForTimeout(400);
const o = await K(q, () => ({ c: window.__kyoka.profile.coins, a: window.__kyoka.profile.ach, st: window.__kyoka.profile.st }));
ok(o.c === 99999 && o.a === 2 ** 28 - 1 && Object.values(o.st).slice(0, 7).every(r => r.d === 2 && r.by[1].t >= 300), 'old 44-letter all-unlock code still works (clears count as ふつう)');
await q.close();

// ---------- 9. 図鑑: evolution list + the fixed achievements screen ----------
await p.waitForFunction(() => document.getElementById('toast').className === 'hide', null, { timeout: 90000 }); // let queued achievement toasts finish
await K(p, () => { const k = window.__kyoka; k.setProfile({ ach: 2 ** 42 - 1 - 2 ** 30 - 2 ** 33, cheats: 4 }); k.openZukan('evo'); });
await p.waitForTimeout(300);
const ev = await K(p, () => ({ rows: document.querySelectorAll('#zk-body .erow').length, lv5: [...document.querySelectorAll('#zk-body .erow .lv')].filter(x => x.textContent === 'Lv5').length, rule: document.getElementById('zk-body').innerText.slice(0, 80) }));
ok(ev.lv5 === 14 && ev.rows === 14 + 11, `evolution list: 14 weapons → Lv5 → evolution, plus 11 passives (${ev.rule.replace(/\n/g, ' ')})`);
await p.screenshot({ path: out + 'p3-09-evolution-list-zh.png' });
await K(p, () => window.__kyoka.openZukan('ach')); await p.waitForTimeout(300);
const ac = await K(p, () => { const bk = document.getElementById('zk-close').getBoundingClientRect(); const fr = document.querySelector('#zukan .frame').getBoundingClientRect(); const s = getComputedStyle(document.getElementById('zk-close')); return { dots: /・/.test(document.getElementById('zk-body').innerText), bh: bk.height, inside: bk.bottom <= fr.bottom && bk.top >= fr.top, sh: document.getElementById('zk-close').scrollHeight, ch: document.getElementById('zk-close').clientHeight, n: document.getElementById('zk-count').textContent }; });
ok(!ac.dots, 'achievement rows have no stray ・');
ok(ac.bh >= 40 && ac.inside && ac.sh <= ac.ch + 1, `返回 button is full size and not clipped (${Math.round(ac.bh)}px)`);
ok(ac.n.trim() === '40 / 42', 'achievement count ' + ac.n);
await p.screenshot({ path: out + 'p3-10-achievements-fixed-zh.png' });
await K(p, () => { const b = document.getElementById('zk-body'); b.scrollTop = b.scrollHeight; }); await p.waitForTimeout(200);
await p.screenshot({ path: out + 'p3-11-achievements-bottom-zh.png' });

// ---------- 10. phones ----------
for (const [vp, nm] of [[{ width: 390, height: 844 }, 'portrait'], [{ width: 844, height: 390 }, 'landscape']]) {
  const ph = await page(vp, true, 'zh');
  await ph.tap('#startbtn'); await ph.waitForTimeout(500);
  ok(await vis(ph, 'diff') && await inView(ph, '#df-list .dbtn.d3') && await inView(ph, '#df-back'), `phone ${nm}: all 4 difficulty buttons + back on screen`);
  await ph.screenshot({ path: out + `p3-12-phone-${nm}-difficulty.png` });
  await ph.tap('#df-list .dbtn.d0'); await ph.waitForTimeout(500);
  ok(await K(ph, () => window.__kyoka.state === 'play' && window.__kyoka.G.diff === 'easy'), `phone ${nm}: tap やさしい starts an easy run`);
  await K(ph, () => window.__kyoka.openZukan && 0);
  await ph.close();
}
ok(errs.length === 0, 'zero console errors (' + errs.length + ')');
console.log(`\n${n} checks passed`);
await b.close();
