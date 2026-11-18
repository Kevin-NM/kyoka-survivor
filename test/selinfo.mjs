// Select screen on phones: the character cards hide their description, so the chosen character's info shows under the grid.
// For ja / zh-TW / en at phone sizes: click every character on every page, the info box shows that character's name and
// description, fits inside the frame without clipping, and the start / back buttons stay on screen. Screenshots go to shots/.
import './mkshots.mjs';
import { chromium } from 'playwright-core';
import { CHARS } from '../src/meta.js';
const ROOT = decodeURI(new URL('..', import.meta.url).pathname);
let n = 0; const ok = (c, m) => { if (!c) throw new Error('FAIL: ' + m); n++; };
const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const errs = [];
for (const [w, h] of [[473, 900], [390, 844], [360, 640]]) for (const lang of ['ja', 'zh', 'en']) {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await ctx.addInitScript(l => localStorage.setItem('kyoka-lang', l), lang);
  const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  await p.goto('file://' + ROOT + 'dist/index.html'); await p.waitForTimeout(600);
  const r = await p.evaluate(code => {
    const k = window.__kyoka; k.setProfile(k.decode(code).profile); k.select('kyon', 'apple'); k.openSelect();
    const res = [], fr = document.querySelector('#select .frame').getBoundingClientRect();
    const pages = [...document.querySelectorAll('#select .pg[data-pk="c"]')].map(x => x.dataset.pi); if (!pages.length) pages.push(null);
    for (const pi of pages) { if (pi !== null) document.querySelector(`#select .pg[data-pk="c"][data-pi="${pi}"]`).click();
      for (const id of [...document.querySelectorAll('#s-chars .scard')].map(c => c.dataset.id)) {
        document.querySelector(`#s-chars .scard[data-id="${id}"]`).click();
        const ci = document.getElementById('s-cinfo'), rc = ci.getBoundingClientRect(), cs = getComputedStyle(ci), sm = ci.querySelector('small');
        const go = document.getElementById('s-go').getBoundingClientRect(), bk = document.getElementById('s-back').getBoundingClientRect();
        res.push({ id, vis: cs.display !== 'none' && rc.height > 0, txt: ci.textContent, inFrame: rc.left >= fr.left - 1 && rc.right <= fr.right + 1,
          clip: sm.scrollWidth > sm.clientWidth + 1 || ci.scrollHeight > ci.clientHeight + 2, btns: go.bottom <= innerHeight + 1 && bk.bottom <= innerHeight + 1 && go.top >= 0, hscroll: document.documentElement.scrollWidth > innerWidth + 1 });
      } }
    return res;
  }, process.env.ALLCODE);
  const want = Object.fromEntries(Object.entries(CHARS).map(([k, v]) => [k, v[lang].join('')]));
  ok(r.length === 13, `${w}x${h} ${lang}: 13 characters clicked`);
  for (const x of r) {
    ok(x.vis, `${w}x${h} ${lang} ${x.id}: info visible`);
    if (want[x.id]) ok(x.txt === want[x.id], `${w}x${h} ${lang} ${x.id}: info text matches (${x.txt})`);
    ok(!/undefined|NaN|\{[a-z]\}|\[object/.test(x.txt) && x.txt.length > 4, `${w}x${h} ${lang} ${x.id}: no placeholder`);
    ok(x.inFrame && !x.clip && !x.hscroll, `${w}x${h} ${lang} ${x.id}: fits (${JSON.stringify(x)})`);
    ok(x.btns, `${w}x${h} ${lang} ${x.id}: start/back on screen`);
  }
  if (w === 473) { await p.evaluate(() => { const k = window.__kyoka; k.select('kumicho', 'hq'); k.openSelect(); }); await p.waitForTimeout(200); await p.screenshot({ path: `shots/select-phone-${lang}.png` }); }
  await ctx.close();
}
await b.close();
if (errs.length) throw new Error('console errors: ' + errs.slice(0, 3));
console.log(`selinfo: ${n} checks passed, console errors: none`);
