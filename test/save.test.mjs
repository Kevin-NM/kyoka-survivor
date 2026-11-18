// Unit tests for the password save: v8 104-char codes, plus old v7 92-char, v6 84-char, v5 60-char, v4 52-char, v3 44-char, v2 24-char and v1 12-char codes. Run: node test/save.test.mjs
import { encode, decode, normalize, merge, emptyProfile, ALPHA, UPG_IDS, UPG_MAX, ACH_IDS, CHEAT_IDS, STAGE_IDS, encodeV1, encodeV2, encodeV3, encodeV4, encodeV5, encodeV6, encodeV7, OLD_LENS, localDay, IDAY_MAX, fixProfile, achAll, achAll2, DIFFS, MAX_DEBT, MAX_COINS, CODE_LEN, hasAch, stageCleared } from '../src/save.js';
let fails = 0; const ok = (c, m) => { if (!c) { fails++; console.log('FAIL', m); } };
const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);
ok(ALPHA.length === 31 && !/[01OIL]/.test(ALPHA), 'alphabet'); ok(CODE_LEN === 104, 'length 104'); ok(OLD_LENS.join() === '92,84,60,52,44,24,12', 'old lengths');
const rnd = n => Math.floor(Math.random() * (n + 1));
// a profile whose numbers survive the code exactly (stage records on the 5 s / 20 kill grid; global bests = max of stages)
const canon = p => { p.bestTime = 0; p.bestKills = 0; for (const k of STAGE_IDS) { const r = p.st[k]; if (!r.d && r.t >= 300) r.d = 2; r.by = DIFFS.map(() => ({ t: 0, k: 0 })); if (r.d) r.by[r.d - 1] = { t: Math.max(r.t, 300), k: r.k }; else if (r.t > 0) r.by[1] = { t: r.t, k: r.k }; p.bestTime = Math.max(p.bestTime, r.t); p.bestKills = Math.max(p.bestKills, r.k); } return p; };
const randProfile = () => {
  const p = emptyProfile(); p.lang = ['ja', 'zh', 'en'][rnd(2)];
  p.bestLevel = rnd(127); p.clears = rnd(255); p.coins = rnd(MAX_COINS); p.debt = rnd(MAX_DEBT);
  for (const k of UPG_IDS) p.up[k] = rnd(UPG_MAX[k]);
  p.ach = rnd(achAll()); p.ach2 = rnd(achAll2()); p.cheats = rnd((1 << CHEAT_IDS.length) - 1); p.iday = rnd(1) ? rnd(IDAY_MAX) : 0; p.boost = rnd(1); p.diff = rnd(3);
  for (const k of STAGE_IDS) p.st[k] = { t: rnd(127) * 5, k: STAGE_IDS.indexOf(k) < 9 ? rnd(127) * 20 : 0, d: rnd(4) }; // v6 keeps only the time for the stages after the first nine
  return canon(p);
};
const full = emptyProfile(); Object.assign(full, { lang: 'en', bestLevel: 127, clears: 255, coins: MAX_COINS, debt: MAX_DEBT, ach: achAll(), ach2: achAll2(), cheats: 255, iday: IDAY_MAX, boost: 1, diff: 3 });
for (const k of UPG_IDS) full.up[k] = UPG_MAX[k]; for (const k of STAGE_IDS) full.st[k] = { t: 635, k: STAGE_IDS.indexOf(k) < 9 ? 2540 : 0, d: 4 }; canon(full);
const fixed = [emptyProfile(), full];
for (let i = 0; i < 4000; i++) fixed.push(randProfile());
const codes = new Set(), re52 = /^([2-9A-HJ-NP-Z]{4}-){25}[2-9A-HJ-NP-Z]{4}$/;
for (const p of fixed) {
  const c = encode(p); ok(re52.test(c), 'format ' + c);
  const r = decode(c); ok(r.ok && !r.old && eq(r.profile, p), 'roundtrip ' + JSON.stringify(p) + ' ' + c + ' ' + JSON.stringify(r)); codes.add(c);
}
ok(codes.size > 3990, 'codes mostly unique');
// rounding of stage records: down to the grid, but a played stage never becomes 0, and 299 s is never a clear
{ const p = emptyProfile(); p.st.zoo = { t: 299, k: 7 }; p.st.snow = { t: 3, k: 0 }; const r = decode(encode(p)).profile; ok(r.st.zoo.t === 295 && r.st.zoo.k === 20 && r.st.snow.t === 5 && !stageCleared(r, 'zoo'), 'rounding ' + JSON.stringify(r.st)); }
// diffusion: one coin changes most of the code
{ const a = emptyProfile(), b = emptyProfile(); b.coins = 1; const ca = normalize(encode(a)), cb = normalize(encode(b)); let d = 0; for (let i = 0; i < CODE_LEN; i++) if (ca[i] !== cb[i]) d++; ok(d >= 36, 'diffusion ' + d); }
// clamping
{ const r = decode(encode({ bestLevel: 999, clears: 5000, coins: 1e9, debt: 9999, up: { shodo: 99 }, st: { apple: { t: 99999, k: 99999 } } })).profile; ok(r.coins === MAX_COINS && r.debt === MAX_DEBT && r.up.shodo === 5 && r.st.apple.t === 2555 && r.st.apple.k === 2540, 'clamp ' + JSON.stringify(r)); }
// human input tolerance
const c = encode(fixed[5]);
for (const v of [c.toLowerCase(), c.replace(/-/g, ''), c.replace(/-/g, ' '), ' ' + c + ' ', c.replace(/-/g, 'ー'), c.replace(/[A-Z2-9]/g, ch => String.fromCharCode(ch.charCodeAt(0) + 0xFEE0)), c.slice(0, 20) + '\n' + c.slice(20)])
  ok(decode(v).ok, 'tolerant: ' + v);
// rejection: every single-character typo, every adjacent swap, random garbage
const raw = normalize(c);
let single = 0, singleCaught = 0;
for (let i = 0; i < CODE_LEN; i++) for (const ch of ALPHA) { if (ch === raw[i]) continue; single++; if (!decode(raw.slice(0, i) + ch + raw.slice(i + 1)).ok) singleCaught++; }
let swaps = 0, swapCaught = 0;
for (let i = 0; i < CODE_LEN - 1; i++) { if (raw[i] === raw[i + 1]) continue; swaps++; if (!decode(raw.slice(0, i) + raw[i + 1] + raw[i] + raw.slice(i + 2)).ok) swapCaught++; }
let junk = 0; for (let i = 0; i < 20000; i++) { let s = ''; for (let k = 0; k < CODE_LEN; k++) s += ALPHA[rnd(30)]; if (decode(s).ok) junk++; }
console.log(`v8: single-char typos caught ${singleCaught}/${single}, swaps caught ${swapCaught}/${swaps}, random codes accepted ${junk}/20000`);
ok(singleCaught / single > 0.99, 'single typos'); ok(swapCaught / swaps > 0.95, 'swaps'); ok(junk / 20000 < 0.002, 'random rejection');
ok(decode('').reason === 'empty', 'empty');
ok(decode('ABCD-EFGH').reason === 'length', 'short');
ok(decode('ABCD-EFGH-JKMN-PQRS').reason === 'length', '16 chars');
ok(decode('ABCD-EFGH-JKM0').reason === 'char', 'bad char 0');
// ---- old v1 codes still work ----
const old = 'DZHE-4JQM-HFSW'; // zh, 187s, 412 kills, lv17, 2 clears, boss, 2 seals
const r1 = decode(old);
ok(r1.ok && r1.old && r1.profile.lang === 'zh' && r1.profile.bestTime === 187 && r1.profile.bestKills === 412 && r1.profile.bestLevel === 17 && r1.profile.clears === 2, 'v1 decode ' + JSON.stringify(r1));
ok(hasAch(r1.profile, 'firstClear') && hasAch(r1.profile, 'crowKing') && hasAch(r1.profile, 'survive3') && !hasAch(r1.profile, 'seals3'), 'v1 achievements');
ok(stageCleared(r1.profile, 'apple') && stageCleared(r1.profile, 'race') && !stageCleared(r1.profile, 'cage') && r1.profile.st.cage.t > 0, 'v1 -> stage records');
ok(decode(old.toLowerCase().replace(/-/g, ' ')).ok, 'v1 tolerant');
for (let i = 0; i < 1500; i++) {
  const v = { lang: ['ja', 'zh', 'en'][rnd(2)], bestTime: rnd(300), bestKills: rnd(2047), bestLevel: rnd(63), clears: rnd(63), boss: rnd(1), seen: rnd(1023), maxSeals: rnd(3) };
  const code = encodeV1(v), d = decode(code);
  ok(/^[2-9A-Z]{4}-[2-9A-Z]{4}-[2-9A-Z]{4}$/.test(code) && d.ok && d.old && d.profile.bestKills === v.bestKills && d.profile.clears === v.clears && hasAch(d.profile, 'seals3') === (v.maxSeals >= 3), 'v1 roundtrip ' + JSON.stringify(v));
  const n = encode(d.profile), d2 = decode(n); ok(d2.ok && !d2.old && d2.profile.clears === d.profile.clears && d2.profile.ach === d.profile.ach && d2.profile.st.apple.t === Math.floor(d.profile.st.apple.t / 5) * 5 || d.profile.st.apple.t < 5, 'v1->v4 ' + code + ' ' + n);
}
// ---- old v2 (24-char) codes still work ----
{
  const p = emptyProfile(); Object.assign(p, { lang: 'en', bestTime: 260, bestKills: 900, bestLevel: 22, clears: 3, coins: 1234, debt: 40, ach: (1 << 15) - 1 }); p.up.shodo = 4; p.up.michi = 1;
  const v2 = encodeV2(p); ok(/^([2-9A-HJ-NP-Z]{4}-){5}[2-9A-HJ-NP-Z]{4}$/.test(v2), 'v2 format ' + v2);
  const d = decode(v2); ok(d.ok && d.old && d.profile.coins === 1234 && d.profile.debt === 40 && d.profile.up.shodo === 4 && d.profile.up.michi === 1 && d.profile.ach === (1 << 15) - 1 && d.profile.bestKills === 900, 'v2 decode ' + JSON.stringify(d));
  ok(stageCleared(d.profile, 'apple') && stageCleared(d.profile, 'berry') && stageCleared(d.profile, 'race') && stageCleared(d.profile, 'cage') && !stageCleared(d.profile, 'zoo'), 'v2 -> stage records');
  const n = decode(encode(d.profile)); ok(n.ok && n.profile.coins === 1234 && n.profile.ach === d.profile.ach && n.profile.up.shodo === 4, 'v2 -> v4');
  let caught = 0, tot = 0; const rw = normalize(v2); for (let i = 0; i < 24; i++) for (const ch of ALPHA) { if (ch === rw[i]) continue; tot++; if (!decode(rw.slice(0, i) + ch + rw.slice(i + 1)).ok) caught++; }
  ok(caught === tot, 'v2 typos ' + caught + '/' + tot);
  for (let i = 0; i < 1000; i++) { const q = emptyProfile(); Object.assign(q, { bestTime: rnd(2047), bestKills: rnd(4095), bestLevel: rnd(127), clears: rnd(127), coins: rnd(16383), debt: rnd(MAX_DEBT), ach: rnd((1 << 15) - 1) }); const dd = decode(encodeV2(q)); ok(dd.ok && dd.profile.coins === q.coins && dd.profile.ach === q.ach && dd.profile.clears === q.clears, 'v2 random'); }
}
// ---- old v3 (44-char) codes still work: records count as ふつう, achievements kept ----
{
  const p = emptyProfile(); Object.assign(p, { lang: 'zh', bestLevel: 30, clears: 4, coins: 5000, debt: 0, ach: 2 ** 28 - 1, cheats: 5 }); p.up.lucky = 2; p.st.apple = { t: 300, k: 400 }; p.st.zoo = { t: 120, k: 60 };
  const v3 = encodeV3(p); ok(/^([2-9A-HJ-NP-Z]{4}-){10}[2-9A-HJ-NP-Z]{4}$/.test(v3), 'v3 format ' + v3);
  const d = decode(v3); ok(d.ok && d.old && d.profile.coins === 5000 && d.profile.ach === 2 ** 28 - 1 && d.profile.cheats === 5 && d.profile.up.lucky === 2, 'v3 decode ' + JSON.stringify(d));
  ok(d.profile.st.apple.d === 2 && d.profile.st.apple.by[1].t === 300 && d.profile.st.zoo.d === 0 && d.profile.st.zoo.by[1].t === 120 && stageCleared(d.profile, 'apple'), 'v3 -> per-difficulty records ' + JSON.stringify(d.profile.st));
  const n = decode(encode(d.profile)); ok(n.ok && !n.old && n.profile.ach === d.profile.ach && n.profile.st.apple.d === 2, 'v3 -> v4');
  let caught = 0, tot = 0; const rw = normalize(v3); for (let i = 0; i < 44; i++) for (const ch of ALPHA) { if (ch === rw[i]) continue; tot++; if (!decode(rw.slice(0, i) + ch + rw.slice(i + 1)).ok) caught++; }
  ok(caught / tot > 0.99, 'v3 typos ' + caught + '/' + tot);
}
// ---- achievements wider than 32 bits ----
{ const p = emptyProfile(); p.ach = achAll(); p.ach2 = achAll2(); const d = decode(encode(p)).profile; ok(ACH_IDS.length > 52 && hasAch(p, ACH_IDS[ACH_IDS.length - 1]) && d.ach === p.ach && d.ach2 === p.ach2 && hasAch(d, ACH_IDS[ACH_IDS.length - 1]), 'ach > 52 bits (ach2)'); const q = emptyProfile(); q.ach = 2 ** 35; ok(hasAch(q, ACH_IDS[35]) && !hasAch(q, ACH_IDS[3]), 'ach bit 35'); }
// ---- fixProfile upgrades old local saves (no d / by) ----
{ const f = fixProfile({ st: { berry: { t: 310, k: 50 }, snow: { t: 100, k: 9 } } }); ok(f.st.berry.d === 2 && f.st.berry.by[1].t === 310 && f.st.snow.d === 0 && f.st.snow.by[1].k === 9 && f.diff === 1, 'fixProfile old local ' + JSON.stringify(f.st)); }
// ---- merge keeps the best ----
{
  const a = emptyProfile(), b = emptyProfile();
  Object.assign(a, { bestTime: 200, bestKills: 10, bestLevel: 5, clears: 1, coins: 50, debt: 0, ach: 3, cheats: 1, lang: 'ja' }); a.up.shodo = 3; a.st.zoo = { t: 120, k: 40 };
  Object.assign(b, { bestTime: 100, bestKills: 50, bestLevel: 9, clears: 0, coins: 300, debt: 100, ach: 4, cheats: 4, lang: 'en' }); b.up.michi = 1; b.st.zoo = { t: 80, k: 90 };
  const m = merge(a, b);
  ok(m.bestTime === 200 && m.bestKills === 50 && m.ach === 7 && m.cheats === 5 && m.up.shodo === 3 && m.up.michi === 1 && m.coins === 300 && m.debt === 100 && m.lang === 'en' && m.st.zoo.t === 120 && m.st.zoo.k === 90 && m.st.zoo.by[1].k === 90, 'merge ' + JSON.stringify(m));
}
console.log('examples:', encode(emptyProfile()), '|', encode(r1.profile));
// v4 (52 chars, 7 stages, 37 achievements) codes from before the 花のチャペル update must keep working
{
  const r = decode('2RKM-ZBUS-2WAC-WYDY-JPBC-ZS8T-9PWJ-PH4N-4PET-8ZH7-9893-AFY5-JQ3D');
  ok(r.ok && r.old && r.profile.coins === MAX_COINS && r.profile.st.night.d === 4 && r.profile.st.chapel.t === 0 && hasAch(r.profile, 'allStages') && !hasAch(r.profile, 'clearChapel'), 'old README v4 code');
  let bad = 0;
  for (let i = 0; i < 1500; i++) {
    const p = randProfile(); p.iday = 0; for (const k of UPG_IDS.slice(10)) p.up[k] = 0; for (const k of STAGE_IDS.slice(7)) p.st[k] = { t: 0, k: 0, d: 0 }; p.ach = p.ach % 2 ** 37; p.ach2 = 0; canon(p);
    const c = encodeV4(p), d = decode(c);
    if (!(c.replace(/-/g, '').length === 52 && d.ok && d.old && JSON.stringify(canon(d.profile)) === JSON.stringify(p))) bad++;
  }
  ok(bad === 0, 'v4 round trips ' + bad);
}
// v5 (60 chars, 9 stages) codes from before the phase 6 update must keep working
{
  const r = decode('77C5-TQAS-J6Z9-UKUT-MDBH-MJHW-X8ED-49PW-23DA-69H4-QRYX-AHPY-CU2S-KEZ7-4UUW');
  ok(r.ok && r.old && r.profile.coins === MAX_COINS && r.profile.st.china.d === 4 && r.profile.st.halloween.t === 0 && hasAch(r.profile, 'allStages') && !hasAch(r.profile, 'clearHalloween'), 'old README v5 code');
  let bad = 0;
  for (let i = 0; i < 1500; i++) {
    const p = randProfile(); p.iday = 0; for (const k of UPG_IDS.slice(10)) p.up[k] = 0; for (const k of STAGE_IDS.slice(9)) p.st[k] = { t: 0, k: 0, d: 0 }; p.ach2 = 0; canon(p);
    const c = encodeV5(p), d = decode(c);
    if (!(c.replace(/-/g, '').length === 60 && d.ok && d.old && JSON.stringify(canon(d.profile)) === JSON.stringify(p))) bad++;
  }
  ok(bad === 0, 'v5 round trips ' + bad);
}
// v6 (84 chars, 19 stages, before the shop update) codes must keep working, including the old all-unlock code
{
  const r = decode('PAQP-S5W2-BU7X-9H2J-PS4V-KC3R-DQRQ-MECM-K29D-DME6-8EGS-XGY8-NH4D-R3BA-BWQZ-ADV6-5PXZ-9HNN-WFZN-KYZ5-TVX7');
  ok(r.ok && r.old && r.profile.st.road.d > 0 && r.profile.up.r_atk === 0, 'old README v6 all-unlock code');
  let bad = 0;
  for (let i = 0; i < 1500; i++) {
    const p = randProfile(); p.iday = 0; for (const k of UPG_IDS.slice(10)) p.up[k] = 0; canon(p);
    const c = encodeV6(p), d = decode(c);
    if (!(c.replace(/-/g, '').length === 84 && d.ok && d.old && JSON.stringify(canon(d.profile)) === JSON.stringify(p))) bad++;
  }
  ok(bad === 0, 'v6 round trips ' + bad);
}
// v7 (92 chars, before the ichigo day / long stage times) codes must keep working, including the v7 all-unlock code
{
  const r = decode('YZY5-QZX8-S33G-HFXS-CPK5-X2TU-KJE2-5GBD-9WSR-JD43-ZY2S-B7J3-N874-GSEQ-QFKZ-5JHJ-F7WE-TNC2-VVN5-Z289-ZCCC-2SHU-VFG9');
  ok(r.ok && r.old && r.profile.st.road.d > 0 && r.profile.up.r_atk === UPG_MAX.r_atk && r.profile.iday === 0, 'old README v7 all-unlock code');
  let bad = 0;
  for (let i = 0; i < 1500; i++) {
    const p = randProfile(); p.iday = 0; canon(p);
    const c = encodeV7(p), d = decode(c);
    if (!(c.replace(/-/g, '').length === 92 && d.ok && d.old && JSON.stringify(canon(d.profile)) === JSON.stringify(p))) bad++;
  }
  ok(bad === 0, 'v7 round trips ' + bad);
}
// v8 keeps long (endless) stage times and the ichigo day
{ const p = emptyProfile(); p.st.road = { t: 836, k: 0 }; p.st.apple = { t: 1500, k: 2540, d: 4 }; p.iday = localDay(new Date(2026, 10, 18)); const d = decode(encode(p)).profile;
  ok(d.st.road.t === 835 && d.st.apple.t === 1500 && d.bestTime === 1500 && d.iday === p.iday && p.iday === 322, 'v8 long times + iday ' + JSON.stringify([d.st.road, d.iday])); }
ok(localDay(new Date(2026, 0, 1)) === 1 && localDay(new Date(2026, 0, 1, 23, 59)) === 1 && localDay(new Date(2026, 0, 2, 0, 1)) === 2 && localDay(new Date(2027, 0, 1)) === 366, 'local calendar day');
// every stage record lands on its own stage (no off-by-one between the old and the new stages), in every format that has it
{
  const p = emptyProfile(); STAGE_IDS.forEach((k, i) => { p.st[k] = { t: (i + 1) * 5, k: i < 9 ? (i + 1) * 20 : 0, d: 0 }; }); canon(p);
  for (const [name, enc, n] of [['v8', encode, 19], ['v7', encodeV7, 19], ['v6', encodeV6, 19], ['v5', encodeV5, 9], ['v4', encodeV4, 7]]) {
    const d = decode(enc(p)).profile; let bad = [];
    STAGE_IDS.forEach((k, i) => { const wantT = i < n ? (i + 1) * 5 : 0, wantK = i < Math.min(n, 9) ? (i + 1) * 20 : 0; if (d.st[k].t !== wantT || d.st[k].k !== wantK) bad.push(k + ':' + d.st[k].t + '/' + d.st[k].k); });
    ok(!bad.length, name + ' stage index mapping ' + bad.join(' '));
  }
}
// older formats carry no shop goods / repeatable upgrades / ichigo day: restoring one means zero of those (never the current ones)
{
  const p = emptyProfile(); p.coins = 777; p.up.shodo = 2;
  for (const [name, c] of [['v2', encodeV2(p)], ['v3', encodeV3(p)], ['v4', encodeV4(p)], ['v5', encodeV5(p)], ['v6', encodeV6(p)], ['v7', encodeV7(p)]]) {
    const d = decode(c).profile, extra = UPG_IDS.slice(10).filter(k => d.up[k] !== 0);
    ok(d.coins === 777 && d.up.shodo === 2 && (name === 'v7' || !extra.length) && d.iday === 0, name + ' missing fields are zero ' + extra.join());
  }
}
console.log(fails ? fails + ' FAILED' : 'all save tests passed'); process.exit(fails ? 1 : 0);
