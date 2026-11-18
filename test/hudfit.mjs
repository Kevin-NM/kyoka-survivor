// HUD overlap check on phones (portrait 473 / 390 / 360) and PC: player block, weapon/passive/boost icons,
// timer box, counters, boss bar (one boss and two), pause/mute, dash and 必殺技 buttons must not overlap or leave the screen.
// Usage: node test/hudfit.mjs [shotsDir]  — with a dir, saves zh-TW screenshots of the fullest 2-boss state per width.
import './mkshots.mjs';
import { chromium } from 'playwright-core';
const ROOT = decodeURI(new URL('..', import.meta.url).pathname);
const SHOTS = process.argv[2];
const VPS = [[473, 1024], [390, 844], [360, 740], [960, 540]];
const LANGS = ['zh', 'ja', 'en'];
const W9 = ['berry', 'lariat', 'beam', 'drum', 'mic', 'apple', 'ham', 'fan', 'guitar', 'cyalume'], PAS = ['shoes', 'ribbon', 'gobelt', 'suzuri', 'metro'];
const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const errs = []; let checks = 0, bad = 0;
const measure = () => {
  const r = el => { const q = el.getBoundingClientRect(); return { x: q.left, y: q.top, r: q.right, b: q.bottom, w: q.width, h: q.height }; };
  const vis = el => el && !el.classList.contains('hide') && getComputedStyle(el).display !== 'none' && el.getBoundingClientRect().width > 0;
  const boxes = [];
  const add = (g, el) => { if (vis(el)) boxes.push({ g, id: el.id || el.className, ...r(el) }); };
  add('player', document.querySelector('#player .medal')); add('lv', document.getElementById('lvbadge')); add('player', document.getElementById('hpwrap'));
  for (const w of document.querySelectorAll('#weps > *')) add('player', w);
  add('timer', document.getElementById('timerplate')); add('counts', document.getElementById('counts'));
  add('boss', document.getElementById('bossbar')); { const bn = document.querySelector('#banner span'); if (bn && getComputedStyle(document.getElementById('banner')).opacity > 0.05) add('banner', bn); } add('btns', document.getElementById('topbtns')); add('dash', document.getElementById('dashbtn')); add('sp', document.getElementById('spbtn'));
  const iss = [], W = innerWidth, H = innerHeight;
  { // the Lv badge must not cover the portrait (face) at all
    const pi = document.getElementById('portrait').getBoundingClientRect(), lb = document.getElementById('lvbadge').getBoundingClientRect();
    if (Math.min(pi.right, lb.right) - Math.max(pi.left, lb.left) > 0.5 && Math.min(pi.bottom, lb.bottom) - Math.max(pi.top, lb.top) > 0.5) iss.push('lv badge over portrait');
    const md = document.querySelector('#player .medal').getBoundingClientRect(); if (lb.top < md.bottom - 0.5) iss.push('lv badge not below the medal');
  }
  for (const a of boxes) if (a.x < -1 || a.y < -1 || a.r > W + 1 || a.b > H + 1) iss.push(`offscreen ${a.g}:${a.id}`);
  for (let i = 0; i < boxes.length; i++) for (let j = i + 1; j < boxes.length; j++) {
    const a = boxes[i], c = boxes[j]; if (a.g === c.g) continue;
    if (Math.min(a.r, c.r) - Math.max(a.x, c.x) > 0.5 && Math.min(a.b, c.b) - Math.max(a.y, c.y) > 0.5) iss.push(`${a.g}:${a.id} × ${c.g}:${c.id}`);
  }
  return { iss, n: boxes.length, boss: boxes.some(x => x.g === 'boss') };
};
for (const [w, h] of VPS) for (const lang of LANGS) {
  const phone = w < 600;
  const ctx = await b.newContext({ viewport: { width: w, height: h }, hasTouch: phone, isMobile: phone, deviceScaleFactor: phone ? 2 : 1 });
  await ctx.addInitScript(l => { localStorage.setItem('kyoka-lang', l); localStorage.removeItem('kyoka-run'); }, lang);
  const p = await ctx.newPage();
  p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  // nW weapons (endless t=900 → 10 slots), nP passives, boosts, bosses 0/1/2
  for (const [nW, nP, boost, bosses] of [[1, 0, 0, 0], [3, 2, 0, 1], [6, 5, 0, 1], [6, 5, 1, 2], [9, 0, 0, 2], [9, 5, 0, 1], [9, 5, 1, 2], [10, 5, 2, 2], [10, 0, 2, 1]]) {
    await p.goto('file://' + ROOT + 'dist/index.html'); await p.waitForFunction(() => window.__kyoka && document.readyState === 'complete');
    await p.waitForTimeout(300);
    await p.evaluate(([nW, nP, boost, bosses, W9, PAS]) => {
      const k = window.__kyoka; window.__kyokaTest = true; window.__kyokaNoLv = true;
      document.getElementById('resumeask')?.classList.add('hide');
      k.select('kyon', 'road'); k.start(); k.setAuto(true); k.G.endless = true; k.G.t = 900; k.step(1 / 30);
      for (const x of W9.slice(0, nW)) k.give(x); for (const x of PAS.slice(0, nP)) k.give(x);
      if (boost) { k.give('b_atk'); k.give('b_hp'); }
      if (boost === 2) for (const x of ['b_spd', 'b_mag', 'b_cd', 'b_area', 'b_regen']) k.give(x); // every boost icon
      if (bosses) k.spawnBoss(bosses === 2); else k.G.nextBoss = 1e9;
      if (bosses === 2 || nW >= 9) k.fillSp(); // big ready button in the fullest states, the small gauge ring in the others
      for (let i = 0; i < 6; i++) k.step(1 / 30);
    }, [nW, nP, boost, bosses, W9, PAS]);
    await p.waitForTimeout(250);
    const m = await p.evaluate(measure); checks++;
    const tag = `${w}x${h} ${lang} w${nW} p${nP}${boost ? ' +boost' : ''} boss${bosses}`;
    if (bosses && !m.boss) m.iss.push('boss bar not shown');
    if (bosses === 2) { const two = await p.evaluate(() => !document.getElementById('bossbar2')?.classList.contains('hide')); if (!two) m.iss.push('second boss bar not shown'); }
    if (m.iss.length) { bad++; console.log('✗', tag, m.iss.slice(0, 6).join(' | ')); await p.screenshot({ path: `/tmp/hudfit-${w}-${lang}-${nW}-${nP}-${bosses}.png` }); }
    if (SHOTS && lang === 'zh' && nW === 10 && nP === 5 && bosses === 2) await p.screenshot({ path: `${SHOTS}/hud-2boss-${w}-zh.png` });
  }
  await ctx.close();
}
console.log(`hudfit: ${checks} states, ${bad} with overlaps, console errors: ${errs.length ? errs.join(' | ') : 'none'}`);
await b.close();
if (bad || errs.length) process.exitCode = 1;
