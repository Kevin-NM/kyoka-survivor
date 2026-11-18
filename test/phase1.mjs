const ROOT = decodeURI(new URL('..', import.meta.url).pathname); // repo root, wherever it is checked out
// Phase 1 headless playthrough: shop + debt, stage select, cage stage, zukan, evolution, はんぺん, result code (60), old/new code round trip.
import './mkshots.mjs';
import { chromium } from 'playwright-core';
const diffGo = async (pg, d = 'normal', tap = false) => { await pg.waitForTimeout(150); if (await pg.evaluate(() => !document.getElementById('diff').classList.contains('hide'))) { const s = '#df-list .dbtn[data-d="' + d + '"]'; if (tap) await pg.tap(s); else await pg.click(s); await pg.waitForTimeout(400); } };
const out = ROOT + 'shots/';
const errs = [];
const ok = (c, m) => { if (!c) throw new Error('FAIL: ' + m); console.log('ok -', m); };
const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required'] });
async function page(vp, touch) {
  const ctx = await b.newContext({ viewport: vp, hasTouch: !!touch, isMobile: !!touch, deviceScaleFactor: touch ? 2 : 1 });
  await ctx.addInitScript(() => { if (!sessionStorage.getItem('kept')) { ['kyoka-save-v1', 'kyoka-save-v2', 'kyoka-save-v3', 'kyoka-sel', 'kyoka-lang'].forEach(k => localStorage.removeItem(k)); sessionStorage.setItem('kept', 1); } });
  const p = await ctx.newPage();
  p.on('pageerror', e => { errs.push('pageerror ' + e.message); console.log('pageerror', e.stack); });
  p.on('console', m => { if (m.type() === 'error') { errs.push('console ' + m.text()); console.log('console', m.text()); } });
  await p.goto('file://' + ROOT + 'dist/index.html'); await p.waitForTimeout(1200); return p;
}
const vis = (p, id) => p.evaluate(id => !document.getElementById(id).classList.contains('hide'), id);
const keepAlive = p => p.evaluate(() => { const k = window.__kyoka; if (k.state === 'levelup') k.pick(0); if (k.state === 'chest') k.closeChest(); if (k.G) { k.G.p.hp = k.G.p.maxHp; } return k.state; });
async function runFor(p, ms) { for (let i = 0; i < ms / 250; i++) { await keepAlive(p); await p.waitForTimeout(250); } }

const p = await page({ width: 960, height: 540 });
// ---------- 1. fresh profile: start skips the select screen ----------
await p.click('#startbtn'); await p.waitForTimeout(500); await diffGo(p);
ok(await p.evaluate(() => window.__kyoka.state) === 'play', 'fresh start: pick a difficulty (default ふつう), then play');
// はんぺん in gameplay: let him bite a few things
await p.evaluate(() => { const k = window.__kyoka; window.__kyokaTest = true; k.setAuto(true); k.spawn(12); });
await runFor(p, 4000);
const dog = await p.evaluate(() => { const G = window.__kyoka.G; return { d: Math.hypot(G.dog.x - G.p.x, G.dog.y - G.p.y), mode: G.dog.mode, t: G.t }; });
ok(dog.d < 140, 'はんぺん stays near kyon (' + dog.d.toFixed(0) + ')');
await p.evaluate(() => { const k = window.__kyoka; k.setAuto(false); const G = k.G; G.dog.x = G.p.x + 18; G.dog.y = G.p.y + 6; G.dog.face = -1; });
await p.waitForTimeout(150);
await p.screenshot({ path: out + 'p1-06-hanpen-gameplay.png' });
await p.evaluate(() => window.__kyoka.setAuto(true));
// ---------- 2. evolution: max seal + shoes ----------
await p.evaluate(() => { const k = window.__kyoka; k.maxWeapon('seal'); k.give('shoes'); });
const evo = await p.evaluate(() => window.__kyoka.evoReady());
ok(evo && evo.length, 'evolution ready after max seal + shoes: ' + JSON.stringify(evo));
await p.evaluate(() => { const k = window.__kyoka; k.setAuto(false); k.levelUp(); });
await p.waitForTimeout(900);
const card = await p.evaluate(() => document.querySelector('#cards .card') && document.querySelector('#cards .card').className);
ok(/c-evo/.test(card || ''), 'level-up offers the evolution card first');
await p.screenshot({ path: out + 'p1-05a-evolution-card.png' });
await p.evaluate(() => window.__kyoka.pick(0));
await p.evaluate(() => { const k = window.__kyoka; k.setAuto(true); k.spawn(40); });
await runFor(p, 2500);
const ev = await p.evaluate(() => window.__kyoka.G.evo);
ok(ev && (ev.seal || ev.includes?.('seal') || Object.keys(ev).length), 'evolution applied: ' + JSON.stringify(ev));
await p.screenshot({ path: out + 'p1-05b-evolution-seals.png' });
// ---------- 3. win the run -> result screen with 52-char code + coins ----------
await p.evaluate(() => { const k = window.__kyoka; k.G.kills = 260; k.skipTo(299.3); });
for (let i = 0; i < 30; i++) { const st = await keepAlive(p); if (st === 'win' || st === 'over') break; await p.waitForTimeout(200); }
await p.waitForTimeout(900);
const end = await p.evaluate(() => ({ state: window.__kyoka.state, code: document.querySelector('#e-code .code').textContent, coins: document.getElementById('e-coins').innerText, ach: document.getElementById('e-ach').innerText, endless: !document.getElementById('endlessbtn').classList.contains('hide'), prof: { ...window.__kyoka.profile } }));
console.log('end', JSON.stringify(end));
ok(end.state === 'win', 'run won');
ok(/^[2-9A-HJ-NP-Z]{4}(-[2-9A-HJ-NP-Z]{4}){14}$/.test(end.code), 'result shows 60-char code ' + end.code);
ok(end.prof.coins > 0 && end.coins.length > 0, 'coins earned and shown: ' + end.prof.coins);
ok(end.endless, 'endless button offered after first clear');
await p.screenshot({ path: out + 'p1-07-result-24code.png' });
const winCode = end.code;
// endless: continue past 5:00 briefly
await p.click('#endlessbtn'); await p.waitForTimeout(400);
await runFor(p, 1500);
const en = await p.evaluate(() => ({ s: window.__kyoka.state, t: window.__kyoka.G.t, e: window.__kyoka.G.endless }));
ok(en.s === 'play' && en.t > 300, 'endless mode continues after 5:00 (t=' + en.t.toFixed(1) + ')');
await p.evaluate(() => window.__kyoka.end(false)); await p.waitForTimeout(700);
await p.click('#titlebtn'); await p.waitForTimeout(500);

// ---------- 4. shop: buy, then borrow ----------
await p.evaluate(() => { const k = window.__kyoka; k.setProfile({ ...k.profile, coins: 70, debt: 0 }); });
await p.click('#shopbtn'); await p.waitForTimeout(500);
ok(await vis(p, 'shop'), 'shop opens from big title button');
await p.screenshot({ path: out + 'p1-01-shop.png' });
await p.evaluate(() => window.__kyoka.tryBuy('magnet')); // 40, affordable
let pr = await p.evaluate(() => ({ ...window.__kyoka.profile, up: { ...window.__kyoka.profile.up } }));
ok(pr.up.magnet === 1 && pr.coins === 30, 'bought magnet lv1 for 40 coins');
await p.evaluate(() => window.__kyoka.tryBuy('panier')); await p.waitForTimeout(400); // 60, short by 30 -> borrow modal
ok(await vis(p, 'borrow'), 'borrow modal appears when short');
await p.screenshot({ path: out + 'p1-02-shop-borrow.png' });
await p.click('#b-yes'); await p.waitForTimeout(400);
pr = await p.evaluate(() => ({ ...window.__kyoka.profile, up: { ...window.__kyoka.profile.up } }));
ok(pr.up.panier === 1 && pr.coins === 0 && pr.debt === 30, 'borrowed 30 to buy panier (debt ' + pr.debt + ')');
ok(await p.evaluate(() => document.getElementById('sh-ham').classList.contains('worry')), 'hamster looks worried while in debt');
await p.screenshot({ path: out + 'p1-03-shop-debt.png' });
await p.click('#sh-close'); await p.waitForTimeout(300);

// ---------- 5. stage select + cage stage; coins repay debt first ----------
await p.evaluate(() => { const k = window.__kyoka; k.setProfile({ ...k.profile, bestTime: Math.max(k.profile.bestTime, 200), ach: k.profile.ach }); });
await p.click('#startbtn'); await p.waitForTimeout(500); await diffGo(p);
ok(await vis(p, 'select'), 'select screen appears once something is unlocked');
const cards = await p.evaluate(() => [...document.querySelectorAll('#select .scard')].map(c => c.dataset.id + (c.classList.contains('locked') ? ':locked' : '')));
console.log('select cards', cards.join(' '));
// Phase 2: the cage is stage 4, opened by clearing 夕焼けの競馬場
ok(cards.includes('cage:locked'), 'cage is locked until the racecourse is cleared');
await p.evaluate(() => { const k = window.__kyoka; k.closeScreen(); const st = { ...k.profile.st, race: { t: 300, k: 10 } }; k.setProfile({ ...k.profile, st }); k.openSelect(); });
await p.waitForTimeout(300); await p.click('#s-stages .scard[data-id="cage"]'); let s = await p.evaluate(() => window.__kyoka.sel);
ok(s.stage === 'cage', 'picked ケージの中 stage');
await p.click('#s-chars .scard[data-id="odekake"]'); await p.waitForTimeout(250);
await p.screenshot({ path: out + 'p1-04-stage-select.png' });
await p.click('#s-go'); await p.waitForTimeout(600); await diffGo(p);
const g = await p.evaluate(() => ({ st: window.__kyoka.state, stage: window.__kyoka.G.stage, ch: window.__kyoka.G.char, magnet: window.__kyoka.G.p.magnet }));
ok(g.st === 'play' && g.ch === 'odekake', 'cage run started as おでかけきょん ' + JSON.stringify(g));
await p.evaluate(() => { const k = window.__kyoka; k.setAuto(true); k.skipTo(30); k.spawn(30); });
await runFor(p, 5000);
await p.screenshot({ path: out + 'p1-08-cage-stage.png' });
await p.evaluate(() => { const k = window.__kyoka; k.skipTo(215); });
await runFor(p, 4000);
await p.screenshot({ path: out + 'p1-09-cage-boss.png' });
await p.evaluate(() => { const k = window.__kyoka; k.G.kills = 300; k.end(false); }); await p.waitForTimeout(900);
pr = await p.evaluate(() => ({ ...window.__kyoka.profile }));
const repaidTxt = await p.evaluate(() => document.getElementById('e-coins').innerText);
console.log('after cage run', JSON.stringify({ coins: pr.coins, debt: pr.debt }), repaidTxt.replace(/\n/g, ' | '));
ok(pr.debt < 30, 'run coins auto-repaid debt first');
await p.screenshot({ path: out + 'p1-10-result-repaid.png' });
await p.click('#titlebtn'); await p.waitForTimeout(400);

// ---------- 6. zukan + achievements ----------
await p.click('#zukanbtn'); await p.waitForTimeout(500);
ok(await vis(p, 'zukan'), 'zukan opens');
const zn = await p.evaluate(() => ({ all: document.querySelectorAll('#zk-body .ztile').length, open: document.querySelectorAll('#zk-body .ztile:not(.locked)').length }));
ok(zn.all === 40, 'zukan has 40 entries (' + zn.open + ' open)');
await p.screenshot({ path: out + 'p1-11-zukan.png' });
await p.click('#zk-body .ztile:not(.locked)'); await p.waitForTimeout(300);
await p.screenshot({ path: out + 'p1-12-zukan-detail.png' });
await p.click('#zk-tab-ach'); await p.waitForTimeout(300);
const an = await p.evaluate(() => ({ all: document.querySelectorAll('#zk-body .arow').length, got: document.querySelectorAll('#zk-body .arow.ok').length }));
ok(an.all === 42, 'achievement list has 42 (' + an.got + ' earned)');
await p.screenshot({ path: out + 'p1-13-achievements.png' });
await p.click('#zk-close'); await p.waitForTimeout(300);

// ---------- 7. code round trips: old 12-char and new 52-char ----------
const fresh = await page({ width: 960, height: 540 });
await fresh.click('#codebtn'); await fresh.waitForTimeout(300);
await fresh.fill('#ci-input', 'dzhe 4jqm hfsw'); await fresh.click('#ci-ok'); await fresh.waitForTimeout(400);
let fp = await fresh.evaluate(() => ({ ...window.__kyoka.profile }));
ok(fp.bestKills === 412 && fp.clears === 2 && fp.lang === 'zh', 'old 12-char code (lowercase, spaces) still restores');
await fresh.waitForTimeout(1800);
await fresh.click('#codebtn'); await fresh.waitForTimeout(300);
await fresh.fill('#ci-input', winCode.toLowerCase().replace(/-/g, ' ')); await fresh.click('#ci-ok'); await fresh.waitForTimeout(400);
fp = await fresh.evaluate(() => ({ ...window.__kyoka.profile, up: { ...window.__kyoka.profile.up } }));
ok(fp.coins === end.prof.coins && fp.up.seal === undefined && [...Array(42).keys()].every(i => Math.floor(end.prof.ach / 2 ** i) % 2 === 0 || Math.floor(fp.ach / 2 ** i) % 2 === 1), 'new 52-char code restores coins + achievements on a fresh browser');
ok(fp.bestKills === 412, 'merge keeps the better record from the old code');
const reenc = await fresh.evaluate(() => window.__kyoka.encode(window.__kyoka.profile));
const back = await fresh.evaluate(c => window.__kyoka.decode(c), reenc);
ok(back.ok && back.profile.coins === fp.coins && Math.abs(back.profile.bestKills - 412) <= 20, 're-encoded 52-char code decodes to the same profile (stage kills rounded to 20: ' + back.profile.bestKills + ')');
const bad = await fresh.evaluate(c => window.__kyoka.decode(c.slice(0, 5) + (c[5] === 'A' ? 'B' : 'A') + c.slice(6)), winCode);
ok(!bad.ok, 'one-letter typo in 52-char code is rejected');
await fresh.waitForTimeout(1800);

// ---------- 8. phone: shop + select are usable ----------
const ph = await page({ width: 390, height: 844 }, true);
await ph.evaluate(() => { const k = window.__kyoka; k.setProfile({ ...k.profile, coins: 260, debt: 40, clears: 1, ach: 1 | 4, bestTime: 300 }); });
await ph.tap('#shopbtn'); await ph.waitForTimeout(400); await ph.screenshot({ path: out + 'p1-14-phone-shop.png' });
await ph.tap('#sh-close'); await ph.waitForTimeout(200);
await ph.tap('#startbtn'); await ph.waitForTimeout(400); await diffGo(ph, 'normal', true); await ph.screenshot({ path: out + 'p1-15-phone-select.png' });
await ph.tap('#s-back'); await ph.waitForTimeout(200);
await ph.tap('#zukanbtn'); await ph.waitForTimeout(400); await ph.screenshot({ path: out + 'p1-16-phone-zukan.png' });

console.log('errors', errs.length ? errs : 'none');
await b.close();
if (errs.length) process.exit(1);
console.log('phase1 playthrough passed');
