// Restoring a save code replaces the whole meta state (no merge = no coin farming), ichigo once per local day,
// best time consistent between the restore dialog and the title, stage cards show real endless times and hide unstored kills,
// code-entry help built from the save module. Run: node test/restore.mjs
import { chromium } from 'playwright-core';
const ROOT = decodeURI(new URL('..', import.meta.url).pathname);
const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
let n = 0, fails = 0; const errs = [];
const ok = (c, m) => { n++; if (!c) { fails++; console.log('FAIL', m); } };
for (const lang of ['zh', 'ja', 'en']) {
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  await ctx.addInitScript(l => { localStorage.setItem('kyoka-lang', l); localStorage.removeItem('kyoka-run'); }, lang);
  const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  await p.goto('file://' + ROOT + 'dist/index.html'); await p.waitForFunction(() => window.__kyoka && document.readyState === 'complete'); await p.waitForTimeout(300);
  const K = (f, a) => p.evaluate(f, a);
  const restore = async code => { await K(() => { document.getElementById('resumeask')?.classList.add('hide'); document.getElementById('codebtn').click(); }); await p.fill('#ci-input', code); await p.click('#ci-ok'); await p.waitForTimeout(250); return K(() => document.getElementById('ci-msg').textContent); };
  // 1. earlier code: 5000 coins, one shop item, road endless 13:56 (no kills stored for stage 19 in codes)
  const early = await K(() => { const k = window.__kyoka; window.__kyokaTest = true; const pr = k.emptyProfile ? k.emptyProfile() : {}; return null; });
  await K(() => { const k = window.__kyoka; k.setProfile({ coins: 5000, up: { shodo: 1 }, st: { apple: { t: 300, k: 640, d: 2 }, road: { t: 836, k: 2540 } } }); });
  const codeA = await K(() => window.__kyoka.encode(window.__kyoka.profile));
  // 2. spend the coins in the shop (base items, goods, repeatables)
  await K(() => { const k = window.__kyoka; k.openShop(); for (const id of ['michi', 'lucky', 'cafe', 'r_atk', 'r_atk', 'r_hp', 'shodo']) k.tryBuy(id); k.closeScreen(); });
  const spent = await K(() => { const p = window.__kyoka.profile; return { coins: p.coins, up: p.up }; });
  ok(spent.coins < 5000 && spent.up.r_atk >= 1 && spent.up.cafe === 1, lang + ' bought things ' + JSON.stringify(spent));
  // 3. restore the earlier code: coins AND purchases must be exactly the code's
  const msg = await restore(codeA); if (process.env.V) console.log('MSG', msg, await K(() => [window.__kyoka.screen, document.querySelector('#codein')?.className]));
  const after = await K(() => { const p = window.__kyoka.profile; return { coins: p.coins, up: p.up, road: p.st.road, apple: p.st.apple }; });
  const wantUp = await K(c => window.__kyoka.decode(c).profile.up, codeA);
  ok(after.coins === 5000, lang + ' coins back to the code ' + after.coins);
  ok(JSON.stringify(after.up) === JSON.stringify(wantUp) && after.up.shodo === 1 && after.up.r_atk === 0 && after.up.cafe === 0 && after.up.michi === 0, lang + ' purchases match the code ' + JSON.stringify(after.up));
  // farming loop: buy again, restore again -> never more than the code holds
  for (let i = 0; i < 3; i++) { await K(() => { const k = window.__kyoka; k.openShop(); k.tryBuy('r_coin'); k.tryBuy('lucky'); k.closeScreen(); }); await restore(codeA); }
  const loop = await K(() => { const p = window.__kyoka.profile; return { c: p.coins, rc: p.up.r_coin, l: p.up.lucky }; });
  ok(loop.c === 5000 && loop.rc === 0 && loop.l === 0, lang + ' no farming over repeated restores ' + JSON.stringify(loop));
  // 4. best time: dialog and title show the same (uncapped) value
  const dlgT = (msg.match(/\d+:\d\d/) || [])[0];
  await p.waitForTimeout(1900);
  const titleT = (await K(() => document.getElementById('t-rec').textContent)).match(/\d+:\d\d/)?.[0];
  ok(dlgT && dlgT === titleT && dlgT === '13:55', lang + ` best time consistent dialog ${dlgT} title ${titleT}`);
  // 5. stage cards: road shows its real endless time and no kills (not stored in codes); apple keeps kills
  const cards = await K(() => { const k = window.__kyoka; k.openSelect(); const out = {}; for (let pg = 0; pg < 4; pg++) { for (const c of document.querySelectorAll('#s-stages .scard')) out[c.dataset.id] = c.querySelector('small').textContent; const nx = document.querySelector('#select .pg[data-pk="s"][data-pi="' + (pg + 1) + '"]'); if (!nx) break; nx.click(); } k.closeScreen(); return out; });
  ok(/13:55/.test(cards.road || '') && !/\d+\s*(隻|たい|foes)/.test(cards.road || '') && !/5:00/.test(cards.road || ''), lang + ' road card ' + cards.road);
  ok(/5:00/.test(cards.apple || '') && /640/.test(cards.apple || ''), lang + ' apple card ' + cards.apple);
  // 6. code-entry help is generated from the save module
  const help = await K(() => { document.getElementById('codebtn').click(); const t = document.getElementById('ci-help')?.innerText || document.querySelector('#codein')?.innerText || ''; return t; });
  ok(/104/.test(help) && /92/.test(help) && /12/.test(help) && !/60\s*(もじ|個字|-letter)/.test(help), lang + ' help text ' + help.replace(/\n/g, ' ').slice(0, 120));
  await K(() => document.querySelector('#codein .btn.back, #ci-back')?.click());
  // 7. ichigo: once per local day, friendly message the second time; stays used after restoring today's code
  const r1 = await K(() => window.__kyoka.submitCheat('ichigo'));
  const c1 = await K(() => window.__kyoka.profile.coins);
  const r2 = await K(() => { const r = window.__kyoka.submitCheat('いちご'); return { r, m: document.getElementById('cc-msg').textContent }; });
  ok(r1.ok && c1 === 15000 && !r2.r.ok && r2.r.reason === 'today', lang + ' ichigo once today ' + JSON.stringify([r1, c1, r2]));
  ok(/今日|今天|today/i.test(r2.m), lang + ' friendly message ' + r2.m);
  const codeB = await K(() => window.__kyoka.encode(window.__kyoka.profile));
  await restore(codeA); const r3 = await K(() => window.__kyoka.submitCheat('ichigo')); // an older code (from before today's use) gets back to its own coins only
  ok(r3.ok && await K(() => window.__kyoka.profile.coins) === 15000, lang + ' older code: its own coins + today');
  await restore(codeB); const r4 = await K(() => window.__kyoka.submitCheat('ichigo'));
  ok(!r4.ok && r4.reason === 'today', lang + ' restoring today\'s code keeps the day');
  const r5 = await K(() => window.__kyoka.submitCheat('azarashi')), r6 = await K(() => window.__kyoka.submitCheat('azarashi'));
  ok(r5.ok && r6.reason === 'used', lang + ' other cheats once per save');
  await ctx.close();
}
console.log(`restore: ${n} checks, ${fails} failed, console errors: ${errs.length ? errs.join(' | ') : 'none'}`);
await b.close(); if (fails || errs.length) process.exitCode = 1;
