import assert from 'node:assert/strict';
import { emptyProfile, encode, decode } from '../src/save.js';
import { grant, canBuy, buy, bank, runCoins, UPGRADES, UPG_IDS, UPG_MAX, MAX_DEBT, MAX_COINS, ZUKAN, ACH, ACH_IDS, CHARS, STAGES, STAGE_IDS, CHEATS, CHEAT_IDS, charOpen, stageOpen, endlessOpen, unlockSet, zukanOpen, allBought, refundAll, spentTotal, redeemCheat, findCheat, hasCheat, allUnlockedProfile, DIFF, DIFFS, recordRun } from '../src/meta.js';
import { hasAch, achAll, achAll2 } from '../src/save.js';
import { I18N } from '../src/i18n.js';
import { P2 } from '../src/text2.js';
import '../src/text3.js';
import '../src/text6.js';

// every upgrade has a price per level and 3 languages
for (const id of UPG_IDS) { assert.equal(UPGRADES[id].cost.length, UPG_MAX[id], id); for (const l of ['ja', 'zh', 'en']) assert.equal(UPGRADES[id][l].length, 2, id + l); }
assert.equal(UPG_IDS.length, 19);
assert.equal(ZUKAN.length, 70); assert.equal(ACH_IDS.length, 64); assert.equal(Object.keys(ACH).length, 64); assert.equal(STAGE_IDS.length, 19);
for (const id of ACH_IDS) for (const l of ['ja', 'zh', 'en']) assert.equal(ACH[id][l].length, 2, id + l);
for (const id of STAGE_IDS) for (const l of ['ja', 'zh', 'en']) assert.equal(STAGES[id][l].length, 2, id + l);
for (const e of ZUKAN) for (const l of ['ja', 'zh', 'en']) assert.equal(e[l].length, 3, e.id + l);

// plain buy
let p = emptyProfile(); p.coins = 100;
assert.ok(canBuy(p, 'magnet').ok); buy(p, 'magnet'); assert.equal(p.coins, 60); assert.equal(p.up.magnet, 1);
// short -> borrow
let c = canBuy(p, 'drumbeat'); assert.equal(c.reason, 'short'); assert.equal(c.need, 40);
assert.equal(buy(p, 'drumbeat', false).ok, false); assert.equal(p.up.drumbeat, 0);
const r = buy(p, 'drumbeat', true); assert.ok(r.ok); assert.equal(r.borrowed, 40); assert.equal(p.coins, 0); assert.equal(p.debt, 40); assert.equal(p.up.drumbeat, 1);
// debt limit
p.debt = MAX_DEBT - 10; assert.equal(canBuy(p, 'michi').reason, 'debtLimit'); assert.equal(buy(p, 'michi', true).ok, false);
// max level
p.up.michi = 1; assert.equal(canBuy(p, 'michi').reason, 'max');
// banking repays debt first, then clears with an achievement
p = emptyProfile(); p.debt = 50;
let b = bank(p, 30); assert.deepEqual([b.repaid, b.gained, p.debt, p.coins, b.cleared], [30, 0, 20, 0, false]);
b = bank(p, 35); assert.deepEqual([b.repaid, b.gained, p.debt, p.coins, b.cleared], [20, 15, 0, 15, true]);
assert.ok(hasAch(p, 'debtFree'));
// run coins + toys bonus
p = emptyProfile(); const s = { picked: 10, time: 300, kills: 250, won: true, bosses: 1 };
assert.equal(runCoins(s, p), 10 + 30 + 10 + 40 + 15); p.up.toys = 3; assert.equal(runCoins(s, p), Math.floor(105 * 1.3));
// debt survives the save code
p = emptyProfile(); p.coins = 123; p.debt = 77; p.up.shodo = 5; p.up.michi = 1; p.ach = (1 << 15) - 1;
const d = decode(encode(p)); assert.ok(d.ok); assert.equal(d.profile.debt, 77); assert.equal(d.profile.coins, 123); assert.equal(d.profile.up.shodo, 5); assert.equal(d.profile.ach, (1 << 15) - 1);
// unlocks: characters by achievement, stages one after another
p = emptyProfile(); assert.ok(charOpen(p, 'kyon')); assert.ok(!charOpen(p, 'odekake'));
assert.deepEqual(STAGE_IDS.map(id => stageOpen(p, id)), STAGE_IDS.map((_, i) => i === 0)); assert.ok(!endlessOpen(p));
p.st.apple = { t: 300, k: 10 }; assert.deepEqual(STAGE_IDS.map(id => stageOpen(p, id)), STAGE_IDS.map((_, i) => i < 2)); assert.ok(endlessOpen(p));
p.st.berry = { t: 299, k: 10 }; assert.ok(!stageOpen(p, 'race'), '299 s is not a clear');
for (const id of STAGE_IDS) p.st[id] = { t: 300, k: 0 }; assert.ok(STAGE_IDS.every(id => stageOpen(p, id)));
assert.ok(unlockSet(p).has('stage:night') && !unlockSet(emptyProfile()).has('stage:berry'));
// refund: everything back, debt repaid first, coins capped
p = emptyProfile(); p.up.panier = 2; p.up.michi = 1; const spent = spentTotal(p); assert.equal(spent, UPGRADES.panier.cost[0] + UPGRADES.panier.cost[1] + UPGRADES.michi.cost[0]);
p.debt = 50; p.coins = 5; let rf = refundAll(p); assert.deepEqual([rf.total, rf.repaid, p.debt, p.coins, p.up.panier, p.up.michi], [spent, 50, 0, 5 + spent - 50, 0, 0]);
p = emptyProfile(); p.coins = MAX_COINS - 10; p.up.shodo = 5; refundAll(p); assert.equal(p.coins, MAX_COINS);
// secret codes: case/width/kana insensitive, once per save, recorded in the code
assert.equal(CHEAT_IDS.length, 8); for (const id of CHEAT_IDS) assert.ok(CHEATS[id]);
for (const [w, id] of [['ICHIGO', 'ichigo'], ['ｉｃｈｉｇｏ', 'ichigo'], ['いちご', 'ichigo'], ['イチゴ', 'ichigo'], ['Azarashi', 'azarashi'], ['あざらし', 'azarashi'], ['sinsyu', 'shinshu'], ['しんしゅう', 'shinshu'], ['ハムハム', 'hamuhamu'], ['hampen', 'hanpen'], ['キョンキョン', 'kyonkyon'], ['ずかん', 'zukan'], ['オハヤウ', 'ohayau'], [' o h a y a u! ', 'ohayau']]) assert.equal(findCheat(w), id, w);
assert.equal(findCheat('kyoka'), null); assert.equal(findCheat('ichig'), null);
p = emptyProfile(); p.debt = 80;
assert.deepEqual(redeemCheat(p, ''), { ok: false, reason: 'empty' }); assert.equal(redeemCheat(p, 'nope').reason, 'unknown');
assert.ok(redeemCheat(p, 'ichigo', 100).ok); assert.equal(p.coins, 10000); assert.equal(redeemCheat(p, 'イチゴ', 100).reason, 'today'); assert.equal(p.coins, 10000);
assert.ok(redeemCheat(p, 'いちご', 101).ok); assert.equal(p.coins, 20000); assert.equal(p.iday, 101); assert.equal(redeemCheat(p, 'ichigo', 101).reason, 'today'); // once per local day
{ const q = emptyProfile(); assert.ok(redeemCheat(q, 'azarashi', 101).ok); assert.equal(redeemCheat(q, 'azarashi', 102).reason, 'used'); } // the others stay once per save
assert.ok(redeemCheat(p, 'hamuhamu').ok); assert.equal(p.debt, 0);
assert.ok(redeemCheat(p, 'kyonkyon').ok); assert.equal(p.boost, 1);
assert.ok(redeemCheat(p, 'azarashi').ok); assert.ok(charOpen(p, 'odekake') && charOpen(p, 'ranger'));
assert.ok(redeemCheat(p, 'shinshu').ok); assert.ok(STAGE_IDS.every(id => stageOpen(p, id)) && endlessOpen(p));
assert.ok(redeemCheat(p, 'zukan').ok); assert.equal(ZUKAN.filter(e => zukanOpen(p, e)).length, 70);
assert.ok(redeemCheat(p, 'hanpen').ok && redeemCheat(p, 'ohayau').ok); assert.equal(p.cheats, 255);
let dc = decode(encode(p)); assert.ok(dc.ok); assert.equal(dc.profile.cheats, 255); assert.equal(dc.profile.boost, 1); assert.equal(redeemCheat(dc.profile, 'zukan').reason, 'used');
p = emptyProfile(); p.coins = MAX_COINS - 5; redeemCheat(p, 'ichigo'); assert.equal(p.coins, MAX_COINS);
// the README all-unlock profile
const A = allUnlockedProfile(emptyProfile), Ad = decode(encode(A)).profile;
assert.equal(Ad.coins, MAX_COINS); assert.equal(Ad.ach, achAll()); assert.equal(Ad.ach2, achAll2()); assert.equal(Ad.cheats, 0);
assert.ok(UPG_IDS.every(k => Ad.up[k] === UPG_MAX[k]) && STAGE_IDS.every(id => stageOpen(Ad, id) && Ad.st[id].t >= 300) && Object.keys(CHARS).every(c => charOpen(Ad, c)) && endlessOpen(Ad));
assert.equal(ZUKAN.filter(e => zukanOpen(Ad, e)).length, 70);
// zukan: some open from the start, all open with everything
p = emptyProfile(); const open0 = ZUKAN.filter(e => zukanOpen(p, e)).length; assert.ok(open0 > 0 && open0 < 70);
for (const k of UPG_IDS) p.up[k] = 1; p.ach = achAll(); p.ach2 = achAll2(); p.clears = 1; assert.equal(ZUKAN.filter(e => zukanOpen(p, e)).length, 70); assert.ok(allBought(p));
// difficulty: 4 levels, harder = tougher foes and more coins; ふつう is harder than the old baseline
assert.deepEqual(DIFFS, ['easy', 'normal', 'hard', 'geki']);
for (let i = 1; i < 4; i++) for (const k of ['hp', 'dmg', 'spd', 'dens', 'coin']) assert.ok(DIFF[DIFFS[i]][k] > DIFF[DIFFS[i - 1]][k], k + i);
assert.ok(DIFF.normal.hp >= 1 && DIFF.normal.dmg >= 1 && DIFF.normal.dens > 1.1 && DIFF.easy.hp < 1 && DIFF.geki.late > DIFF.hard.late && !DIFF.normal.late); // ふつう sits at the base table; time scaling (and late for むずかしい・ゲキムズ) does the rest
for (const id of DIFFS) for (const l of ['ja', 'zh', 'en']) assert.equal(DIFF[id][l].length, 2);
{ const q = emptyProfile(), s2 = { picked: 10, time: 300, kills: 250, won: true, bosses: 1 }; assert.equal(runCoins({ ...s2, diff: 'geki' }, q), Math.floor(105 * 2.2)); assert.equal(runCoins({ ...s2, diff: 'easy' }, q), Math.floor(105 * 0.8)); assert.equal(runCoins(s2, q), 105); }
// per-difficulty records, and the hardest clear survives the code
{ const q = emptyProfile(); const r = q.st.snow;
  assert.ok(recordRun(r, 2, 310, 400, true)); assert.ok(!recordRun(r, 2, 200, 100, false)); recordRun(r, 0, 150, 900, false);
  assert.deepEqual([r.t, r.k, r.d, r.by[2].t, r.by[0].k, r.by[1].t], [310, 900, 3, 310, 900, 0]);
  const dd = decode(encode(q)).profile.st.snow; assert.equal(dd.d, 3); assert.ok(dd.by[2].t >= 300); }
// names match everywhere: evolution achievements use the level-up card names, every weapon has an evolution text
const WEAPONS = ['berry', 'lariat', 'beam', 'penlight', 'horse', 'seal', 'brush', 'drum', 'mic', 'apple', 'ham', 'fan', 'guitar', 'ttable', 'para', 'hlock', 'koma', 'whis', 'syr', 'chaka'];
const PASSIVES = ['pannier', 'shoes', 'ribbon', 'gobelt', 'suzuri', 'metro', 'nodoame', 'basket', 'omamori', 'gakufu', 'wasabi'];
for (const l of ['ja', 'zh', 'en']) {
  const it = Object.assign({}, I18N[l].items, P2[l].items);
  for (const w of WEAPONS) {
    const a = ACH['evo' + w[0].toUpperCase() + w.slice(1)]; assert.ok(a, w);
    assert.ok(it[w] && it['evo_' + w], l + w); assert.equal(a[l][0], it['evo_' + w][0], 'evo name ' + l + w); assert.ok(a[l][1].includes(it[w][0]), 'evo desc names the weapon ' + l + w + ': ' + a[l][1]);
  }
  for (const id of PASSIVES) assert.ok(it[id] && it[id].length === 2, l + id);
  for (const k of ['magI', 'bombI', 'cakeI']) assert.ok(P2[l].pick[k], l + k); assert.ok(!('clockI' in P2[l].pick), 'clock pickup removed');
}
// zh-TW: no Japanese kana in item names / achievement names (proper nouns like きょん aside)
// proper nouns with no official translation stay in Japanese (her names, her dog, catchphrases, local food); everything else is translated
const kana = /[\u3040-\u30ff]/, KEEP = /きょん|はんぺん|おでかけ|キョンレンジャー|みちづれ|おはやう|おやき|ギュッとハートロック|ハートロック|チャカ|ダンビラ|くみちょー|ハムナンバーカード|ハムコイン|キョウカのエモノ|エモノ|タオル|きょうみお|式/g, strip = x => x.replace(KEEP, '');
for (const [k, v] of Object.entries(Object.assign({}, I18N.zh.items, P2.zh.items))) assert.ok(!kana.test(strip(v[0])) && !kana.test(strip(v[1])), 'zh item ' + k + ' ' + v);
for (const id of ACH_IDS) assert.ok(!kana.test(strip(ACH[id].zh[0])), 'zh ach ' + id + ' ' + ACH[id].zh[0]);
assert.ok(!/半片|出門きょん|きょん戰隊|同行者|早安🦭|信州烤餅/.test(JSON.stringify([I18N.zh, P2.zh, ACH, CHARS, UPGRADES, ZUKAN])), 'proper nouns are not translated');
assert.equal(CHARS.odekake.zh[0], 'おでかけきょん'); assert.equal(CHARS.ranger.zh[0], 'キョンレンジャー'); assert.equal(UPGRADES.michi.zh[0], 'みちづれ');
assert.ok(!/・/.test(JSON.stringify(P2.zh)) && !/・/.test(JSON.stringify(I18N.zh)), 'zh uses Taiwanese punctuation, no ・');
// 花のチャペル batch: new characters keep their Japanese names, unlock rules, chapel after the night stage
assert.equal(CHARS.dress.zh[0], 'ドレスきょん'); assert.equal(CHARS.goth.zh[0], 'ゴスロリきょん');
{ const q = emptyProfile(); assert.ok(!charOpen(q, 'dress') && !charOpen(q, 'goth') && !stageOpen(q, 'chapel'));
  q.st.night = { t: 300, k: 0 }; assert.ok(stageOpen(q, 'chapel') && unlockSet(q).has('stage:chapel') && !stageOpen(q, 'china')); q.st.chapel = { t: 300, k: 0 }; assert.ok(stageOpen(q, 'china'));
  grant(q, 'clearChapel'); grant(q, 'clearHard'); assert.ok(charOpen(q, 'dress') && charOpen(q, 'goth')); }
assert.ok(ZUKAN.filter(e => /#320/.test(e.ja[2])).length >= 8 && ZUKAN.every(e => !/[\u3040-\u30ff]{2,}/.test(e.en.join(' ').replace(/きょん式ハートロック|きょんカフェ|次世代司会ユニット|熱唱タオル|漆黒のブルーサファイア|くみちょー|ハムら市|きょん|はんぺん/g, ''))), 'wedding zukan entries (proper nouns stay in Japanese)');
console.log('meta tests passed (zukan open at start: ' + open0 + '/70)');
