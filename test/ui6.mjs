// Phase 6 UI completeness (no gameplay): with the all-unlock code, every new stage / character / zukan entry / achievement
// shows in the menus in ja, zh-TW and en, every new weapon and pickup has a name, no placeholders or "undefined" leak,
// and every new stage (and the loop) loads without console errors.
import { chromium } from 'playwright-core';
const ROOT = decodeURI(new URL('..', import.meta.url).pathname);
const errs = []; let n = 0;
const ok = (c, m) => { if (!c) throw new Error('FAIL: ' + m); n++; console.log('ok -', m); };
const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const NEW = ['halloween', 'runway', 'ring', 'dawn', 'cherry', 'station', 'clinic', 'okinawa', 'hq', 'road'];
const BAD = /undefined|NaN|\{[a-z]\}|\[object/;
for (const lang of ['ja', 'zh', 'en']) {
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 } });
  await ctx.addInitScript(l => localStorage.setItem('kyoka-lang', l), lang);
  const p = await ctx.newPage();
  p.on('pageerror', e => errs.push(lang + ' ' + e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(lang + ' ' + m.text()); });
  await p.goto('file://' + ROOT + 'dist/index.html'); await p.waitForTimeout(800);
  const code = process.env.ALLCODE;
  const r = await p.evaluate(async code => {
    const k = window.__kyoka, d = k.decode(code); k.setProfile(d.profile);
    const out = { stages: new Set(), chars: new Set(), locked: 0, bad: [] }, txt = s => { if (/undefined|NaN|\{[a-z]\}|\[object/.test(s)) out.bad.push(s.slice(0, 80)); };
    k.openSelect(); const pgs = () => [...document.querySelectorAll('#select .pg')];
    for (const kind of ['s', 'c']) for (const b of pgs().filter(x => x.dataset.pk === kind)) { document.querySelector(`#select .pg[data-pk="${kind}"][data-pi="${b.dataset.pi}"]`).click();
      for (const c of document.querySelectorAll('#select .scard')) { (c.dataset.kind === 'stage' ? out.stages : out.chars).add(c.dataset.id); if (c.classList.contains('locked')) out.locked++; txt(c.textContent); } }
    txt(document.querySelector('#select').textContent); k.closeScreen();
    k.openZukan('book'); const z = document.querySelectorAll('#zk-body img, #zk-body button, #zk-body .zk'); out.zukanDom = document.querySelector('#zk-body').textContent.length; txt(document.querySelector('#zukan').textContent);
    const tabs = [...document.querySelectorAll('#zukan [data-tab], #zukan .tab, #zukan button')].map(x => x.textContent); out.tabs = tabs.length; k.closeScreen();
    return { stages: [...out.stages], chars: [...out.chars], locked: out.locked, bad: out.bad, zk: out.zukanDom };
  }, code);
  ok(r.stages.length === 19 && r.chars.length === 13 && r.locked === 0, `${lang}: select shows 19 stages + 13 characters, all unlocked`);
  ok(!r.bad.length, `${lang}: no placeholders in select / zukan (${r.bad.slice(0, 2)})`);
  // names for every new item, stage text, zukan entry, achievement in this language
  const t = await p.evaluate(lang => { const k = window.__kyoka; return k.textAudit(lang); }, lang);
  ok(!t.missing.length, `${lang}: every new weapon / pickup / stage / zukan / achievement has text (${t.missing.slice(0, 5)})`);
  ok(!t.bad.length, `${lang}: no placeholders left in texts (${t.bad.slice(0, 3)})`);
  if (lang === 'zh') ok(!t.kana.length, `zh: no kana outside proper nouns (${t.kana.slice(0, 5)})`);
  if (lang === 'en') ok(!t.kana.length, `en: no Japanese outside proper nouns (${t.kana.slice(0, 5)})`);
  ok(t.zukan === 70 && t.zukanOpen === 70 && t.ach === 64 && t.achHave === 64, `${lang}: all-unlock code opens 70/70 zukan and 64/64 achievements`);
  // every new stage loads (one frame, no play-testing)
  if (lang === 'ja') for (const sid of NEW) {
    const s = await p.evaluate(sid => { const k = window.__kyoka; k.select('kyon', sid); k.start(); window.__kyokaTest = true; k.step(1 / 30); const r = { st: k.state, sid: k.G.sid, g: k.G.stage }; k.end(false); document.querySelector('#titlebtn').click(); return r; }, sid);
    await p.waitForTimeout(150);
    ok(s.st === 'play' && s.sid === sid, `${sid} loads (ground ${s.g})`);
  }
  await ctx.close();
}
ok(!errs.length, 'no console errors (' + errs.slice(0, 3).join(' | ') + ')');
console.log(`\n${n} checks passed`); await b.close();
