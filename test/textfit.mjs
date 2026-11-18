const ROOT = decodeURI(new URL('..', import.meta.url).pathname); // repo root, wherever it is checked out
// Text-fit audit: every screen × ja / zh / en × 960x540, phone portrait 390x844, phone landscape 844x390.
// Fails on clipped / overflowing / off-screen text, text spilling out of a button or card, horizontal scrollbars,
// and mixed languages (kana in zh-TW, Japanese in English). Screenshots of any failing state go to /tmp/textfit/.
import './mkshots.mjs';
import { chromium } from 'playwright-core';
import fs from 'node:fs';
fs.mkdirSync('/tmp/textfit', { recursive: true });
const only = process.argv[2];
const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const VPS = [['pc', { width: 960, height: 540 }, false], ['phoneP', { width: 390, height: 844 }, true], ['phoneL', { width: 844, height: 390 }, true]];
const LANGS = ['ja', 'zh', 'en'];
const errs = [];
const PROFILE = { coins: 12345, debt: 0, cheats: 6, clears: 3, ach: 2 ** 22 - 1 - 2 ** 5, up: { panier: 1, shodo: 2 }, st: { apple: { t: 300, k: 812, d: 4 }, berry: { t: 300, k: 640, d: 2 }, race: { t: 204, k: 401, d: 0 } } };
// each screen: [name, overlay to audit, setup in page]
const SCREENS = [
  ['title', '#title', () => {}],
  ['select', '#select', k => k.openSelect()],
  ['diff', '#diff', k => { k.openSelect(); k.openDiff(); }],
  ['shop', '#shop', k => k.openShop()],
  ['refund', '#borrow', k => { k.openShop(); k.askRefund(); }],
  ['borrow', '#borrow', k => { k.setProfile({ ...k.profile, coins: 5 }); k.openShop(); k.tryBuy('drumbeat'); }],
  ['zukan', '#zukan', k => k.openZukan('book')],
  ['zukanDetail', '#zukan', k => { k.openZukan('book'); const c = document.querySelector('#zk-grid .zc:not(.locked)') || document.querySelector('#zk-grid > *'); c && c.click(); }],
  ['achievements', '#zukan', k => k.openZukan('ach')],
  ['evolist', '#zukan', k => k.openZukan('evo')],
  ['guide', '#guide', () => document.getElementById('guidebtn').click()],
  ['guideMore', '#guide', () => { document.getElementById('guidebtn').click(); document.getElementById('g-tab-more').click(); }],
  ['codein', '#codein', () => { document.getElementById('codebtn').click(); const i = document.getElementById('ci-input'); i.value = 'ABCD-EFGH'; document.getElementById('ci-ok').click(); }],
  ['cheat', '#cheat', k => { k.openCheat(); }],
  ['runcodeIn', '#codein', () => { document.getElementById('runbtn').click(); const i = document.getElementById('ci-input'); i.value = 'ABCD-EFGH-JKMN-PQRS-TUVW-XYZ2'; document.getElementById('ci-ok').click(); }],
  ['pauseRun', '#pause', k => { k.select('kyon', 'apple'); k.start(); k.pause(); }],
  ['runcode', '#runcode', k => { k.select('kyon', 'apple'); k.start(); k.G.t = 123; k.pause(); k.openRunCode(); }],
  ['resumeAsk', '#resumeask', k => { k.select('dj', 'halloween'); k.start(); k.G.t = 95; k.pause(); document.getElementById('quitbtn'); k.openResumeAsk(); }],
  ['resumeLocked', '#resumeask', k => { k.select('dj', 'halloween'); k.start(); k.G.t = 95; k.pause(); k.setProfile({}); k.openResumeAsk(); }], // saved run kept, reason shown
  ['resumeBad', '#resumeask', k => { localStorage.setItem('kyoka-run', 'ABCD-EFGH-JKMN-PQRS-TUVW-XYZ2'); k.openResumeAsk(); }],
  ['hud', '#hud', k => { k.select('kyon', 'apple'); k.start(); k.setAuto(true); k.spawn(30); ['seal', 'lariat', 'penlight', 'ham', 'guitar', 'shoes', 'wasabi'].forEach(x => k.give(x)); }],
  ['pause', '#pause', k => { k.select('odekake', 'night'); k.start(); k.give('fan'); k.pause(); }],
  ['levelup', '#levelup', k => { k.select('kyon', 'apple'); k.start(); k.give('lariat'); k.give('lariat'); k.give('lariat'); k.give('gakufu'); k.levelUp(); }],
  ['evocard', '#levelup', k => { k.select('kyon', 'apple'); k.start(); k.maxWeapon('guitar'); k.levelUp(); }],
  ['chest', '#chest', k => { k.select('kyon', 'zoo'); k.start(); k.openChest(); }, 3000],
  ['ringcake', '#chest', k => { k.select('dress', 'chapel'); k.start(); k.drop('ringcake'); k.step(1 / 60); }, 3000],
  ['zukanWedding', '#zukan', k => { k.openZukan('book'); const c = [...document.querySelectorAll('#zk-grid > *')].pop(); c && c.click(); }],
  ['boostCards', '#levelup', k => { k.select('kyon', 'apple'); k.start(); for (const w of ['berry', 'lariat', 'beam', 'drum', 'mic', 'apple']) { k.maxWeapon(w); k.G.evo[w] = true; } for (const id of ['shoes', 'ribbon', 'gobelt', 'suzuri', 'metro']) while (k.lvOf(id) < 3) k.give(id); k.give('b_atk'); k.levelUp(); }],
  ['hudFullEndless', '#hud', k => { k.select('kyon', 'apple'); k.start(); k.setAuto(true); for (const w of ['berry', 'lariat', 'beam', 'drum', 'mic', 'apple']) k.give(w); for (const id of ['shoes', 'ribbon', 'gobelt', 'suzuri', 'metro']) k.give(id); k.give('b_atk'); k.give('b_hp'); k.G.t = 700; k.G.endless = true; k.step(1 / 30); }],
  ['hud9', '#hud', k => { k.select('kyon', 'road'); k.start(); k.setAuto(true); k.G.t = 700; k.step(1 / 30); for (const w of ['berry', 'lariat', 'beam', 'drum', 'mic', 'apple', 'ham', 'fan', 'guitar']) k.give(w); for (const id of ['shoes', 'ribbon', 'gobelt', 'suzuri', 'metro']) k.give(id); k.give('b_atk'); k.give('b_hp'); k.step(1 / 30); }],
  ['spReady', '#spbtn', k => { k.select('kyon', 'apple'); k.start(); k.setAuto(true); k.fillSp(); k.step(1 / 30); }, 900],
  ['spBanner', '#banner', k => { k.select('kyon', 'apple'); k.start(); k.setAuto(true); k.fillSp(); k.step(1 / 30); k.useSp(); k.step(1 / 30); }, 700],
  ['shopGoods', '#shop', k => { k.openShop(); document.querySelector('#sh-tabs [data-cat="goods"]').click(); }],
  ['shopRep', '#shop', k => { k.openShop(); document.querySelector('#sh-tabs [data-cat="rep"]').click(); }],
  ['endlessEnd', '#end', k => { k.select('kyon', 'snow'); k.start(); k.G.endless = true; k.skipTo(845); k.end(false); }, 1600],
  ['win', '#end', k => { k.setDiff('hard'); k.select('ranger', 'snow'); k.start(); k.G.kills = 1234; k.skipTo(300); k.end(true); }, 1600],
  ['over', '#end', k => { k.setDiff('geki'); k.select('kyon', 'race'); k.start(); k.skipTo(123); k.end(false); }, 1600],
];
// phase-6 proper nouns (no established translation, so they stay in Japanese in every language)
const P6PN = 'キョンレンジャー大集合|キョンレンジャー|きょんカフェ|きょん式ハートロック|ギュッとハートロック|千客万来|チャカ⇄ダンビラ|ダンビラ|くみちょー|ハムナンバーカード|ハムコイン|キョウカのエモノ|エモノ|熱唱タオル|きょうみお|亨香組|鉄の掟|一生家族|好成員|漆黒のブルーサファイア|次世代司会ユニット|歌の守屋の日|ハムら市にあつまれ|ハムら市|千紫万紅|ギターきょん|サランへヨ|きょうか|はんぺん|きょん';
// words allowed to stay in Japanese inside other languages (the character's name, the save button label in the guide, codes)
const ALLOW = { zh: /きょんちゃん|きょん|おでかけ|キョンレンジャー|みちづれ|おはやう|おやき|テスト|鉄の掟|ささもり|チャカダン|キョン|じゅもん|ひみつのコード|あそびかた|いちご|あざらし|しんしゅう|はむはむ|はんぺん|ずかん|おはやう|イチゴ|ハムハム|キョンキョン|オハヤウ|しゅっぱつ|ドレスきょん|ゴスロリきょん|サイリウム|結婚式は愛の中で/g, en: /きょん|いちご|あざらし|しんしゅう|はむはむ|はんぺん|ずかん|おはやう|イチゴ|ハムハム|キョンキョン|オハヤウ|日本語|繁體中文|守屋亨香/g };
function audit({ root, lang, allow }) {
  const R = document.querySelector(root), out = [], vw = innerWidth, vh = innerHeight;
  if (!R || R.classList.contains('hide')) return [{ k: 'notshown', t: root }];
  const boxes = 'button, .btn, .card, .scard, .dbtn, .zc, .erow, .chip, .slot'; // (HUD level badges sit on the icon corner on purpose)
  const w = document.createTreeWalker(R, NodeFilter.SHOW_TEXT); let n;
  while ((n = w.nextNode())) {
    const txt = n.textContent.trim(); if (!txt) continue;
    const el = n.parentElement, cs = getComputedStyle(el);
    if (!el.getClientRects().length || cs.visibility === 'hidden' || el.closest('.hide')) continue;
    let op = 1; for (let a = el; a; a = a.parentElement) op *= +getComputedStyle(a).opacity; if (op < 0.05) continue;
    const rg = document.createRange(); rg.selectNodeContents(n); const rs = [...rg.getClientRects()].filter(r => r.width > 0); if (!rs.length) continue;
    const r = { left: Math.min(...rs.map(x => x.left)), right: Math.max(...rs.map(x => x.right)), top: Math.min(...rs.map(x => x.top)), bottom: Math.max(...rs.map(x => x.bottom)) };
    const id = (el.id ? '#' + el.id : el.tagName.toLowerCase() + (el.className && typeof el.className === 'string' ? '.' + el.className.split(' ')[0] : '')) + ' "' + txt.slice(0, 24) + '"';
    // past the first scroller on an axis, outer clipping on that axis is just scrolling
    let scrollY = false, scrollX = false;
    for (let a = el; a && a !== document.body; a = a.parentElement) {
      const s = getComputedStyle(a), ar = a.getBoundingClientRect(), sx = /auto|scroll/.test(s.overflowX), sy = /auto|scroll/.test(s.overflowY);
      if (s.overflowX !== 'visible' && !sx && !scrollX && (r.left < ar.left - 1.5 || r.right > ar.right + 1.5)) out.push({ k: 'clipX', t: id, by: a.id || a.className });
      if (s.overflowY !== 'visible' && !sy && !scrollY && (r.top < ar.top - 1.5 || r.bottom > ar.bottom + 1.5)) out.push({ k: 'clipY', t: id, by: a.id || a.className });
      if (sy) scrollY = true; if (sx) scrollX = true;
      if (sx && a.scrollWidth > a.clientWidth + 2) out.push({ k: 'hscroll', t: id, by: a.id || a.className });
      if (a.matches(boxes) && !el.matches('.card > .key') /* level-up number badge sits on the card corner on purpose */ && (r.left < ar.left - 2 || r.right > ar.right + 2 || r.top < ar.top - 2 || r.bottom > ar.bottom + 2)) out.push({ k: 'spill', t: id, by: a.id || a.className.split(' ')[0] });
    }
    if (!scrollY && (r.left < -1 || r.right > vw + 1 || r.top < -1 || r.bottom > vh + 1)) out.push({ k: 'offscreen', t: id, r: [r.left, r.top, r.right, r.bottom].map(Math.round) });
    if (cs.textOverflow === 'ellipsis' && el.scrollWidth > el.clientWidth + 1) out.push({ k: 'ellipsis', t: id });
    const plain = txt.replace(new RegExp(allow, 'g'), '');
    if (lang === 'zh' && /[\u3040-\u309f\u30a0-\u30ff]/.test(plain)) out.push({ k: 'kanaInZh', t: id, full: txt });
    if (lang === 'en' && /[\u3040-\u30ff\u4e00-\u9fff]/.test(plain)) out.push({ k: 'cjkInEn', t: id, full: txt });
    if (/undefined|NaN|\{[a-z]+\}|\[object/.test(txt)) out.push({ k: 'template', t: id, full: txt });
  }
  const seen = new Set(); return out.filter(o => { const s = o.k + o.t + o.by; if (seen.has(s)) return false; seen.add(s); return true; });
}
let total = 0, states = 0;
for (const [vn, vp, touch] of VPS) for (const lang of LANGS) {
  const ctx = await b.newContext({ viewport: vp, hasTouch: touch, isMobile: touch, deviceScaleFactor: 1 });
  await ctx.addInitScript(l => { localStorage.setItem('kyoka-lang', l); localStorage.removeItem('kyoka-run'); }, lang);
  const p = await ctx.newPage();
  p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  for (const [name, root, setup, wait] of SCREENS) {
    if (only && !only.split(',').includes(name)) continue;
    await p.goto('file://' + ROOT + 'dist/index.html'); await p.waitForTimeout(700);
    await p.evaluate(pr => { window.__kyokaTest = true; window.__kyoka.setProfile(pr); }, PROFILE);
    await p.evaluate(`(${setup})(window.__kyoka)`); await p.waitForTimeout(wait || 450);
    const iss = await p.evaluate(audit, { root, lang, allow: 'おでかけきょんちゃん|' + P6PN + '|甘ロリきょん|和ロリきょん|' + (ALLOW[lang] || /$^/).source });
    states++;
    if (process.env.SHOT && !iss.length) await p.screenshot({ path: `/tmp/textfit/${vn}-${lang}-${name}.png` });
    if (iss.length) { total += iss.length; const f = `/tmp/textfit/${vn}-${lang}-${name}.png`; await p.screenshot({ path: f }); console.log(`✗ ${vn} ${lang} ${name} (${f})`); for (const i of iss) console.log('   ', JSON.stringify(i)); }
  }
  await ctx.close();
}
console.log(`${states} screen states checked, ${total} issues, console errors: ${errs.length ? errs.join(' | ') : 'none'}`);
await b.close();
if (total || errs.length) process.exitCode = 1;
