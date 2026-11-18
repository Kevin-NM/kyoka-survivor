import './mkshots.mjs';
import { chromium } from 'playwright-core';
const ROOT = decodeURI(new URL('..', import.meta.url).pathname); // repo root, wherever it is checked out
const diffGo = async (pg, d = 'normal', tap = false) => { await pg.waitForTimeout(150); if (await pg.evaluate(() => !document.getElementById('diff').classList.contains('hide'))) { const s = '#df-list .dbtn[data-d="' + d + '"]'; if (tap) await pg.tap(s); else await pg.click(s); await pg.waitForTimeout(400); } };
const out = ROOT + 'shots/';
const errs = [];
const b = await chromium.launch({
  executablePath: '/usr/bin/google-chrome',
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required']
});
async function makePage(vp) {
  const ctx = await b.newContext({ viewport: vp, deviceScaleFactor: 1 });
  await ctx.addInitScript(() => { ['kyoka-save-v1', 'kyoka-save-v2', 'kyoka-save-v3', 'kyoka-sel', 'kyoka-lang'].forEach(k => localStorage.removeItem(k)); });
  const p = await ctx.newPage();
  p.on('pageerror', e => { errs.push('pageerror ' + e.message); console.log('pageerror', e.message); });
  p.on('console', m => { if (m.type() === 'error') { errs.push('console ' + m.text()); console.log('console', m.text()); } });
  await p.goto('file://' + ROOT + 'dist/index.html');
  await p.waitForTimeout(1200);
  return p;
}

const p = await makePage({ width: 1100, height: 800 });
const ready = await p.evaluate(() => !!window.__kyoka);
if (!ready) throw new Error('__kyoka missing');

// Title with new buttons
await p.screenshot({ path: out + '17-title-savebtns.png' });

// Guide: simple tab
await p.click('#guidebtn');
await p.waitForTimeout(500);
const gEasy = await p.evaluate(() => !document.getElementById('g-easy').classList.contains('hide') && document.getElementById('guide') && !document.getElementById('guide').classList.contains('hide'));
if (!gEasy) throw new Error('guide simple tab not visible');
await p.screenshot({ path: out + '17-guide-simple.png' });

// Guide: detailed tab
await p.click('#g-tab-more');
await p.waitForTimeout(400);
const gMore = await p.evaluate(() => !document.getElementById('g-more').classList.contains('hide'));
if (!gMore) throw new Error('guide detailed tab not visible');
await p.screenshot({ path: out + '18-guide-detailed.png' });
await p.click('#g-close');
await p.waitForTimeout(300);

// Title code input, then invalid rejection
await p.click('#codebtn');
await p.waitForTimeout(400);
await p.screenshot({ path: out + '20-title-codein.png' });
await p.fill('#ci-input', 'AAAA-BBBB-CCCC');
await p.click('#ci-ok');
await p.waitForTimeout(300);
const bad = await p.evaluate(() => ({ msg: document.getElementById('ci-msg').textContent, cls: document.getElementById('ci-msg').className }));
console.log('invalid code message:', JSON.stringify(bad));
if (!bad.cls.includes('bad') || !bad.msg) throw new Error('expected gentle invalid message, got ' + JSON.stringify(bad));
await p.screenshot({ path: out + '20b-codein-invalid.png' });

// Valid restore of a known sample profile (from unit tests: zh, 187s, 412 kills, lv17, 2 clears)
const sample = 'DZHE-4JQM-HFSW';
const restored = await p.evaluate((code) => {
  const el = document.getElementById('ci-input');
  el.value = code;
  el.dispatchEvent(new Event('input', { bubbles: true }));
  const r = window.__kyoka.decode(el.value);
  document.querySelector('#ci-ok').click();
  return { r, input: el.value, profile: { ...window.__kyoka.profile }, rec: document.getElementById('t-rec').textContent };
}, sample);
console.log('restore', JSON.stringify(restored));
if (!restored.r.ok) throw new Error('sample code failed to decode');
if (restored.profile.bestKills !== 412 || restored.profile.clears !== 2) throw new Error('profile not restored');
await p.waitForTimeout(400);
await p.screenshot({ path: out + '20c-codein-ok.png' });
await p.waitForTimeout(1600); // auto-close
const closed = await p.evaluate(() => document.getElementById('codein').classList.contains('hide'));
if (!closed) throw new Error('code modal did not auto-close');

// Victory / result screen with code
await p.click('#startbtn'); await diffGo(p);
await p.waitForTimeout(400);
// the restored profile has a clear, so the (big-button) select screen appears first
if (await p.evaluate(() => !document.getElementById('select').classList.contains('hide'))) { await p.click('#s-go'); await p.waitForTimeout(400); await diffGo(p); }
await p.evaluate(() => {
  const k = window.__kyoka;
  window.__kyokaTest = true;
  k.setAuto(true);
  k.skipTo(30);
  ['seal', 'lariat', 'penlight'].forEach(x => { try { k.give(x); } catch (e) {} });
  k.G.kills = 128;
  k.G.p.hp = k.G.p.maxHp;
  k.skipTo(299.2);
});
for (let i = 0; i < 20; i++) {
  const st = await p.evaluate(() => {
    const k = window.__kyoka;
    if (k.state === 'levelup') k.pick(0);
    if (k.G) k.G.p.hp = k.G.p.maxHp;
    return k.state;
  });
  if (st === 'win' || st === 'over') break;
  await p.waitForTimeout(200);
}
await p.waitForTimeout(700);
const end = await p.evaluate(() => {
  const box = document.getElementById('e-code');
  return {
    state: window.__kyoka.state,
    hidden: document.getElementById('end').classList.contains('hide'),
    code: box.querySelector('.code').textContent,
    copy: box.querySelector('.copy').textContent,
    shot: box.querySelector('.ch').innerText,
    label: box.querySelector('.cl').textContent
  };
});
console.log('end screen', JSON.stringify(end));
if (end.hidden || !end.code || !/^[2-9A-HJ-NP-Z]{4}(-[2-9A-HJ-NP-Z]{4}){25}$/.test(end.code)) {
  throw new Error('result code missing or bad format: ' + JSON.stringify(end));
}
await p.screenshot({ path: out + '19-result-code.png' });

// Copy button feedback
await p.click('#e-code .copy');
await p.waitForTimeout(300);
const copied = await p.evaluate(() => document.querySelector('#e-code .cmsg').textContent);
console.log('copy feedback:', copied);
await p.screenshot({ path: out + '19b-result-copied.png' });

// Pause screen with code (new run)
await p.click('#retrybtn');
await p.waitForTimeout(400);
await p.evaluate(() => window.__kyoka.pause());
await p.waitForTimeout(400);
const pause = await p.evaluate(() => {
  const box = document.getElementById('p-code');
  return { hidden: document.getElementById('pause').classList.contains('hide'), code: box.querySelector('.code').textContent, copy: box.querySelector('.copy').textContent };
});
console.log('pause', JSON.stringify(pause));
if (pause.hidden || !pause.code) throw new Error('pause code missing');
await p.screenshot({ path: out + '21-pause-code.png' });

// Also a 960x540 result to match older screenshots / short screens
const q = await makePage({ width: 960, height: 540 });
await q.evaluate(() => { document.querySelector('.langs button[data-l="ja"]').click(); });
await q.click('#startbtn'); await diffGo(q);
await q.waitForTimeout(300);
await q.evaluate(() => {
  const k = window.__kyoka; window.__kyokaTest = true; k.setAuto(true);
  k.G.kills = 80; k.G.p.hp = k.G.p.maxHp; k.skipTo(299.2);
});
for (let i = 0; i < 20; i++) {
  const st = await q.evaluate(() => { const k = window.__kyoka; if (k.state === 'levelup') k.pick(0); if (k.G) k.G.p.hp = k.G.p.maxHp; return k.state; });
  if (st === 'win' || st === 'over') break;
  await q.waitForTimeout(200);
}
await q.waitForTimeout(600);
await q.screenshot({ path: out + '19c-result-540.png' });

// Phone title + guide
const phone = await makePage({ width: 390, height: 844 });
await phone.screenshot({ path: out + '22-phone-title.png' });
await phone.click('#guidebtn');
await phone.waitForTimeout(400);
await phone.screenshot({ path: out + '22b-phone-guide.png' });
await phone.click('#g-close');
await phone.waitForTimeout(200);
await phone.click('#codebtn');
await phone.waitForTimeout(400);
await phone.screenshot({ path: out + '22c-phone-codein.png' });

console.log('errors', errs.length ? errs : 'none');
if (errs.length) { await b.close(); process.exit(1); }
await b.close();
console.log('save-ui tests passed');
