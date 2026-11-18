const ROOT = decodeURI(new URL('..', import.meta.url).pathname); // repo root, wherever it is checked out
// Balance sim: full 5-minute auto-play runs (random level-up picks, empty shop).
//   node test/sim.mjs                 8 runs on ふつう across the stages
//   node test/sim.mjs apple,night     chosen stages on ふつう
//   node test/sim.mjs diff [n]        n runs (default 7, one per stage in order) on each difficulty, with win-rate checks
//   node test/sim.mjs diff [n] max    the same with every shop upgrade bought
//   node test/sim.mjs geki [n] force=<weapon>   ゲキムズ only, with <weapon> maxed and evolved from the start
//   add  smart  for a careful-player bot (circles the crowd, dodges, builds evolutions), kite for its movement with random picks,
//   and  up=domino:3,michi:1  to try single shop lines. Prints win rate, average survival and average minimum HP per difficulty.
import { chromium } from 'playwright-core';
const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 960, height: 540 } });
const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
await p.goto('file://' + ROOT + 'dist/index.html'); await p.waitForTimeout(1000);
const maxShop = process.argv.includes('max');
const upArg = (process.argv.find(a => a.startsWith('up=')) || '').slice(3); // e.g. up=domino:3,michi:1 (one shop line at a time) // a strong player: every shop upgrade bought
await p.evaluate(m => window.__kyoka.setProfile(m ? { cheats: 4, up: { panier: 3, shodo: 5, drumbeat: 2, magnet: 2, toys: 3, domino: 3, ohayo: 2, michi: 1, hanpen: 3, lucky: 2 } } : { cheats: 4 }), maxShop); // every stage open
if (upArg) await p.evaluate(u => window.__kyoka.setProfile({ cheats: 4, up: u }), Object.fromEntries(upArg.split(',').map(kv => [kv.split(':')[0], +kv.split(':')[1]])));
const OLD = ['apple', 'berry', 'race', 'cage', 'zoo', 'snow', 'night', 'chapel', 'china'], NEW = ['halloween', 'runway', 'ring', 'dawn', 'cherry', 'station', 'clinic', 'okinawa', 'hq'];
const set = (process.argv.find(a => a.startsWith('set=')) || 'set=old').slice(4); // set=new: the nine phase-6 stages, set=all: all 18, set=road: the encore loop (5:00 counts as a clear)
const ALL = set === 'new' ? NEW : set === 'all' ? OLD.concat(NEW) : set === 'road' ? ['road'] : OLD;
const diffMode = process.argv[2] === 'diff', gekiMode = process.argv[2] === 'geki';
const smart = process.argv.includes('smart'); // careful-human bot: strafes, dodges, and picks to build evolutions
const kite = smart || process.argv.includes('kite'); // the same careful movement, but random level-up picks
const force = (process.argv.find(a => a.startsWith('force=')) || '').slice(6);
const N = diffMode || gekiMode ? +(process.argv.find(a => /^\d+$/.test(a)) || 7) : 0;
const plan = gekiMode ? Array.from({ length: N }, (_, i) => [ALL[i % ALL.length], 'geki']) : diffMode ? ['easy', 'normal', 'hard', 'geki'].flatMap(d => Array.from({ length: N }, (_, i) => [ALL[i % ALL.length], d]))
  : (process.argv[2] ? process.argv[2].split(',') : [...ALL, 'apple']).map(s => [s, 'normal']);
const res = [];
for (let run = 0; run < plan.length; run++) {
  const [stage, diff] = plan[run];
  await p.evaluate(([s, d, f, kt]) => { const k = window.__kyoka; k.setDiff(d); k.select('kyon', s); k.start(); window.__kyokaTest = true; k.setAuto(kt ? 'smart' : true); if (f) { k.maxWeapon(f); k.applyEvo(f); } }, [stage, diff, force, kite]);
  const r = await p.evaluate(sm => { const k = window.__kyoka; let minHp = 1e9, guard = 0, maxE = 0; const log = [];
    while ((k.state === 'play' || k.state === 'levelup' || k.state === 'chest') && guard++ < 300 * 30 + 100 && !(k.G.road && k.G.t >= 300)) {
      if (k.state === 'levelup') {
        let i = Math.floor(Math.random() * 3);
        if (sm) { const o = k.offers, W = k.WEAPONS, nW = W.filter(w => k.lvOf(w)).length;
          const score = id => id.startsWith('evo:') ? 100 : W.includes(id) ? (k.lvOf(id) ? 50 + k.lvOf(id) : nW < 4 ? 40 : 5) : id === 'oyaki' ? 0 : k.lvOf(id) ? 30 : 20;
          i = o.reduce((b, id, j) => score(id) > score(o[b]) ? j : b, 0); }
        k.pick(i); continue; }
      if (k.state === 'chest') { k.closeChest(); continue; }
      k.step(1 / 30); minHp = Math.min(minHp, k.G.p.hp); maxE = Math.max(maxE, k.G.enemies.length); if (guard % 900 === 0) log.push(Math.round(k.G.p.hp));
    }
    return { diff: k.G.diff, stage: k.G.sid, state: k.G.road && k.G.t >= 300 && k.G.p.hp > 0 ? 'win' : k.state, t: +k.G.t.toFixed(0), lvl: k.G.lvl, kills: k.G.kills, minHp: Math.round(minHp), maxE, evo: Object.keys(k.G.evo).length, log: log.join(',') }; }, smart);
  res.push(r); console.log(run, JSON.stringify(r));
  await p.evaluate(() => { const k = window.__kyoka; if (k.G && k.G.road && k.state === 'play') k.end(false); document.querySelector('#titlebtn').click(); });
}
const by = {};
for (const r of res) { const o = by[r.diff] || (by[r.diff] = { n: 0, w: 0, t: 0, h: 0 }); o.n++; if (r.state === 'win') o.w++; o.t += r.t; o.h += Math.max(0, r.minHp); }
for (const [d, o] of Object.entries(by)) console.log(`${d}${maxShop ? ' (shop maxed)' : ''}${force ? ' force=' + force : ''}${smart ? ' smart' : kite ? ' kite' : ''}${upArg ? ' up=' + upArg : ''}: wins ${o.w}/${o.n} (${Math.round(o.w / o.n * 100)}%), avg survive ${Math.round(o.t / o.n)} s, avg min HP ${Math.round(o.h / o.n)}`);
console.log('errors', errs.length ? errs : 'none');
if (diffMode && !maxShop && !kite && !upArg) {
  const rate = d => by[d].w / by[d].n, surv = d => by[d].t / by[d].n;
  const checks = [[rate('easy') >= 0.7, 'やさしい mostly winnable'], [rate('normal') >= 0.3 && rate('normal') <= 0.7, 'ふつう about half'], [rate('hard') >= 0.1 && rate('hard') <= 0.4, 'むずかしい about 20–30%'], [rate('geki') <= 0.15, 'ゲキムズ under ~10%'], [surv('easy') >= surv('normal') && surv('normal') >= surv('hard') && surv('hard') >= surv('geki'), 'survival time drops with difficulty'], [!errs.length, 'no console errors']];
  for (const [c, m] of checks) console.log(c ? 'ok -' : 'FAIL -', m);
  if (checks.some(c => !c[0])) process.exitCode = 1;
}
await b.close();
