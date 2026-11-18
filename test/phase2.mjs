const ROOT = decodeURI(new URL('..', import.meta.url).pathname); // repo root, wherever it is checked out
// Phase 2 headless test: 7 stages + bosses, unlock chain, pickups, chest roulette, new weapons/evolutions,
// shop refund, secret codes, per-stage records, all-unlock code on a fresh browser, 960x540 fold checks, phone layouts.
import './mkshots.mjs';
import { chromium } from 'playwright-core';
import fs from 'fs';
const diffGo = async (pg, d = 'normal', tap = false) => { await pg.waitForTimeout(150); if (await pg.evaluate(() => !document.getElementById('diff').classList.contains('hide'))) { const s = '#df-list .dbtn[data-d="' + d + '"]'; if (tap) await pg.tap(s); else await pg.click(s); await pg.waitForTimeout(400); } };
const out = ROOT + 'shots/';
const README = fs.readFileSync(ROOT + 'README.md', 'utf8');
const ALL = (README.match(/<!--ALLCODE-->`([A-Z0-9-]+)`/) || [])[1];
const errs = [], results = [];
const ok = (c, m) => { if (!c) throw new Error('FAIL: ' + m); results.push(m); console.log('ok -', m); };
const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required'] });
async function page(vp, touch) {
  const ctx = await b.newContext({ viewport: vp, hasTouch: !!touch, isMobile: !!touch, deviceScaleFactor: touch ? 2 : 1 });
  const p = await ctx.newPage();
  p.on('pageerror', e => { errs.push('pageerror ' + e.message); console.log('pageerror', e.stack); });
  p.on('console', m => { if (m.type() === 'error') { errs.push('console ' + m.text()); console.log('console', m.text()); } });
  await p.goto('file://' + ROOT + 'dist/index.html'); await p.waitForTimeout(1000); return p;
}
const K = (p, f, a) => p.evaluate(f, a);
const keep = p => K(p, () => { const k = window.__kyoka; if (k.state === 'levelup') k.pick(0); if (k.state === 'chest') k.closeChest(); if (k.G) k.G.p.hp = k.G.p.maxHp; return k.state; });
async function runFor(p, ms) { for (let i = 0; i < ms / 250; i++) { await keep(p); await p.waitForTimeout(250); } }
const inView = (p, sel, h) => K(p, ([s, h]) => { const r = document.querySelector(s).getBoundingClientRect(); return r.top >= 0 && r.bottom <= h && r.height > 0; }, [sel, h]);

// ---------- 1. all-unlock code from the README on a fresh browser ----------
ok(ALL && ALL.length === 74, 'README has the all-unlock code: ' + ALL);
let p = await page({ width: 960, height: 540 });
ok(await K(p, () => !localStorage.getItem('kyoka-save-v3') && window.__kyoka.profile.coins === 0), 'fresh browser: empty save');
ok(await inView(p, '#cheatbtn', 540), 'title: ひみつのコード button is on screen at 960x540');
await p.click('#codebtn'); await p.fill('#ci-input', ALL); await p.click('#ci-ok'); await p.waitForTimeout(400);
const all = await K(p, () => { const k = window.__kyoka, pr = k.profile; return { coins: pr.coins, debt: pr.debt, ach: pr.ach, up: pr.up, st: pr.st, msg: document.getElementById('ci-msg').className }; });
ok(all.coins === 99999 && all.debt === 0, 'all-unlock: 99999 coins, no debt');
ok(all.ach === 2 ** 42 - 1, 'all-unlock: all 42 achievements');
ok(Object.values(all.st).length === 9 && Object.values(all.st).every(r => r.t >= 300 && r.d === 4), 'all-unlock: all 9 stages cleared (up to ゲキムズ)');
ok(JSON.stringify(all.up) === JSON.stringify({ panier: 3, shodo: 5, drumbeat: 2, magnet: 2, toys: 3, domino: 3, ohayo: 2, michi: 1, hanpen: 3, lucky: 2 }), 'all-unlock: every shop upgrade at MAX');
await p.waitForTimeout(2000);
await K(p, () => window.__kyoka.openSelect()); await p.waitForTimeout(300);
ok(await K(p, () => document.querySelectorAll('#select .scard.locked').length === 0 && document.querySelectorAll('#s-stages .scard').length === 9 && document.querySelectorAll('#s-chars .scard').length === 5), 'all-unlock: select shows 5 characters + 9 stages, none locked');
ok(await inView(p, '#s-go', 540), 'select: start button above the fold at 960x540');
await p.screenshot({ path: out + 'p2-01-select-all.png' });
await K(p, () => window.__kyoka.closeScreen()); await K(p, () => window.__kyoka.openZukan('book')); await p.waitForTimeout(200);
ok(await K(p, () => document.getElementById('zk-count').textContent.trim() === '40 / 40'), 'all-unlock: 図鑑 40 / 40');
await K(p, () => document.getElementById('zk-tab-ach').click()); await p.waitForTimeout(150);
ok(await K(p, () => document.getElementById('zk-count').textContent.trim() === '42 / 42'), 'all-unlock: じっせき 42 / 42');
await p.screenshot({ path: out + 'p2-02-achievements-all.png' });
await K(p, () => window.__kyoka.closeScreen()); await K(p, () => window.__kyoka.openShop()); await p.waitForTimeout(200);
ok(await K(p, () => { const l = document.getElementById('sh-list'); return l.scrollHeight <= l.clientHeight + 2; }), 'shop: all 10 upgrades fit without scrolling at 960x540');
ok(await inView(p, '#sh-close', 540) && await inView(p, '#sh-refund', 540), 'shop: back + refund buttons on screen');
await p.screenshot({ path: out + 'p2-03-shop-all.png' });
// endless open + reload keeps everything
await p.reload(); await p.waitForTimeout(900);
ok(await K(p, () => window.__kyoka.profile.coins === 99999 && window.__kyoka.profile.ach === 2 ** 42 - 1), 'all-unlock survives a reload');

// ---------- 2. refund ----------
await K(p, () => window.__kyoka.openShop());
await K(p, () => window.__kyoka.askRefund()); await p.waitForTimeout(200);
ok(await K(p, () => window.__kyoka.modal === 'borrow'), 'refund asks first (confirm modal)');
await p.screenshot({ path: out + 'p2-04-shop-refund-confirm.png' });
await K(p, () => window.__kyoka.confirmBorrow()); await p.waitForTimeout(200);
const rf = await K(p, () => ({ c: window.__kyoka.profile.coins, up: Object.values(window.__kyoka.profile.up).reduce((a, b) => a + b, 0), say: document.getElementById('sh-say').textContent }));
ok(rf.up === 0 && rf.c === 99999, 'refund: all upgrades back to 0, coins capped at 99999 (' + rf.c + ')');
await K(p, () => window.__kyoka.setProfile({ coins: 10, debt: 100, up: { panier: 2, shodo: 1 } }));
const spent = await K(p, () => window.__kyoka.spentTotal());
await K(p, () => { window.__kyoka.renderShop('hello'); window.__kyoka.askRefund(); window.__kyoka.confirmBorrow(); });
const rf2 = await K(p, () => window.__kyoka.profile);
ok(spent > 100 && rf2.debt === 0 && rf2.coins === 10 + spent - 100 && !rf2.up.panier, 'refund with debt: pays the debt first (coins ' + rf2.coins + ')');
await p.screenshot({ path: out + 'p2-05-shop-refunded.png' });
await K(p, () => window.__kyoka.closeScreen());

// ---------- 3. stage unlock chain + locked silhouettes ----------
await K(p, () => window.__kyoka.setProfile({ st: { apple: { t: 120, k: 40 } } }));
await K(p, () => window.__kyoka.onStart()); await p.waitForTimeout(300); await diffGo(p);
ok(await K(p, () => window.__kyoka.screen === 'select'), 'after the first run, スタート opens the stage select');
const lk = await K(p, () => [...document.querySelectorAll('#s-stages .scard')].map(c => [c.classList.contains('locked'), c.querySelector('small').textContent]));
ok(lk.filter(x => x[0]).length === 8, 'select: 8 of 9 stages locked at first');
ok(/「りんご畑」を クリアすると/.test(lk[1][1]), 'locked hint names the stage to clear: ' + lk[1][1]);
ok(/2:00/.test(lk[0][1]) && /40/.test(lk[0][1]), 'select card shows the stage best: ' + lk[0][1]);
await p.screenshot({ path: out + 'p2-06-select-locked.png' });
await K(p, () => window.__kyoka.closeScreen());
await K(p, () => window.__kyoka.setProfile({ st: { apple: { t: 300, k: 300 } }, ach: 1 }));
await K(p, () => window.__kyoka.openSelect());
const lk2 = await K(p, () => [...document.querySelectorAll('#s-stages .scard')].map(c => c.classList.contains('locked')));
ok(!lk2[1] && lk2[2], 'clearing りんご畑 unlocks いちご畑 (only)');
await K(p, () => window.__kyoka.closeScreen());

// ---------- 4. every stage: its own enemies, boss, music; boss drops a chest ----------
const SONG = { apple: 'main', berry: 'berry', race: 'race', cage: 'cage', zoo: 'zoo', snow: 'snow', night: 'night' };
const BOSS = { apple: 'boss', berry: 'bmole', race: 'mokuba', cage: 'wheel', zoo: 'zou', snow: 'bigsnow', night: 'bigspk' };
await K(p, () => window.__kyoka.setProfile({ cheats: 4 })); // しんしゅう: every stage open
for (const [i, st] of Object.keys(SONG).entries()) {
  await K(p, s => { const k = window.__kyoka; window.__kyokaTest = true; k.select('kyon', s); k.start(); k.setAuto(true); k.spawn(30); }, st);
  await runFor(p, 1500);
  const info = await K(p, () => { const G = window.__kyoka.G; return { sid: G.sid, types: [...new Set(G.enemies.map(e => e.type))], song: G.D.song, banner: document.getElementById('banner').textContent }; });
  const mix = await K(p, s => window.__kyoka.SDEF[s].mix(0).filter(x => x[1] > 0).map(x => x[0]), st);
  ok(info.sid === st && info.song === SONG[st] && info.types.some(t => mix.includes(t)), `${st}: own enemies (${info.types.join(',')}) + song ${info.song}`);
  if (i >= 4) await p.screenshot({ path: out + `p2-1${i}-stage-${st}.png` });
  const bt = await K(p, () => window.__kyoka.spawnBoss());
  ok(bt === BOSS[st], `${st}: boss is ${bt}`);
  await runFor(p, 2500);
  await K(p, () => { const k = window.__kyoka, B = k.G.boss; if (B) { B.x = k.G.p.x + 80; B.y = k.G.p.y - 10; B.mode = 'chase'; B.atk = 0; } });
  await runFor(p, 1000);
  const name = await K(p, () => document.getElementById('bossname').textContent);
  await p.screenshot({ path: out + `p2-2${i}-boss-${st}.png` });
  if (st === 'zoo') ok(await K(p, () => window.__kyoka.G.ebul.some(b => b.k === 'drop')), 'zoo: the elephant sprays water drops');
  if (st === 'snow') ok(await K(p, () => window.__kyoka.G.ebul.some(b => b.k === 'sbul')), 'snow: the snowman king throws snowballs');
  if (st === 'night') ok(await K(p, () => window.__kyoka.G.hazards.length > 0), 'night: the speaker sends sound rings');
  await K(p, () => window.__kyoka.killBoss()); await runFor(p, 300);
  const chest = await K(p, () => window.__kyoka.G.items.some(it => it.k === 'chest') || window.__kyoka.G.chests > 0);
  ok(chest && name.length > 1, `${st}: boss 「${name}」 defeated, drops a treasure chest`);
}

// ---------- 5. chest roulette ----------
await K(p, () => { window.__kyokaNoLv = true; });
await K(p, () => { const k = window.__kyoka, G = k.G; G.items = G.items.filter(i => i.k !== 'chest'); G.gems.length = 0; k.setAuto(false); while (k.state === 'levelup') k.pick(0); G.items.push({ x: G.p.x + 4, y: G.p.y, k: 'chest' }); });
for (let j = 0; j < 8 && await K(p, () => window.__kyoka.state !== 'chest'); j++) { await K(p, () => { if (window.__kyoka.state === 'levelup') window.__kyoka.pick(0); }); await p.waitForTimeout(150); }
ok(await K(p, () => window.__kyoka.state === 'chest'), 'walking onto the chest opens the roulette');
await p.waitForTimeout(250); await p.screenshot({ path: out + 'p2-30-chest-spin.png' });
await p.waitForTimeout(2600);
const ch = await K(p, () => ({ n: window.__kyoka.chestRw.length, ok: !document.getElementById('ch-ok').classList.contains('hide'), names: [...document.querySelectorAll('#ch-slots b')].map(b => b.textContent) }));
ok(ch.n >= 1 && ch.n <= 3 && ch.ok && ch.names.every(n => n), 'chest gives 1–3 prizes: ' + ch.names.join(' / '));
ok(await inView(p, '#ch-ok', 540), 'chest OK button on screen');
await p.screenshot({ path: out + 'p2-31-chest-prizes.png' });
await p.click('#ch-ok'); await p.waitForTimeout(200);
ok(await K(p, () => window.__kyoka.state === 'play' && window.__kyoka.has('chest')), 'chest closes back to play + たからばこ achievement');

// ---------- 6. map pickups ----------
await K(p, () => { const k = window.__kyoka; k.spawn(40); for (let i = 0; i < 30; i++) k.G.gems.push({ x: k.G.p.x + 200 + i, y: k.G.p.y, v: 1, fly: false, bob: 0, pop: 0, tag: 1 }); k.drop('magI', 4, 0); });
await p.waitForTimeout(300);
ok(await K(p, () => window.__kyoka.G.gems.filter(g => g.tag).every(g => g.fly)), '🧲 magnet pulls in every gem');
await K(p, () => { const G = window.__kyoka.G; G.enemies.length = 0; G.p.inv = 3; G.p.hp = 1; G.shield = 0; window.__kyoka.drop('cakeI', 4, 0); }); await p.waitForTimeout(300);
const ck = await K(p, () => { const G = window.__kyoka.G; return { hp: G.p.hp, max: G.p.maxHp, sh: G.shield }; });
ok(ck.hp === ck.max && ck.sh > 2, '🍰 strawberry cake heals to full + short shield (' + JSON.stringify(ck) + ')');
ok(await K(p, () => !('freeze' in window.__kyoka.G) || !window.__kyoka.G.freeze), 'no clock / freeze pickup any more');
await p.screenshot({ path: out + 'p2-32-cake.png' });
await K(p, () => window.__kyoka.spawn(40)); await runFor(p, 2000);
const before = await K(p, () => window.__kyoka.G.kills);
await K(p, () => window.__kyoka.drop('bombI', 4, 0)); await p.waitForTimeout(400);
ok(await K(p, b => window.__kyoka.G.kills > b + 10, before), '💣 bomb clears the screen');
ok(await K(p, () => window.__kyoka.has('pickups')), 'magnet + bomb + cake → ぜんぶひろった achievement');
ok(await K(p, () => { const k = window.__kyoka, G = k.G; G.gems.length = 0; while (k.state === 'levelup') k.pick(0); G.nextPick = G.t; G.items.length = 0; window.__kyoka.step(0.016); return G.items.some(i => /I$/.test(i.k)); }), 'pickups also appear on the map by themselves');

// ---------- 7. new weapons + evolutions ----------
await K(p, () => { window.__kyokaNoLv = false; });
for (const [w, pas, ach, shot] of [['drum', 'metro', 21, 'p2-33-evo-drum-fever'], ['mic', 'nodoame', 22, 'p2-34-evo-encore-live'], ['apple', 'basket', 23 - 1 + 1, 'p2-35-evo-apple-typhoon']]) {
  await K(p, s => { const k = window.__kyoka; k.select('kyon', s); k.start(); k.setAuto(true); k.spawn(60); }, ['apple', 'night', 'zoo'][['drum', 'mic', 'apple'].indexOf(w)]);
  await K(p, ([w, pas]) => { const k = window.__kyoka; k.maxWeapon(w); k.give(pas); }, [w, pas]);
  ok(await K(p, () => window.__kyoka.evoReady()) === w, `${w} Lv5 + ${pas} → evolution ready`);
  await K(p, w => window.__kyoka.applyEvo(w), w);
  await runFor(p, 1800);
  await p.screenshot({ path: out + shot + '.png' });
  ok(await K(p, w => window.__kyoka.G.evo[w] && document.querySelector('#weps .w.evo') !== null, w), `${w} evolved (HUD shows ★)`);
}
ok(await K(p, () => ['evoDrum', 'evoMic', 'evoApple'].every(window.__kyoka.has)), 'evoDrum / evoMic / evoApple achievements');
ok(await K(p, () => window.__kyoka.WEAPONS.length === 14 && window.__kyoka.PASSIVES.length === 11), '14 weapons + 11 passives');

// ---------- 8. bigger はんぺん ----------
await K(p, () => { const k = window.__kyoka; k.setProfile({ up: { hanpen: 3 } }); k.select('kyon', 'apple'); k.start(); k.setAuto(true); k.spawn(30); });
await runFor(p, 3000);
for (let i = 0; i < 8 && !(await K(p, () => window.__kyoka.G.bites)); i++) { await K(p, () => { const G = window.__kyoka.G; window.__kyoka.spawn(6); G.enemies.slice(-6).forEach((e, j) => { e.x = G.dog.x + 20 + j * 6; e.y = G.dog.y; }); }); await runFor(p, 1000); }
const hp = await K(p, () => ({ b: window.__kyoka.G.bites, h: window.__kyoka.G.hanpen }));
ok(hp.h === 3 && hp.b >= 1, 'はんぺん upgrade Lv3 applied, he bites (' + hp.b + ' bites)');

// ---------- 9. secret codes ----------
await p.evaluate(() => window.__kyoka.end(false)); await p.waitForTimeout(300); await p.click('#titlebtn'); await p.waitForTimeout(300);
await K(p, () => window.__kyoka.setProfile({ debt: 150, coins: 0 }));
await p.click('#cheatbtn'); await p.waitForTimeout(200);
await p.fill('#cc-input', 'ＩＣＨＩＧＯ'); await p.click('#cc-ok'); await p.waitForTimeout(250);
ok(await K(p, () => document.getElementById('cc-msg').classList.contains('ok') && window.__kyoka.profile.coins === 10000), 'cheat ICHIGO (full-width) → +10000 coins');
await p.screenshot({ path: out + 'p2-40-cheat-ok.png' });
await p.fill('#cc-input', 'いちご'); await p.click('#cc-ok'); await p.waitForTimeout(150);
ok(await K(p, () => document.getElementById('cc-msg').classList.contains('bad') && /もう つかった/.test(document.getElementById('cc-msg').textContent)), 'same cheat again (kana) → "already used"');
await p.screenshot({ path: out + 'p2-41-cheat-used.png' });
await p.fill('#cc-input', 'kyoka'); await p.click('#cc-ok'); await p.waitForTimeout(150);
ok(await K(p, () => /ちがう/.test(document.getElementById('cc-msg').textContent)), 'unknown word → friendly "not a secret word"');
const words = ['アザラシ', 'Shinshu', 'hamuhamu', 'HANPEN', 'きょんきょん', 'zukan', 'ohayau'];
for (const w of words) { await p.fill('#cc-input', w); await p.press('#cc-input', 'Enter'); await p.waitForTimeout(120); ok(await K(p, () => document.getElementById('cc-msg').classList.contains('ok')), 'cheat ' + w + ' accepted'); }
const cp = await K(p, () => window.__kyoka.profile);
ok(cp.cheats === 255 && cp.boost === 1, 'all 8 cheats recorded in the save');
const code8 = await K(p, () => window.__kyoka.encode(window.__kyoka.profile));
ok(await K(p, c => window.__kyoka.decode(c).profile.cheats === 255, code8), 'cheats survive the save code');
await p.click('#cc-back');
await K(p, () => window.__kyoka.openSelect()); await p.waitForTimeout(150);
ok(await K(p, () => document.querySelectorAll('#select .scard.locked').length === 0), 'azarashi + shinshu: every character and stage open');
await K(p, () => { const k = window.__kyoka; k.closeScreen(); k.select('kyon', 'snow'); k.start(); });
const run = await K(p, () => { const k = window.__kyoka, G = k.G; return { giant: G.giant, seals: G.seals.length, maxed: k.WEAPONS.every(w => G.weapons[w] === k.MAXLV[w]), boost: k.profile.boost }; });
ok(run.giant && run.seals >= 3 && run.maxed && run.boost === 0, 'cheat effects: giant はんぺん, 3 seals, kyonkyon boost used up (all weapons MAX once)');
await runFor(p, 1500); await p.screenshot({ path: out + 'p2-42-cheat-boost-run.png' });
await K(p, () => window.__kyoka.end(false)); await p.waitForTimeout(200); await p.click('#titlebtn');
await K(p, () => window.__kyoka.openZukan('book')); await p.waitForTimeout(150);
ok(await K(p, () => document.getElementById('zk-count').textContent.trim() === '40 / 40'), 'zukan cheat: every 図鑑 page open');
await K(p, () => window.__kyoka.closeScreen());
// a fresh save can redeem the same word again
await K(p, () => window.__kyoka.setProfile({}));
ok(await K(p, () => window.__kyoka.submitCheat('ichigo').ok), 'each cheat is once per save (a new save may use it again)');

// ---------- 10. per-stage record + result screen fold ----------
await K(p, () => { const k = window.__kyoka; k.setProfile({ st: { apple: { t: 300, k: 100 } }, ach: 1 }); k.select('kyon', 'berry'); k.start(); k.setAuto(true); k.spawn(20); });
await runFor(p, 1500);
await K(p, () => { const k = window.__kyoka; k.G.kills = 321; k.skipTo(299.9); });
await runFor(p, 800);
const res = await K(p, () => ({ s: window.__kyoka.state, st: window.__kyoka.profile.st.berry, rec: document.getElementById('e-rec').textContent, ach: document.getElementById('e-ach').textContent }));
ok(res.s === 'win' && res.st.t === 300 && res.st.k >= 321, 'いちご畑 clear stores the stage record ' + JSON.stringify(res.st));
ok(/NEW!/.test(res.rec) && /5:00/.test(res.rec), 'result shows the stage best with NEW!: ' + res.rec);
ok(/夕焼けの競馬場/.test(res.ach), 'result says the next stage is now open');
ok(await inView(p, '#e-code .code', 540) && await inView(p, '#e-code .copy', 540), 'result: the save code + copy button are above the fold at 960x540');
ok(await K(p, () => /^[A-Z0-9]{4}(-[A-Z0-9]{4}){14}$/.test(document.querySelector('#e-code .code').textContent)), 'result code is 60 characters');
await p.screenshot({ path: out + 'p2-50-result-540.png' });
await p.click('#titlebtn'); await p.waitForTimeout(200);
// last stage clear -> clearChina + allStages (night alone is no longer the last stage)
await K(p, () => { const k = window.__kyoka, st = {}; for (const id of ['apple', 'berry', 'race', 'cage', 'zoo', 'snow']) st[id] = { t: 300, k: 50 }; k.setProfile({ st, ach: 1 }); k.select('kyon', 'night'); k.start(); k.setAuto(true); k.skipTo(299.9); });
await runFor(p, 800);
ok(await K(p, () => window.__kyoka.state === 'win' && window.__kyoka.has('clearNight') && !window.__kyoka.has('allStages')), '夜のステージ clear → clearNight (not yet every stage)');
await p.click('#titlebtn'); await p.waitForTimeout(200);
await K(p, () => { const k = window.__kyoka, st = {}; for (const id of ['apple', 'berry', 'race', 'cage', 'zoo', 'snow', 'night', 'chapel']) st[id] = { t: 300, k: 50 }; k.setProfile({ st, ach: 1 }); k.select('kyon', 'china'); k.start(); k.setAuto(true); k.skipTo(299.9); });
await runFor(p, 800);
ok(await K(p, () => window.__kyoka.state === 'win' && window.__kyoka.has('clearChina') && window.__kyoka.has('allStages')), '中華街 clear → clearChina + 9つのステージ achievements');
await p.click('#titlebtn'); await p.waitForTimeout(200);
// はんぺん 100 bites
await K(p, () => { const k = window.__kyoka; k.select('kyon', 'apple'); k.start(); k.setAuto(true); k.spawn(30); k.G.bites = 99; });
await runFor(p, 4000);
ok(await K(p, () => window.__kyoka.has('hanpen100')), 'はんぺん 100 bites → achievement');
await K(p, () => window.__kyoka.end(false)); await p.waitForTimeout(200); await p.click('#titlebtn'); await p.waitForTimeout(200);
for (const l of ['zh', 'en', 'ja']) {
  await p.click(`.langs button[data-l="${l}"]`); await p.waitForTimeout(150);
  ok(await inView(p, '#cheatbtn', 540) && await inView(p, '#startbtn', 540), `title (${l}): all buttons fit at 960x540`);
  if (l === 'zh') await p.screenshot({ path: out + 'p2-51-title-zh.png' });
}
await p.close();

// ---------- 11. phone layouts ----------
p = await page({ width: 390, height: 844 }, true);
await p.click('#codebtn'); await p.fill('#ci-input', ALL.toLowerCase().replace(/-/g, ' ')); await p.click('#ci-ok'); await p.waitForTimeout(2200);
ok(await K(p, () => window.__kyoka.profile.coins === 99999), 'phone: all-unlock code works typed in lower case with spaces');
await p.screenshot({ path: out + 'p2-60-phone-title.png' });
await K(p, () => window.__kyoka.openSelect()); await p.waitForTimeout(200); await p.screenshot({ path: out + 'p2-61-phone-select.png' });
ok(await inView(p, '#s-go', 844), 'phone: select start button visible');
await K(p, () => window.__kyoka.closeScreen()); await K(p, () => window.__kyoka.openShop()); await p.waitForTimeout(200); await p.screenshot({ path: out + 'p2-62-phone-shop.png' });
await K(p, () => window.__kyoka.closeScreen());
await K(p, () => { const k = window.__kyoka; window.__kyokaTest = true; k.select('kyon', 'zoo'); k.start(); k.spawn(20); });
await runFor(p, 800); await K(p, () => window.__kyoka.openChest()); await p.waitForTimeout(2800); await p.screenshot({ path: out + 'p2-63-phone-chest.png' });
ok(await inView(p, '#ch-ok', 844), 'phone: chest OK button visible');
await p.click('#ch-ok');
await K(p, () => window.__kyoka.end(true)); await p.waitForTimeout(300); await p.screenshot({ path: out + 'p2-64-phone-result.png' });
ok(await inView(p, '#e-code .copy', 844), 'phone: result copy button visible');
await p.click('#titlebtn'); await p.click('#cheatbtn'); await p.waitForTimeout(200); await p.screenshot({ path: out + 'p2-65-phone-cheat.png' });
await p.close();

// ---------- 12. old codes still work ----------
p = await page({ width: 960, height: 540 });
await p.click('#codebtn'); await p.fill('#ci-input', 'DZHE-4JQM-HFSW'); await p.click('#ci-ok'); await p.waitForTimeout(300);
const old = await K(p, () => window.__kyoka.profile);
ok(old.clears === 2 && old.st.apple.t > 0 && old.st.race.t >= 300, 'old 12-letter code still restores (mapped onto the new stages)');
await p.close();

ok(errs.length === 0, 'zero console errors (' + errs.length + ')');
console.log('\n' + results.length + ' checks passed');
await b.close();
