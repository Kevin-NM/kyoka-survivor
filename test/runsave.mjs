// Mid-run save & resume (UI level, no gameplay sims):
// start a run, play a little, pause -> run code shows; reload -> the continue dialog appears and つづきから restores the run;
// 最初から discards it; a run code restores on a fresh browser; the same code can't be used twice (coins bank once);
// a code for a stage this save hasn't opened is rejected (and accepted with the all-unlock code).
import './mkshots.mjs';
import { chromium } from 'playwright-core';
import { createServer } from 'http';
import { readFileSync } from 'fs';
const ROOT = decodeURI(new URL('..', import.meta.url).pathname);
// served over http, not file://: headless Chrome sometimes drops a file:// page's whole localStorage on reload, which made this test flaky
const srv = createServer((q, s) => { s.writeHead(200, { 'content-type': 'text/html; charset=utf-8' }); s.end(readFileSync(ROOT + 'dist/index.html')); });
await new Promise(r => srv.listen(0, '127.0.0.1', r));
const URL_ = `http://127.0.0.1:${srv.address().port}/index.html`;
let n = 0; const ok = (c, m) => { if (!c) throw new Error('FAIL: ' + m); n++; console.log('ok -', m); };
const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const errs = [];
const page = async (ctx, lang) => { const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); }); return p; };
const vis = (p, id) => p.evaluate(id => !document.getElementById(id).classList.contains('hide'), id);
const ready = p => p.waitForFunction(() => window.__kyoka && document.readyState === 'complete', null, { timeout: 15000 }).then(() => p.waitForTimeout(300));
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
await ctx.addInitScript(() => { if (!localStorage.getItem('kyoka-lang')) localStorage.setItem('kyoka-lang', 'zh'); });
let p = await page(ctx); await p.goto(URL_); await p.waitForTimeout(500);
ok(!(await vis(p, 'resumeask')), 'no continue dialog on a fresh browser');
// a run on the first stage: give some weapons, step a bit, pause
const snap = await p.evaluate(() => { const k = window.__kyoka; k.select('kyon', 'apple'); k.setDiff('hard'); k.start(); for (const w of ['lariat', 'lariat', 'drum', 'shoes', 'suzuri', 'suzuri']) k.give(w);
  window.__kyokaNoLv = true; for (let i = 0; i < 120; i++) k.step(1 / 30); k.G.kills = 321; k.G.picked = 42; k.G.t = 95.5; k.G.p.hp = k.G.p.maxHp * 0.5; k.pause();
  const G = k.G; return { t: Math.floor(G.t), lvl: G.lvl, kills: G.kills, picked: G.picked, w: JSON.stringify(G.weapons), ps: JSON.stringify(G.passives), coins: k.profile.coins, hp: Math.round(G.p.hp / G.p.maxHp * 100) }; });
ok(await vis(p, 'pause') && await vis(p, 'runcodebtn'), 'pause menu shows the run-code button');
await p.click('#runcodebtn'); await p.waitForTimeout(150);
const code = await p.evaluate(() => document.getElementById('rc-code').dataset.code);
ok(/^([2-9A-HJKMNP-Z]{4}-){5,}[2-9A-HJKMNP-Z]{4}$/.test(code), `run code shown (${code}, ${code.replace(/-/g, '').length} chars)`);
await p.screenshot({ path: 'shots/runcode-zh.png' });
ok(snap.coins === (await p.evaluate(() => window.__kyoka.profile.coins)), 'pausing does not bank coins');
await p.click('#rc-close');
// reload: continue dialog -> つづきから restores
await p.waitForTimeout(300); await p.reload(); await ready(p);
ok(await vis(p, 'resumeask'), 'continue dialog appears after reload');
ok(/上次/.test(await p.textContent('#ra-title')), 'dialog title in zh-TW');
await p.screenshot({ path: 'shots/resume-ask-zh.png' });
await p.click('#ra-yes'); await p.waitForTimeout(200);
const got = await p.evaluate(() => { const G = window.__kyoka.G; return { st: window.__kyoka.state, sid: G.sid, diff: G.diff, t: Math.floor(G.t), lvl: G.lvl, kills: G.kills, picked: G.picked, w: JSON.stringify(G.weapons), ps: JSON.stringify(G.passives), hp: Math.round(G.p.hp / G.p.maxHp * 100) }; });
ok(got.st === 'play' && got.sid === 'apple' && got.diff === 'hard', 'つづきから starts the same stage / difficulty');
ok(got.t === snap.t && got.lvl === snap.lvl && got.kills === snap.kills && got.picked === snap.picked, `time, level, kills, coins restored (${JSON.stringify(got)})`);
ok(got.w === snap.w && got.ps === snap.ps, 'weapons and passives restored');
ok(Math.abs(got.hp - snap.hp) <= 2, 'HP restored');
// quit -> coins banked once, run finished, its code can't be used again
const c1 = await p.evaluate(() => { const k = window.__kyoka; k.pause(); document.getElementById('quitbtn').click(); return { coins: k.profile.coins, saved: k.savedRunCode }; });
ok(c1.coins > snap.coins && !c1.saved, `quitting banks the run's coins (${snap.coins} -> ${c1.coins}) and clears the saved run`);
await p.click('#runbtn'); await p.fill('#ci-input', code); await p.click('#ci-ok'); await p.waitForTimeout(150);
ok((await p.evaluate(() => window.__kyoka.state)) === 'title' && /結束/.test(await p.textContent('#ci-msg')), 'the same run code is refused once that run is over (no double coins)');
await p.screenshot({ path: 'shots/runcode-enter-zh.png' });
await p.click('#ci-back');
// 最初から discards
await p.evaluate(() => { const k = window.__kyoka; k.select('kyon', 'apple'); k.start(); k.G.t = 40; k.pause(); });
await p.waitForTimeout(300); await p.reload(); await ready(p);
ok(await vis(p, 'resumeask'), 'dialog again for a new unfinished run');
await p.click('#ra-no'); await p.waitForTimeout(100);
ok(!(await vis(p, 'resumeask')) && !(await p.evaluate(() => window.__kyoka.savedRunCode)), '最初から discards the saved run');
await p.waitForTimeout(300); await p.reload(); await ready(p); ok(!(await vis(p, 'resumeask')), 'no dialog after discarding');
// dying clears the saved run
await p.evaluate(() => { const k = window.__kyoka; k.start(); k.G.t = 20; k.pause(); }); ok(!!(await p.evaluate(() => window.__kyoka.savedRunCode)), 'run saved while paused');
await p.evaluate(() => { const k = window.__kyoka; document.getElementById('resumebtn').click(); k.end(false); }); ok(!(await p.evaluate(() => window.__kyoka.savedRunCode)), 'game over clears the saved run');
// a run code restores on a fresh browser; a stage the save doesn't own is rejected unless all-unlock
await p.evaluate(() => { const k = window.__kyoka; k.select('kyon', 'apple'); k.start(); k.G.t = 77; k.give('lariat'); k.pause(); });
const code2 = await p.evaluate(() => window.__kyoka.runCode());
const hqCode = await p.evaluate(() => { const k = window.__kyoka, r = k.decodeRun(k.runCode()); r.stage = 'hq'; r.id = 4242; return r; });
const ctx2 = await b.newContext({ viewport: { width: 390, height: 844 } }); await ctx2.addInitScript(() => localStorage.setItem('kyoka-lang', 'zh'));
const q = await page(ctx2); await q.goto(URL_); await q.waitForTimeout(400);
await q.click('#runbtn'); await q.fill('#ci-input', code2); await q.click('#ci-ok'); await q.waitForTimeout(200);
const r2 = await q.evaluate(() => ({ st: window.__kyoka.state, t: Math.floor(window.__kyoka.G.t), l: window.__kyoka.G.weapons.lariat }));
ok(r2.st === 'play' && r2.t === 77 && r2.l === 1, 'run code typed on the title screen restores the run in a new browser');
await q.evaluate(() => window.__kyoka.pause());
const why = await q.evaluate(r => window.__kyoka.runProblem(r), hqCode);
ok(why === 'locked', 'a code for a stage this save has not opened is rejected');
await q.evaluate(c => { const k = window.__kyoka; k.setProfile(k.decode(c).profile); }, process.env.ALLCODE);
ok((await q.evaluate(r => window.__kyoka.runProblem(r), hqCode)) === null, '... and accepted with the all-unlock code');
// a saved run that becomes locked (another save restored) is kept, not silently deleted: the dialog says why; keep / discard
{
  const ctx3 = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true }); await ctx3.addInitScript(() => { if (!localStorage.getItem('kyoka-lang')) localStorage.setItem('kyoka-lang', 'zh'); });
  const w = await page(ctx3); await w.goto(URL_); await ready(w);
  await w.evaluate(c => { const k = window.__kyoka; k.setProfile(k.decode(c).profile); k.select('kyon', 'hq'); k.start(); k.G.t = 61; k.give('lariat'); k.pause(); }, process.env.ALLCODE);
  const hq = await w.evaluate(() => window.__kyoka.savedRunCode); ok(!!hq, 'hq run saved with the all-unlock save');
  await w.evaluate(() => window.__kyoka.setProfile({})); // a smaller save replaces everything (the run stays in storage)
  await w.waitForTimeout(300); await w.reload(); await ready(w);
  const d1 = await w.evaluate(() => ({ vis: !document.getElementById('resumeask').classList.contains('hide'), title: document.getElementById('ra-title').textContent, why: document.getElementById('ra-why-t').textContent, code: document.getElementById('ra-code').textContent, yes: document.getElementById('ra-yes').textContent, no: document.getElementById('ra-no').textContent, stored: window.__kyoka.savedRunCode }));
  ok(d1.vis && /沒辦法繼續/.test(d1.title) && /還沒解鎖/.test(d1.why) && !!d1.stored && d1.code === d1.stored && d1.yes === '先保留' && d1.no === '捨棄', 'locked saved run: dialog explains, shows the code, nothing deleted ' + JSON.stringify(d1));
  await w.screenshot({ path: 'shots/resume-locked-zh.png' });
  await w.click('#ra-yes'); await w.waitForTimeout(100);
  ok(!(await vis(w, 'resumeask')) && (await w.evaluate(() => window.__kyoka.savedRunCode)) === d1.stored, '先保留 closes the dialog and keeps the code');
  await w.evaluate(c => { const k = window.__kyoka; k.setProfile(k.decode(c).profile); }, process.env.ALLCODE); // the original save is back
  await w.waitForTimeout(300); await w.reload(); await ready(w);
  ok(await vis(w, 'resumeask') && /上次/.test(await w.textContent('#ra-title')) && !(await vis(w, 'ra-why')), 'after restoring the original save the normal continue dialog is back');
  await w.click('#ra-yes'); await w.waitForTimeout(200);
  ok(await w.evaluate(() => window.__kyoka.state === 'play' && window.__kyoka.G.sid === 'hq' && Math.floor(window.__kyoka.G.t) === 61), 'and the kept run resumes');
  // a code that fails its checks: dialog without stage info, 捨棄 removes it
  await w.evaluate(() => { const k = window.__kyoka; k.pause(); const c = k.runCode(); document.getElementById('quitbtn').click(); localStorage.setItem('kyoka-run', c.slice(0, -1) + (c.endsWith('2') ? '3' : '2')); }); // back on the title, then a typo in the stored code
  await w.waitForTimeout(300); await w.reload(); await ready(w);
  const d2 = await w.evaluate(() => ({ vis: !document.getElementById('resumeask').classList.contains('hide'), why: document.getElementById('ra-why-t').textContent, info: !document.getElementById('ra-info').classList.contains('hide') }));
  ok(d2.vis && /沒有通過檢查/.test(d2.why) && !d2.info, 'broken saved code: dialog says it failed the checks ' + JSON.stringify(d2));
  await w.click('#ra-no'); await w.waitForTimeout(100);
  ok(!(await vis(w, 'resumeask')) && !(await w.evaluate(() => window.__kyoka.savedRunCode)), '捨棄 removes it');
  // a finished run ('used') is still dropped silently
  await w.evaluate(() => { const k = window.__kyoka; k.select('kyon', 'apple'); k.start(); k.G.t = 30; k.pause(); const c = k.runCode(); document.getElementById('quitbtn').click(); localStorage.setItem('kyoka-run', c); });
  await w.waitForTimeout(300); await w.reload(); await ready(w);
  ok(!(await vis(w, 'resumeask')) && !(await w.evaluate(() => window.__kyoka.savedRunCode)), 'a finished run is dropped without a dialog');
  for (const lang of ['ja', 'en']) { // the reason texts exist in every language
    await w.evaluate(([c, l]) => { localStorage.setItem('kyoka-lang', l); const k = window.__kyoka; k.setProfile(k.decode(c).profile); k.select('kyon', 'hq'); k.start(); k.G.t = 50; k.pause(); k.setProfile({}); }, [process.env.ALLCODE, lang]);
    await w.waitForTimeout(300); await w.reload(); await ready(w);
    const t = await w.evaluate(() => [document.getElementById('ra-title').textContent, document.getElementById('ra-why-t').textContent, document.getElementById('ra-yes').textContent, document.getElementById('ra-no').textContent]);
    ok(t.every(x => x && !/undefined/.test(x)) && await vis(w, 'ra-why'), `locked dialog in ${lang}: ${t.join(' / ')}`);
    await w.screenshot({ path: `shots/resume-locked-${lang}.png` }); await w.click('#ra-no'); await w.waitForTimeout(100);
  }
  await ctx3.close();
}
await b.close(); srv.close();
if (errs.length) throw new Error('console errors: ' + errs.slice(0, 3).join(' | '));
console.log(`runsave: ${n} checks passed, console errors: none`);
