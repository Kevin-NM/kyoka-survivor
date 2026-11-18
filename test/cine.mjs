// 必殺技 cut-scene (キョンレンジャー大集合): the game freezes, the timeline plays, the finisher clears the screen,
// a second use can be skipped, sparks stay capped. Key-frame screenshots at 390 (phone) and 960 (desktop), zh-TW.
// Usage: node test/cine.mjs [shotsDir]
import './mkshots.mjs';
import { chromium } from 'playwright-core';
const ROOT = decodeURI(new URL('..', import.meta.url).pathname), SHOTS = process.argv[2];
const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
let n = 0, fails = 0; const errs = [];
const ok = (c, m) => { n++; if (!c) { fails++; console.log('FAIL', m); } };
const FRAMES = [['1-cutin', 0.3], ['2-entry-red', 0.78], ['3-entry-green', 1.95], ['4-group-boom', 2.85], ['5-finisher', 3.62], ['6-pops', 3.85]];
for (const [w, h] of [[390, 844], [960, 540]]) {
  const phone = w < 600, tag = `${w}`;
  const ctx = await b.newContext({ viewport: { width: w, height: h }, hasTouch: phone, isMobile: phone, deviceScaleFactor: phone ? 2 : 1 });
  await ctx.addInitScript(() => { localStorage.setItem('kyoka-lang', 'zh'); localStorage.removeItem('kyoka-run'); localStorage.removeItem('kyoka-spseen'); });
  const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  await p.goto('file://' + ROOT + 'dist/index.html'); await p.waitForFunction(() => window.__kyoka && document.readyState === 'complete'); await p.waitForTimeout(300);
  const K = (f, a) => p.evaluate(f, a);
  await K(() => { const k = window.__kyoka; window.__kyokaTest = true; window.__kyokaNoLv = true; document.getElementById('resumeask')?.classList.add('hide');
    k.select('kyon', 'apple'); k.start(); k.G.nextBoss = 1e9; k.G.t = 120; k.spawn(40); for (let i = 0; i < 20; i++) k.step(1 / 30); k.fillSp(); k.step(1 / 30); });
  const pre = await K(() => { const k = window.__kyoka, G = k.G; window.__kyokaHold = true; G.enemies.forEach((e, i) => { e._i = i; }); const s = { t: G.t, hp: G.p.hp, e: G.enemies.map(e => [e.x, e.y]) }; k.useSp(); return s; });
  ok(!(await K(() => document.getElementById('spfx').classList.contains('hide'))), tag + ' overlay shown');
  let at = 0;
  for (const [name, t] of FRAMES) {
    const st = await K(([dt]) => { const k = window.__kyoka; for (let i = 0; i < Math.round(dt * 60); i++) k.step(1 / 60); return k.spState; }, [t - at]); at = t;
    await p.waitForTimeout(120);
    if (SHOTS) await p.screenshot({ path: `${SHOTS}/cine-${w}-${name}.png` });
    ok(st.cine && st.cine.sparks <= 90, `${tag} ${name} sparks capped ${JSON.stringify(st.cine)}`);
    if (t < 3.6) { const fr = await K(pre => { const G = window.__kyoka.G; let moved = 0; for (const e of G.enemies) { const q = pre.e[e._i]; if (q && Math.hypot(e.x - q[0], e.y - q[1]) > 0.01) moved++; } return { dt: G.t - pre.t, moved, hp: G.p.hp }; }, pre);
      ok(fr.dt === 0 && fr.moved === 0 && fr.hp === pre.hp, `${tag} ${name} game frozen ${JSON.stringify(fr)}`); }
    if (name === '1-cutin') ok(!st.cine.canSkip, tag + ' first viewing cannot be skipped');
  }
  const post = await K(() => { const k = window.__kyoka, G = k.G; for (let i = 0; i < 60; i++) k.step(1 / 60); const hw = 0.5 * k.RD.viewW, hh = 0.5 * k.RD.viewH;
    return { cine: !!G.cine, spT: G.spT, hide: document.getElementById('spfx').classList.contains('hide'), left: G.enemies.filter(e => e._i !== undefined && e.hp > 0 && Math.abs(e.x - G.p.x) < hw && Math.abs(e.y - G.p.y) < hh).length, seen: localStorage.getItem('kyoka-spseen') }; });
  ok(!post.cine && post.spT === 0 && post.hide && post.seen === '1', tag + ' cut-scene ends and hides ' + JSON.stringify(post));
  ok(post.left <= 2, tag + ' finisher cleared the screen, left ' + post.left);
  // second use: the skip hint shows and a tap jumps to the finisher, which still lands
  await K(() => { const k = window.__kyoka; k.spawn(30); for (let i = 0; i < 10; i++) k.step(1 / 30); k.fillSp(); k.step(1 / 30); k.useSp(); k.step(1 / 30); });
  if (SHOTS) { await p.waitForTimeout(120); await p.screenshot({ path: `${SHOTS}/cine-${w}-7-skip-hint.png` }); }
  if (phone) await p.locator('#spfx').dispatchEvent('pointerdown'); else await p.keyboard.press('Enter');
  const sk = await K(() => window.__kyoka.spState.cine);
  ok(sk && sk.canSkip && sk.skipped && sk.t >= 3.45, tag + ' second use skippable ' + JSON.stringify(sk));
  const end = await K(() => { const k = window.__kyoka; for (let i = 0; i < 90; i++) k.step(1 / 60); return { cine: !!k.G.cine, n: k.G.spN, state: k.state }; });
  ok(!end.cine && end.n === 2 && end.state === 'play', tag + ' skipped cut-scene ends ' + JSON.stringify(end));
  await ctx.close();
}
console.log(`cine: ${n} checks, ${fails} failed, console errors: ${errs.length ? errs.join(' | ') : 'none'}`);
await b.close(); if (fails || errs.length) process.exitCode = 1;
