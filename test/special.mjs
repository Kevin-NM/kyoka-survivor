// 必殺技 (キョンレンジャー大集合): gauge rate cap, ready button, the blast (screen cleared, bosses capped), run code keeps the gauge.
// Usage: node test/special.mjs [shotsDir]
import './mkshots.mjs';
import { chromium } from 'playwright-core';
import { encodeRun, decodeRun } from '../src/runcode.js';
const ROOT = decodeURI(new URL('..', import.meta.url).pathname), SHOTS = process.argv[2];
const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
let n = 0, fails = 0; const errs = [];
const ok = (c, m) => { n++; if (!c) { fails++; console.log('FAIL', m); } };
// run code: v2 keeps the gauge, old v1 codes still decode (empty gauge)
{ const r = { id: 7, stage: 'apple', char: 'kyon', diff: 'normal', t: 100, lvl: 5, xp: 0.5, hp: 0.5, pending: 0, kills: 50, picked: 3, banked: 0, bossKills: 0, nextBoss: 150, revives: 0, weapons: { berry: 2 }, evo: {}, passives: {}, boost: {}, sp: 0.73 };
  const d = decodeRun(encodeRun(r)); ok(d && Math.abs(d.sp - 0.73) < 0.006 && d.ver === 2, 'run code keeps the gauge ' + JSON.stringify(d && d.sp)); }
for (const [w, h, lang] of [[473, 1024, 'zh'], [390, 844, 'zh'], [360, 740, 'zh'], [390, 844, 'ja'], [390, 844, 'en'], [960, 540, 'zh']]) {
  const phone = w < 600;
  const ctx = await b.newContext({ viewport: { width: w, height: h }, hasTouch: phone, isMobile: phone, deviceScaleFactor: phone ? 2 : 1 });
  await ctx.addInitScript(l => { localStorage.setItem('kyoka-lang', l); localStorage.removeItem('kyoka-run'); }, lang);
  const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  await p.goto('file://' + ROOT + 'dist/index.html'); await p.waitForFunction(() => window.__kyoka && document.readyState === 'complete'); await p.waitForTimeout(300);
  await p.evaluate(() => window.__kyoka.setProfile({ cheats: 2, coins: 0 })); // azarashi: every character open
  const K = (f, a) => p.evaluate(f, a);
  const tag = `${w} ${lang}`;
  // gauge: lots of kills still can't fill it faster than the cap (about 70 s; キョンレンジャー about 48 s)
  for (const ch of ['kyon', 'ranger']) {
    const g = await K(ch => { const k = window.__kyoka; window.__kyokaTest = true; window.__kyokaNoLv = true; document.getElementById('resumeask')?.classList.add('hide'); k.select(ch, 'apple'); k.start(); k.G.nextBoss = 1e9; k.G.spPend = 0.6; for (let i = 0; i < 30 * 30; i++) k.step(1 / 30); return k.G.sp; }, ch);
    const want = ch === 'ranger' ? 30 / 48 : 30 / 70; ok(Math.abs(g - Math.min(0.6, want)) < 0.03, `${tag} ${ch} gauge rate after 30 s: ${g.toFixed(3)} ~ ${want.toFixed(3)}`);
  }
  // not ready: the button is the small disabled gauge ring
  const st0 = await K(() => { const k = window.__kyoka; k.G.sp = 0.4; k.step(1 / 30); const s = document.getElementById('spbtn'); return { ready: s.classList.contains('ready'), dis: s.disabled, vis: !s.classList.contains('hide'), used: k.useSp() }; });
  ok(st0.vis && !st0.ready && st0.dis && !st0.used, tag + ' gauge ring while charging ' + JSON.stringify(st0));
  // ready: big button, then the blast clears the screen, a boss takes a capped share
  await K(() => { const k = window.__kyoka; k.G.endless = true; k.G.t = 400; k.spawn(60); k.spawnBoss(); k.fillSp(); k.step(1 / 30); });
  await p.waitForTimeout(800);
  const pre = await K(() => { const k = window.__kyoka;
    for (const e of k.G.enemies) e._pre = 1; // count only foes that were there when the button was pressed
    const bs = k.G.boss; bs.x = k.G.p.x + 60; bs.y = k.G.p.y; const s = document.getElementById('spbtn').getBoundingClientRect(), d = document.getElementById('dashbtn').getBoundingClientRect(), tb = document.getElementById('topbtns').getBoundingClientRect();
    const hit = (a, c) => Math.min(a.right, c.right) - Math.max(a.left, c.left) > 0.5 && Math.min(a.bottom, c.bottom) - Math.max(a.top, c.top) > 0.5;
    return { ready: document.getElementById('spbtn').classList.contains('ready'), w: s.width, overDash: d.width > 0 && hit(s, d), overTop: hit(s, tb), off: s.left < 0 || s.right > innerWidth || s.bottom > innerHeight, bossHp: bs.hp, bossMax: bs.maxHp, n: k.G.enemies.filter(e => !e.boss && e.hp > 0).length }; });
  ok(pre.ready && pre.w >= 70 && !pre.overDash && !pre.overTop && !pre.off, tag + ' ready button big and clear of 衝刺 / pause ' + JSON.stringify(pre));
  // press it (button on phones, Q on PC)
  if (phone) await p.locator('#spbtn').dispatchEvent('pointerdown'); else await p.keyboard.press('KeyQ');
  await K(() => { for (let i = 0; i < 12; i++) window.__kyoka.step(1 / 30); });
  await p.waitForTimeout(120);
  if (SHOTS && (lang === 'zh' || w === 390)) await p.screenshot({ path: `${SHOTS}/special-${w}-${lang}.png` });
  const post = await K(() => { const k = window.__kyoka, p = k.G.p; for (let i = 0; i < 18; i++) k.step(1 / 30); const hw = 0.5 * window.__kyoka.RD.viewW, hh = 0.5 * window.__kyoka.RD.viewH;
    return { spN: k.G.spN, sp: k.G.sp, left: k.G.enemies.filter(e => e._pre && !e.boss && e.hp > 0 && Math.abs(e.x - p.x) < hw && Math.abs(e.y - p.y) < hh).length, boss: k.G.boss && k.G.boss.hp, max: k.G.boss && k.G.boss.maxHp, banner: document.getElementById('banner').textContent }; });
  ok(post.spN === 1 && post.sp < 0.02, tag + ' special used ' + JSON.stringify(post));
  ok(post.left <= 2, tag + ' on-screen foes cleared, left: ' + post.left);
  const took = (pre.bossHp - post.boss) / post.max; ok(post.boss > 0 && took > 0.02 && took <= 0.05 + 0.03, tag + ` endless boss took a capped share ${took.toFixed(3)}`);
  ok(/キョンレンジャー/.test(post.banner), tag + ' banner ' + post.banner);
  // animation is short and the game keeps running
  const fin = await K(() => { const k = window.__kyoka; const t0 = k.G.t; for (let i = 0; i < 60; i++) k.step(1 / 30); return { spT: k.G.spT, dt: k.G.t - t0, state: k.state }; });
  ok(fin.spT <= 0 && fin.dt > 1.9 && fin.state === 'play', tag + ' animation ends within 2.4 s, game not paused ' + JSON.stringify(fin));
  // run code from this page keeps the gauge
  const rc = await K(() => { const k = window.__kyoka; k.G.sp = 0.5; return k.decodeRun(k.runCode()).sp; });
  ok(Math.abs(rc - 0.5) < 0.006, tag + ' run code gauge ' + rc);
  await ctx.close();
}
console.log(`special: ${n} checks, ${fails} failed, console errors: ${errs.length ? errs.join(' | ') : 'none'}`);
await b.close(); if (fails || errs.length) process.exitCode = 1;
