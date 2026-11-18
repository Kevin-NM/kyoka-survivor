// Level-up cards on phones: number badge readable and off the art, name + stars together beside the art,
// NEW badge clear of the name. Widths 473 / 390 / 360 portrait, ja / zh / en, long names. Usage: node test/lvcards.mjs [shotsDir]
import './mkshots.mjs';
import { chromium } from 'playwright-core';
const ROOT = decodeURI(new URL('..', import.meta.url).pathname), SHOTS = process.argv[2];
const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const errs = []; let n = 0, bad = 0;
for (const w of [473, 390, 360]) for (const lang of ['zh', 'ja', 'en']) {
  const ctx = await b.newContext({ viewport: { width: w, height: 860 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
  await ctx.addInitScript(l => { localStorage.setItem('kyoka-lang', l); localStorage.removeItem('kyoka-run'); }, lang);
  const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message));
  for (const set of [['lariat', 'hlock', 'syr'], ['berry', 'hlock', 'metro'], ['lariat', 'shoes', 'oyaki']]) {
    await p.goto('file://' + ROOT + 'dist/index.html'); await p.waitForFunction(() => window.__kyoka && document.readyState === 'complete'); await p.waitForTimeout(250);
    const got = await p.evaluate(set => { const k = window.__kyoka; window.__kyokaTest = true; document.getElementById('resumeask')?.classList.add('hide'); k.select('kyon', 'apple'); k.start(); k.give('lariat'); k.showOffers(set); }, set);
    await p.waitForTimeout(700);
    const r = await p.evaluate(() => {
      const R = e => e.getBoundingClientRect(), iss = [], hit = (a, c) => Math.min(a.right, c.right) - Math.max(a.left, c.left) > 0.5 && Math.min(a.bottom, c.bottom) - Math.max(a.top, c.top) > 0.5;
      const lum = c => { const m = c.match(/\d+(\.\d+)?/g).map(Number); return 0.2126 * m[0] + 0.7152 * m[1] + 0.0722 * m[2]; };
      const names = [];
      for (const c of document.querySelectorAll('#cards .card')) {
        const key = c.querySelector('.key'), art = c.querySelector('.art'), nm = c.querySelector('.nm'), pips = c.querySelector('.pips'), nw = c.querySelector('.new'), ds = c.querySelector('.ds');
        names.push(nm.textContent);
        const ks = getComputedStyle(key); if (lum(ks.color) > 128 || !/gradient/.test(ks.backgroundImage)) iss.push('badge not light/contrasting');
        if (hit(R(key), R(art).toJSON ? R(art) : R(art))) { const a = R(art), k = R(key); if (Math.min(a.right, k.right) - Math.max(a.left, k.left) > 4 && Math.min(a.bottom, k.bottom) - Math.max(a.top, k.top) > 4) iss.push('badge overlaps art'); }
        const a = R(art), n = R(nm), pp = R(pips);
        if (n.left < a.right - 0.5) iss.push('name not beside art');
        if (pips.children.length && (pp.left < a.right - 0.5 || pp.top < n.bottom - 0.5)) iss.push('stars not under name beside art');
        if (nw && (hit(R(nw), n) || hit(R(nw), pp))) iss.push('NEW collides');
        if (n.right > R(c).right + 0.5 || nm.scrollWidth > nm.clientWidth + 1) iss.push('name overflows');
        if (ds && hit(R(ds), a)) iss.push('desc over art');
      }
      return { iss, names };
    });
    n++; if (r.iss.length) { bad++; console.log('✗', w, lang, set.join(','), r.names.join(' / '), [...new Set(r.iss)].join(' | ')); }
    if (SHOTS && set[1] === 'hlock' && set[0] === 'lariat' && (lang === 'zh' || w === 360)) await p.screenshot({ path: `${SHOTS}/levelup-${w}-${lang}.png` });
  }
  await ctx.close();
}
console.log(`lvcards: ${n} states, ${bad} with issues, errors: ${errs.length ? errs.join(' | ') : 'none'}`);
await b.close(); if (bad || errs.length) process.exitCode = 1;
