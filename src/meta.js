// Meta progression: いちごコイン shop (with optional debt), achievements, きょん図鑑, characters, stages.
// Pure data + logic (no DOM), so it can be unit-tested in node.
import { UPG_IDS, UPG_MAX, ACH_IDS, STAGE_IDS, CHEAT_IDS, DIFFS, MAX_DEBT, MAX_COINS, CLEAR_T, hasAch, hasCheat, stageCleared, achOr, achAll, achAll2, setAch, localDay } from './save.js';
import { STAGES6, CHARS6, ACH6, ZUKAN6, UNLOCK_BY6 } from './meta6.js';
export { UPG_IDS, UPG_MAX, ACH_IDS, STAGE_IDS, CHEAT_IDS, DIFFS, MAX_DEBT, MAX_COINS, CLEAR_T, hasAch, hasCheat, stageCleared };

// ---------- difficulty ----------
// multipliers on enemy HP, contact/bullet damage, speed, spawn density, and the いちごコイン reward. elite = chance a foe spawns as a big「つよい」one.
export const DIFF = {
  easy: { hp: 0.75, dmg: 0.6, spd: 0.92, dens: 0.8, coin: 0.8, elite: 0, icon: '🌱', ja: ['やさしい', 'はじめての人に'], zh: ['簡單', '第一次玩的人'], en: ['Easy', 'For first-timers'] },
  normal: { hp: 1.1, dmg: 1.0, spd: 1.06, dens: 1.2, coin: 1, elite: 0.012, icon: '🍓', ja: ['ふつう', 'ちょうどいい てごたえ'], zh: ['普通', '剛剛好的挑戰'], en: ['Normal', 'A fair challenge'] },
  hard: { hp: 1.4, dmg: 1.3, late: 0.15, spd: 1.14, dens: 1.45, coin: 1.5, elite: 0.03, icon: '🔥', ja: ['むずかしい', '敵が かたくて はやい'], zh: ['困難', '敵人又硬又快'], en: ['Hard', 'Tougher, faster foes'] },
  geki: { hp: 3.8, dmg: 2.8, late: 2.2, spd: 1.24, dens: 1.9, coin: 2.2, elite: 0.055, icon: '⚡', ja: ['ゲキムズ', 'さいきょうの きょんへの ちょうせん'], zh: ['超級難', '挑戰最強的きょん'], en: ['Insane', 'Only for the bravest'] }
};
// record one run on a stage (per difficulty). Mutates the stage record r. Returns true if it is a new best for that difficulty.
export function recordRun(r, di, t, kills, won) {
  const b = r.by[di], nb = Math.floor(t) > b.t || kills > b.k;
  b.t = Math.max(b.t, Math.floor(t)); b.k = Math.max(b.k, kills);
  r.t = Math.max(r.t, Math.min(635, Math.floor(t))); r.k = Math.max(r.k, Math.min(2540, kills)); // what fits in a save code; by[] keeps the exact endless times
  if (won || b.t >= CLEAR_T) r.d = Math.max(r.d, di + 1);
  return nb;
}

// ---------- shop ----------
// escalating price for stacking upgrades: level L costs base × (1 + 0.25L + 0.015L²), rounded to 5
const repCost = (base, n) => Array.from({ length: n }, (_, L) => Math.round(base * (1 + 0.25 * L + 0.015 * L * L) / 5) * 5);
export const UPGRADES = {
  panier: { icon: 'dress', cost: [60, 120, 200], ja: ['ぎゅっとパニエ', 'さいだいHP +10%'], zh: ['蓬蓬裙撐', '最大 HP +10%'], en: ['Snug Petticoat', 'Max HP +10%'] },
  shodo: { icon: 'brush', cost: [50, 90, 140, 200, 280], ja: ['書道四段', 'こうげき力 +3%'], zh: ['書道四段', '攻擊力 +3%'], en: ['Calligraphy 4th Dan', 'Damage +3%'] },
  drumbeat: { icon: 'drum', cost: [100, 200], ja: ['ドラムの鼓動', 'こうげきの まちじかん -4%'], zh: ['鼓聲節奏', '攻擊冷卻 -4%'], en: ['Drum Beat', 'Cooldowns -4%'] },
  magnet: { icon: 'bow', cost: [40, 90], ja: ['リボン磁石', '♪を すいよせる はんい +15%'], zh: ['蝴蝶結磁鐵', '吸取♪範圍 +15%'], en: ['Ribbon Magnet', 'Pickup range +15%'] },
  toys: { icon: 'toy', cost: [80, 150, 250], ja: ['ヴィンテージおもちゃ', 'もらえる いちごコイン +10%'], zh: ['復古玩具', '獲得草莓幣 +10%'], en: ['Vintage Toys', 'Strawberry Coins +10%'] },
  domino: { icon: 'domino', cost: [90, 160, 260], ja: ['ドミノ倒し', 'たおした敵が たまに ばくはつ'], zh: ['骨牌連鎖', '打倒的敵人有時會爆炸'], en: ['Domino Topple', 'Defeated foes sometimes explode'] },
  ohayo: { icon: 'seal0', cost: [120, 240], ja: ['おはやう🦭', 'さいしょから あざらしが いっしょ'], zh: ['おはやう🦭', '一開始就有海豹同行'], en: ['Ohayau 🦭', 'Start with seal buddies'] },
  michi: { icon: 'michi', cost: [300], ja: ['みちづれ', 'いちどだけ ふっかつ！'], zh: ['みちづれ', '可以復活一次！'], en: ['Michizure', 'Revive once!'] },
  hanpen: { icon: 'hp0', cost: [70, 140, 220], ja: ['はんぺんの おやつ', 'はんぺんが つよく はやくなる'], zh: ['はんぺん的點心', 'はんぺん變得更強更快'], en: ['Hanpen Treats', 'Hanpen bites harder and faster'] },
  lucky: { icon: 'clover', cost: [110, 230], ja: ['よつばの クローバー', 'べんりアイテムと たからばこが でやすい'], zh: ['四葉幸運草', '道具和寶箱更容易出現'], en: ['Four-leaf Clover', 'More handy items and treasure'] },
  // きょん goods (a few levels each)
  cafe: { icon: 'cakeI', cat: 'goods', cost: [150, 300, 500], ja: ['きょんカフェ', 'HPが すこしずつ かいふくする'], zh: ['きょんカフェ', 'HP 會慢慢回復'], en: ['きょんカフェ', 'Slowly regain HP'] },
  utowel: { icon: 'towel', cat: 'goods', cost: [180, 360, 600], ja: ['熱唱タオル', 'ボスの こうげき ダメージ -8%'], zh: ['熱唱タオル', 'Boss 的攻擊傷害 -8%'], en: ['熱唱タオル', 'Boss damage taken -8%'] },
  hcard: { icon: 'hamcard', cat: 'goods', cost: [200, 450], ja: ['ハムナンバーカード', 'スタートの とき レベルアップ +1'], zh: ['ハムナンバーカード', '開場時多升級 1 次'], en: ['ハムナンバーカード', '+1 level-up at the start'] },
  // stacking upgrades: buy again and again, each level costs a little more
  r_atk: { icon: 'berry', cat: 'rep', cost: repCost(80, 40), ja: ['いちごパワー', 'こうげき力 +1.5%'], zh: ['草莓力量', '攻擊力 +1.5%'], en: ['Berry Power', 'Damage +1.5%'] },
  r_hp: { icon: 'oyaki', cat: 'rep', cost: repCost(60, 40), ja: ['おやつ たっぷり', 'さいだいHP +3'], zh: ['點心吃飽飽', '最大 HP +3'], en: ['Plenty of Snacks', 'Max HP +3'] },
  r_spd: { icon: 'shoe', cat: 'rep', cost: repCost(70, 20), ja: ['まいにち おさんぽ', 'いどう そくど +1%'], zh: ['每天散步', '移動速度 +1%'], en: ['Daily Walks', 'Move speed +1%'] },
  r_mag: { icon: 'bow', cat: 'rep', cost: repCost(50, 20), ja: ['おおきな リボン', '♪を すいよせる はんい +3%'], zh: ['大蝴蝶結', '吸取♪範圍 +3%'], en: ['Big Ribbon', 'Pickup range +3%'] },
  r_coin: { icon: 'coin', cat: 'rep', cost: repCost(90, 40), ja: ['ちょきんばこ', 'もらえる いちごコイン +2%'], zh: ['存錢筒', '獲得草莓幣 +2%'], en: ['Piggy Bank', 'Strawberry Coins +2%'] },
  r_xp: { icon: 'note0', cat: 'rep', cost: repCost(90, 20), ja: ['おべんきょう', 'もらえる けいけんち +1.5%'], zh: ['用功讀書', '獲得經驗值 +1.5%'], en: ['Study Time', 'XP +1.5%'] }
};
// sell everything back (full refund). Debt is paid from the refund first. Mutates p.
export function refundAll(p) {
  let total = 0; for (const id of UPG_IDS) { const l = p.up[id] || 0; for (let k = 0; k < l; k++) total += UPGRADES[id].cost[k]; p.up[id] = 0; }
  const repaid = Math.min(p.debt, total); p.debt -= repaid; p.coins = Math.min(MAX_COINS, p.coins + total - repaid);
  return { total, repaid };
}
export const spentTotal = p => UPG_IDS.reduce((a, id) => { for (let k = 0; k < (p.up[id] || 0); k++) a += UPGRADES[id].cost[k]; return a; }, 0);
export const upgradeCost = (id, lvl) => UPGRADES[id].cost[lvl];
// check a purchase. returns { ok, cost, borrow } or { ok:false, reason:'max'|'short'|'debtLimit', cost, need }
export function canBuy(p, id) {
  const lvl = p.up[id] || 0; if (lvl >= UPG_MAX[id]) return { ok: false, reason: 'max' };
  const cost = upgradeCost(id, lvl), need = cost - p.coins;
  if (need <= 0) return { ok: true, cost, borrow: 0 };
  if (p.debt + need > MAX_DEBT) return { ok: false, reason: 'debtLimit', cost, need };
  return { ok: false, reason: 'short', cost, need };
}
// buy, optionally borrowing what is missing. Mutates p. returns the canBuy result (+ borrowed)
export function buy(p, id, allowBorrow) {
  const c = canBuy(p, id);
  if (c.ok) { p.coins -= c.cost; p.up[id]++; return Object.assign(c, { borrowed: 0 }); }
  if (c.reason === 'short' && allowBorrow) { p.debt += c.need; p.coins = 0; p.up[id]++; return { ok: true, cost: c.cost, borrowed: c.need }; }
  return c;
}
// coins earned by one run (before debt repayment)
export function runCoins(s, p) {
  const base = (s.picked || 0) + Math.floor((s.time || 0) / 10) + Math.floor((s.kills || 0) / 25) + (s.won ? 40 : 0) + (s.bosses || 0) * 15;
  return Math.floor(base * (1 + 0.1 * (p.up.toys || 0) + 0.02 * (p.up.r_coin || 0)) * (DIFF[s.diff || 'normal'] || DIFF.normal).coin);
}
// put earned coins in the wallet; debt is repaid first. Mutates p. returns { earned, repaid, gained, cleared }
export function bank(p, earned) {
  const repaid = Math.min(p.debt, earned), had = p.debt > 0;
  p.debt -= repaid; p.coins = Math.min(MAX_COINS, p.coins + earned - repaid);
  const cleared = had && p.debt === 0;
  if (cleared) grant(p, 'debtFree');
  return { earned, repaid, gained: earned - repaid, cleared };
}
export function grant(p, id) { return setAch(p, id); }
export const allBought = p => UPG_IDS.slice(0, 10).every(k => (p.up[k] || 0) >= 1); // the original 10 (the achievement predates the new goods)

// ---------- characters & stages ----------
export const CHARS = {
  kyon: { spr: 'ky', need: null, ja: ['きょん', 'いつもの ロリータ。バランスがいい'], zh: ['きょん', '平常的蘿莉塔裝，平衡型'], en: ['Kyon', 'Classic lolita look. Well balanced'] },
  odekake: { spr: 'od', need: 'firstClear', ja: ['おでかけきょん', '小さくて すばやい。HPは ひかえめ'], zh: ['おでかけきょん', '小小隻跑得快，HP 偏少'], en: ['Odekake Kyon', 'Small and quick, less HP'] },
  ranger: { spr: 'kr0', need: 'evoBeam', ja: ['キョンレンジャー', '変身ビームで スタート。30びょうごとに 5色に チェンジ'], zh: ['キョンレンジャー', '從變身光束開始，每 30 秒換 5 種顏色'], en: ['Kyon Ranger', 'Starts with the beam. Switches between 5 colours every 30 s'] },
  dress: { spr: 'dr', need: 'clearChapel', ja: ['ドレスきょん', 'キラキラの ドレス。ときどき まわりに キラキラ こうげき'], zh: ['ドレスきょん', '閃亮亮的禮服，會不時對周圍放出閃光攻擊'], en: ['Dress Kyon', 'Sparkly dress. Bursts of glitter hit foes around her'] },
  goth: { spr: 'gs', need: 'clearHard', ja: ['ゴスロリきょん', '黒の ゴスロリ。ギターで スタート、こうげき力 アップ'], zh: ['ゴスロリきょん', '黑色哥德蘿莉，從吉他開始，攻擊力提升'], en: ['Goth Kyon', 'Black gothic lolita. Starts with the guitar, hits harder'] },
};
Object.assign(CHARS, CHARS6);
export const charOpen = (p, id) => !CHARS[id].need || hasAch(p, CHARS[id].need) || hasCheat(p, 'azarashi');
// stages unlock in a chain: clear one to open the next. A stage you have already played stays open.
export const STAGES = {
  apple: { ja: ['りんご畑', '信州の りんご畑。カラス大王が まってるよ'], zh: ['蘋果園', '信州的蘋果園，烏鴉大王在等著'], en: ['Apple Orchard', 'A Shinshu apple orchard. The Crow King awaits'] },
  berry: { ja: ['いちご畑', 'いちごが いっぱい。もぐら親分に ちゅうい'], zh: ['草莓田', '滿滿的草莓，小心鼴鼠老大'], en: ['Strawberry Fields', 'Strawberries everywhere. Beware of Boss Mole'] },
  race: { ja: ['夕焼けの競馬場', 'ゆうやけの コースを はしりぬけよう'], zh: ['夕陽賽馬場', '在夕陽下的跑道奔馳'], en: ['Sunset Racecourse', 'Race across the track at sunset'] },
  cage: { ja: ['ケージの中', 'ちいさくなって ハムスターの おうちへ'], zh: ['籠子裡', '變小小，走進倉鼠的家'], en: ['Inside the Cage', 'Shrink down into a hamster cage'] },
  zoo: { ja: ['どうぶつえん', 'おさるや ペンギンが わいわい。ゾウさんが ボス'], zh: ['動物園', '猴子和企鵝鬧哄哄，大象是 Boss'], en: ['The Zoo', 'Monkeys and penguins! The elephant is the boss'] },
  snow: { ja: ['雪の信州', 'まっしろな ふゆの 信州。ゆきだるまに きをつけて'], zh: ['雪之信州', '白茫茫的冬天信州，小心雪人'], en: ['Snowy Shinshu', 'Winter in Shinshu. Watch out for snowmen'] },
  night: { ja: ['夜のステージ', 'ペンライトが ひかる よるの ライブ会場'], zh: ['夜晚舞台', '螢光棒閃耀的夜晚演唱會'], en: ['Night Stage', 'A night concert full of penlights'] },
  chapel: { ja: ['花のチャペル', 'お花が いっぱいの ガーデンウェディング会場'], zh: ['花之教堂', '開滿花朵的花園婚禮會場'], en: ['Flower Chapel', 'A garden wedding venue full of flowers'] },
  china: { ja: ['中華街', 'ちょうちんと ガチャガチャが ならぶ まち。ドラゴンの もんを くぐろう'], zh: ['中華街', '燈籠和扭蛋機林立的街道，穿過龍門吧'], en: ['Chinatown', 'Lanterns and capsule-toy machines line the street. Walk through the dragon gate'] },
};
Object.assign(STAGES, STAGES6);
export const prevStage = id => { const i = STAGE_IDS.indexOf(id); return i > 0 ? STAGE_IDS[i - 1] : null; };
export const stageOpen = (p, id) => { const pr = prevStage(id); return !pr || stageCleared(p, pr) || ((p.st && p.st[id] && p.st[id].t) || 0) > 0 || hasCheat(p, 'shinshu'); };
export const endlessOpen = p => hasAch(p, 'firstClear') || STAGE_IDS.some(k => stageCleared(p, k)) || hasCheat(p, 'shinshu');
// everything currently unlocked, as 'char:x' / 'stage:x' / 'endless' (the result screen shows the difference)
export function unlockSet(p) {
  const out = new Set();
  for (const id in CHARS) if (CHARS[id].need && charOpen(p, id)) out.add('char:' + id);
  for (const id of STAGE_IDS) if (prevStage(id) && stageOpen(p, id)) out.add('stage:' + id);
  if (endlessOpen(p)) out.add('endless');
  return out;
}
// kept for older callers: one-line description of what an achievement opens
export const UNLOCK_BY = Object.assign({ firstClear: ['char:odekake', 'endless'], evoBeam: ['char:ranger'], clearChapel: ['char:dress'], clearHard: ['char:goth'] }, UNLOCK_BY6);

// ---------- achievements ----------
export const ACH = {
  firstClear: { icon: 'berry', ja: ['はじめての クリア', '5分 いきのこる'], zh: ['第一次過關', '撐過 5 分鐘'], en: ['First Clear', 'Survive 5 minutes'] },
  crowKing: { icon: 'crow0', ja: ['カラス大王を たおした', 'カラス大王を たおす'], zh: ['打倒烏鴉大王', '打倒烏鴉大王'], en: ['Crow King Down', 'Defeat the Crow King'] },
  survive3: { icon: 'shoe', ja: ['3分 がんばった', '3分 いきのこる'], zh: ['撐過 3 分鐘', '撐過 3 分鐘'], en: ['Three Minutes', 'Survive 3 minutes'] },
  cageClear: { icon: 'wheel0', ja: ['ケージの中 クリア', '「ケージの中」で 5分 いきのこる'], zh: ['籠子裡過關', '在「籠子裡」撐過 5 分鐘'], en: ['Cage Cleared', 'Survive 5 minutes Inside the Cage'] },
  seals3: { icon: 'seal0', ja: ['あざらし 3びき', 'あざらしを 3びき つれて あるく'], zh: ['三隻海豹', '同時帶著 3 隻海豹'], en: ['Three Seals', 'Have 3 seal buddies at once'] },
  evoBerry: { icon: 'shower', ja: ['いちごシャワー', '「いちごショット」を Lv5にして しんか'], zh: ['草莓雨', '把「草莓射擊」升到 Lv5 進化'], en: ['Strawberry Shower', 'Evolve the Strawberry Shot at Lv5'] },
  evoBeam: { icon: 'boom', ja: ['ファイナル爆破', '「変身ビーム」を Lv5にして しんか'], zh: ['最終爆破', '把「變身光束」升到 Lv5 進化'], en: ['Final Explosion', 'Evolve the Henshin Beam at Lv5'] },
  evoSeal: { icon: 'sealking', ja: ['あざらし大集合', '「あざらし」を Lv5にして しんか'], zh: ['海豹大集合', '把「海豹」升到 Lv5 進化'], en: ['Seal Gathering', 'Evolve the Seal Buddy at Lv5'] },
  evoBrush: { icon: 'kanji0', ja: ['読めない漢字', '「書道の筆」を Lv5にして しんか'], zh: ['讀不出來的漢字', '把「書道之筆」升到 Lv5 進化'], en: ['Unreadable Kanji', 'Evolve the Calligraphy Brush at Lv5'] },
  debtFree: { icon: 'coin', ja: ['完済！', 'いちごコインの しゃっきんを ぜんぶ かえす'], zh: ['還清了！', '把草莓幣的債全部還清'], en: ['Debt-free!', 'Pay back all borrowed coins'] },
  kills1000: { icon: 'cater0', ja: ['1000たい たおした', '1回で 1000たい たおす'], zh: ['打倒 1000 隻', '一場打倒 1000 隻'], en: ['1000 Defeated', 'Defeat 1000 in one run'] },
  lv30: { icon: 'note2', ja: ['レベル30', '1回で レベル30に なる'], zh: ['等級 30', '一場升到 30 級'], en: ['Level 30', 'Reach level 30 in one run'] },
  noDamage: { icon: 'heart', ja: ['ノーダメージ', '2分間 ダメージを うけない'], zh: ['零傷害', '2 分鐘不受傷'], en: ['Untouchable', 'Take no damage for 2 minutes'] },
  shopAll: { icon: 'ham', ja: ['おとくいさま', 'おみせの しなものを ぜんぶ 1回は かう'], zh: ['常客', '商店每種都至少買一次'], en: ['Regular Customer', 'Buy every shop item once'] },
  endless10: { icon: 'bolt', ja: ['むげんの 10分', 'むげんモードで 10分 いきのこる'], zh: ['無盡 10 分鐘', '無盡模式撐過 10 分鐘'], en: ['Endless 10', 'Last 10 minutes in endless mode'] },
  clearApple: { icon: 'tree0', ja: ['りんご畑 クリア', '「りんご畑」で 5分 いきのこる'], zh: ['蘋果園過關', '在「蘋果園」撐過 5 分鐘'], en: ['Orchard Cleared', 'Survive 5 minutes in the Apple Orchard'] },
  clearBerry: { icon: 'bplant0', ja: ['いちご畑 クリア', '「いちご畑」で 5分 いきのこる'], zh: ['草莓田過關', '在「草莓田」撐過 5 分鐘'], en: ['Fields Cleared', 'Survive 5 minutes in the Strawberry Fields'] },
  clearRace: { icon: 'horse0', ja: ['競馬場 クリア', '「夕焼けの競馬場」で 5分 いきのこる'], zh: ['賽馬場過關', '在「夕陽賽馬場」撐過 5 分鐘'], en: ['Racecourse Cleared', 'Survive 5 minutes at the Sunset Racecourse'] },
  clearZoo: { icon: 'zou0', ja: ['どうぶつえん クリア', '「どうぶつえん」で 5分 いきのこる'], zh: ['動物園過關', '在「動物園」撐過 5 分鐘'], en: ['Zoo Cleared', 'Survive 5 minutes at the Zoo'] },
  clearSnow: { icon: 'bigsnow0', ja: ['雪の信州 クリア', '「雪の信州」で 5分 いきのこる'], zh: ['雪之信州過關', '在「雪之信州」撐過 5 分鐘'], en: ['Snow Cleared', 'Survive 5 minutes in Snowy Shinshu'] },
  clearNight: { icon: 'bigspk0', ja: ['夜のステージ クリア', '「夜のステージ」で 5分 いきのこる'], zh: ['夜晚舞台過關', '在「夜晚舞台」撐過 5 分鐘'], en: ['Night Stage Cleared', 'Survive 5 minutes on the Night Stage'] },
  evoDrum: { icon: 'fever', ja: ['ドンドコ・フィーバー', '「ドラム」を Lv5にして しんか'], zh: ['咚咚狂熱', '把「爵士鼓」升到 Lv5 進化'], en: ['Drum Fever', 'Evolve the Drums at Lv5'] },
  evoMic: { icon: 'encore', ja: ['アンコール・ライブ', '「マイク」を Lv5にして しんか'], zh: ['安可演唱會', '把「麥克風」升到 Lv5 進化'], en: ['Encore Live', 'Evolve the Microphone at Lv5'] },
  evoApple: { icon: 'tornado', ja: ['りんご台風', '「りんご」を Lv5にして しんか'], zh: ['蘋果颱風', '把「蘋果」升到 Lv5 進化'], en: ['Apple Typhoon', 'Evolve the Apples at Lv5'] },
  chest: { icon: 'chest', ja: ['たからばこ', 'ボスの たからばこを あける'], zh: ['寶箱', '打開 Boss 的寶箱'], en: ['Treasure!', 'Open a boss treasure chest'] },
  allStages: { icon: 'crown', ja: ['ぜんぶの ステージ', '9つの ステージを ぜんぶ クリア'], zh: ['全部關卡', '9 個關卡全部過關'], en: ['Every Stage', 'Clear all 9 stages'] },
  pickups: { icon: 'magI', ja: ['べんりアイテム コンプ', '1回で じしゃく・ばくだん・いちごケーキを ぜんぶ ひろう'], zh: ['道具全收集', '一場內撿到磁鐵、炸彈和草莓蛋糕'], en: ['Handy Collector', 'Grab a magnet, bomb and cake in one run'] },
  hanpen100: { icon: 'hpBite', ja: ['はんぺん大かつやく', '1回で はんぺんが 100回 かみつく'], zh: ['はんぺん大活躍', '一場內讓はんぺん咬 100 次'], en: ['Good Boy!', 'Hanpen bites 100 times in one run'] },
  evoLariat: { icon: 'giga', ja: ['ギガ・ラリアット', '「ラリアット」を Lv5にして しんか'], zh: ['超級金臂勾', '把「金臂勾」升到 Lv5 進化'], en: ['Giga Lariat', 'Evolve the Lariat at Lv5'] },
  evoPenlight: { icon: 'penSea', ja: ['ペンライトの海', '「ペンライト」を Lv5にして しんか'], zh: ['螢光棒之海', '把「螢光棒」升到 Lv5 進化'], en: ['Sea of Penlights', 'Evolve the Penlight at Lv5'] },
  evoHorse: { icon: 'stampede', ja: ['愛馬の大行進', '「愛馬ダッシュ」を Lv5にして しんか'], zh: ['愛馬大遊行', '把「愛馬衝刺」升到 Lv5 進化'], en: ['Grand Stampede', 'Evolve the Racehorse Rush at Lv5'] },
  evoHam: { icon: 'hparade', ja: ['ハムハム大行進', '「ハムスターボール」を Lv5にして しんか'], zh: ['倉鼠大遊行', '把「倉鼠滾球」升到 Lv5 進化'], en: ['Hamster Parade', 'Evolve the Hamster Ball at Lv5'] },
  evoFan: { icon: 'whirl', ja: ['うちわ大旋風', '「おうえんうちわ」を Lv5にして しんか'], zh: ['應援扇大旋風', '把「應援扇」升到 Lv5 進化'], en: ['Fan Whirlwind', 'Evolve the Cheer Fan at Lv5'] },
  evoGuitar: { icon: 'gsolo', ja: ['ゴシックロック・ソロ', '「ギター」を Lv5にして しんか'], zh: ['哥德搖滾獨奏', '把「吉他」升到 Lv5 進化'], en: ['Gothic Rock Solo', 'Evolve the Guitar at Lv5'] },
  clearHard: { icon: 'fire', ja: ['むずかしい クリア', '「むずかしい」か「ゲキムズ」で クリア'], zh: ['困難過關', '用「困難」或「超級難」過關'], en: ['Hard Clear', 'Clear a stage on Hard or Insane'] },
  clearGeki: { icon: 'crown', ja: ['ゲキムズ クリア', '「ゲキムズ」で クリア'], zh: ['超級難過關', '用「超級難」過關'], en: ['Insane Clear', 'Clear a stage on Insane'] },
  evo3: { icon: 'star3', ja: ['しんか 3つ', '1回で 3つの ぶきを しんかさせる'], zh: ['三連進化', '一場內讓 3 種武器進化'], en: ['Triple Evolution', 'Evolve 3 weapons in one run'] },
  clearChapel: { icon: 'bell0', ja: ['花のチャペル クリア', '「花のチャペル」で 5分 いきのこる'], zh: ['花之教堂過關', '在「花之教堂」撐過 5 分鐘'], en: ['Chapel Cleared', 'Survive 5 minutes at the Flower Chapel'] },
  clearChina: { icon: 'cdragon0', ja: ['中華街 クリア', '「中華街」で 5分 いきのこる'], zh: ['中華街過關', '在「中華街」撐過 5 分鐘'], en: ['Chinatown Cleared', 'Survive 5 minutes in Chinatown'] },
  evoCyalume: { icon: 'minilive', ja: ['ミニライブ', '「サイリウム」を Lv5にして しんか'], zh: ['迷你演唱會', '把「發光棒」升到 Lv5 進化'], en: ['Mini Live', 'Evolve the Glowsticks at Lv5'] },
  ringCake: { icon: 'ringcake', ja: ['リングケーキ', 'ボスの リングケーキを あける'], zh: ['擂台蛋糕', '打開 Boss 掉落的擂台蛋糕'], en: ['Ring Cake', "Open the boss's ring-shaped cake"] },
  gourmet: { icon: 'steak', ja: ['ごちそうさま！', '1回で ローストビーフ・ステーキ・肉じゃが・ぶり大根を ぜんぶ たべる'], zh: ['吃飽飽！', '一場內吃到烤牛肉、牛排、馬鈴薯燉肉和鰤魚燉蘿蔔'], en: ['Feast!', 'Eat roast beef, steak, nikujaga and buri daikon in one run'] },
};
Object.assign(ACH, ACH6);

// ---------- きょん図鑑 (facts about Kyon herself only; sources are public) ----------
// need: null = always, 'played', 'up:<id>', 'ach:<id>'
export const ZUKAN = [
  { id: 'kyon', icon: 'kyface', need: null, ja: ['守屋亨香（きょん）', '1995年5月22日生まれ、長野県安曇野市出身の声優。子役のころから活動していて、2027年に芸能活動20周年を むかえます。', '俳協プロフィール・Wikipedia'], zh: ['守屋亨香（きょん）', '1995 年 5 月 22 日出生，長野縣安曇野市出身的聲優。從童星時期就開始活動，2027 年將迎來演藝生涯 20 週年。', '俳協個人資料、維基百科'], en: ['Kyoka Moriya (Kyon)', 'A voice actress born on 22 May 1995 in Azumino, Nagano. She started as a child performer and reaches 20 years in show business in 2027.', 'Haikyo profile, Wikipedia'] },
  { id: 'nagano', icon: 'tree0', need: null, ja: ['長野県産の声優', 'じこしょうかいは「長野県産の声優」。ふるさとの安曇野は、北アルプスの雪どけ水が わく わさび田で ゆうめいです。', 'X プロフィール・安曇野市'], zh: ['長野縣產的聲優', '自我介紹是「長野縣產的聲優」。故鄉安曇野以北阿爾卑斯融雪湧泉灌溉的山葵田聞名。', 'X 個人簡介、安曇野市'], en: ['Made in Nagano', 'She calls herself a "voice actress made in Nagano". Her hometown Azumino is famous for wasabi fields fed by Northern Alps snowmelt.', 'X profile, Azumino City'] },
  { id: 'ichigo', icon: 'berry', need: null, ja: ['いちご 🍓', 'トレードマークの顔文字は「( ∩\'-\'🍓⊂ )」。このゲームの いちごショットは ここから うまれました。', 'X プロフィール'], zh: ['草莓 🍓', '招牌顏文字是「( ∩\'-\'🍓⊂ )」。這個遊戲的草莓射擊就是從這裡來的。', 'X 個人簡介'], en: ['Strawberry 🍓', 'Her signature kaomoji is "( ∩\'-\'🍓⊂ )". That is where this game\'s Strawberry Shot comes from.', 'X profile'] },
  { id: 'hanpen', icon: 'hp0', need: null, ja: ['はんぺん 🐶', '2022年から いっしょに くらしている ビションフリーゼの 男の子。このゲームでは 敵を かんだり ♪を とってきたり してくれます。', 'Wikipedia'], zh: ['はんぺん 🐶', '從 2022 年起一起生活的公比熊犬。在遊戲裡會幫忙咬敵人、把♪叼回來。', '維基百科'], en: ['Hanpen 🐶', 'Her bichon frise boy, part of the family since 2022. In this game he bites foes and fetches ♪ for you.', 'Wikipedia'] },
  { id: 'azarashi', icon: 'seal0', need: 'played', ja: ['あざらし 🦭', '投稿には ほぼ まいかい 🦭。3月22日の「国際アザラシの日」には「アザラシを愛しています🦭」と 投稿しました。', 'X'], zh: ['海豹 🦭', '貼文幾乎每篇都有 🦭。3 月 22 日「國際海豹日」發文「アザラシを愛しています🦭」。', 'X'], en: ['Seals 🦭', 'Almost every post has a 🦭. On International Seal Day (22 March) she posted "I love seals 🦭".', 'X'] },
  { id: 'ohayau', icon: 'seal1', need: 'up:ohayo', ja: ['おはやう🦭', 'あさの あいさつは「おはやう🦭」、おやすみは「ｵﾔｽﾐｯ🦭」。', 'X'], zh: ['おはやう🦭', '早上的招呼是「おはやう🦭」，晚安是「ｵﾔｽﾐｯ🦭」。', 'X'], en: ['Ohayau 🦭', 'Her good-morning is "Ohayau 🦭" and good-night is "Oyasumi 🦭".', 'X'] },
  { id: 'shodo', icon: 'brush', need: 'up:shodo', ja: ['書道四段', 'とくぎは 書道（四段）。手芸も とくいです。', '俳協プロフィール'], zh: ['書道四段', '特長是書道（四段），也擅長手藝。', '俳協個人資料'], en: ['Calligraphy, 4th Dan', 'Her special skill is calligraphy (4th dan). She is good at handicrafts too.', 'Haikyo profile'] },
  { id: 'kanji', icon: 'kanji0', need: 'ach:evoBrush', ja: ['読めない漢字', 'ラジオ「ささもり」の「きょうか力テスト」では、むずかしい漢字の読みに ちょうせん。書道四段なのに…という ギャップも みりょくです。', '超！アニメディア'], zh: ['讀不出來的漢字', '在廣播「ささもり」的「きょうか力テスト」裡挑戰難讀的漢字。明明是書道四段……這種反差也很可愛。', '超！アニメディア'], en: ['Unreadable Kanji', 'On the radio show "Sasamori" she takes on hard kanji in the "Kyoka-ryoku Test". A calligraphy 4th dan who misreads kanji: part of the charm.', 'Cho! Animedia'] },
  { id: 'drum', icon: 'drum', need: 'up:drumbeat', ja: ['ドラム 🥁', 'しゅみの ひとつが ドラム。', 'DIALOGUE+ 公式サイト・俳協プロフィール'], zh: ['爵士鼓 🥁', '興趣之一是打鼓。', 'DIALOGUE+ 官網、俳協個人資料'], en: ['Drums 🥁', 'Playing the drums is one of her hobbies.', 'DIALOGUE+ site, Haikyo profile'] },
  { id: 'lolita', icon: 'dress', need: 'up:panier', ja: ['ロリータモデル 💖', 'X の プロフィールにも「ロリータモデル💖」。ロリータ・ゴシック系の ファッションショーにも モデルとして 出ています。', 'X'], zh: ['蘿莉塔模特 💖', 'X 簡介也寫著「ロリータモデル💖」，也以模特身分參加蘿莉塔／哥德風時裝秀。', 'X'], en: ['Lolita Model 💖', 'Her X profile says "Lolita model 💖", and she walks in lolita and gothic fashion shows.', 'X'] },
  { id: 'umanushi', icon: 'horse0', need: 'ach:crowKing', ja: ['一口馬主 🐎', 'ラジオ番組の きかくを きっかけに 一口馬主に。「愛馬の頭を なでてみたい」と 話していました。', '東スポ競馬'], zh: ['一口馬主 🐎', '因為廣播節目的企劃成為一口馬主，說過「想摸摸愛馬的頭」。', '東スポ競馬'], en: ['Racehorse Co-owner 🐎', 'A radio show project made her a racehorse co-owner. She said she would love to pat her horse on the head.', 'Tospo Keiba'] },
  { id: 'puroresu', icon: 'belt', need: 'ach:kills1000', ja: ['プロレス', 'しゅみは プロレス観戦。X の「すきなもの」にも プロレス。', '俳協プロフィール・X'], zh: ['職業摔角', '興趣是看職業摔角，X 的喜好欄也有寫。', '俳協個人資料、X'], en: ['Pro Wrestling', 'Watching pro wrestling is a hobby, and it is on her X likes list too.', 'Haikyo profile, X'] },
  { id: 'tokusatsu', icon: 'bolt', need: 'ach:lv30', ja: ['特撮', 'X の「すきなもの」に 特撮。あざらし・音楽・アイドルも ならんでいます。', 'X プロフィール'], zh: ['特攝', 'X 喜好欄寫著特攝，旁邊還有海豹、音樂和偶像。', 'X 個人簡介'], en: ['Tokusatsu', 'Tokusatsu hero shows are on her X likes list, next to seals, music and idols.', 'X profile'] },
  { id: 'ranger', icon: 'kr0', need: 'ach:evoBeam', ja: ['キョンレンジャー', '2025年の たんじょうびグッズは「守神戦隊 キョンレンジャー」の 特大爆破アクスタ。赤・青・黄・ピンク・緑の 5色で 変身ポーズ！（ゲームの すがたは オリジナルの ドット絵です）', 'DIALOGUE+ 公式・きゃにめ'], zh: ['キョンレンジャー', '2025 年生日周邊是「守神戦隊 キョンレンジャー」特大爆破壓克力立牌，紅藍黃粉綠五色戰隊服擺出變身姿勢！（遊戲裡是原創像素畫）', 'DIALOGUE+ 官網、きゃにめ'], en: ['Kyon Ranger', 'Her 2025 birthday merch was a giant "Kyon Ranger" explosion acrylic stand: five colours, red, blue, yellow, pink and green, in a henshin pose! (The game sprite is original pixel art.)', 'DIALOGUE+ site, canime'] },
  { id: 'odekake', icon: 'od0', need: 'ach:firstClear', ja: ['おでかけきょんちゃん', '2024年の たんじょうびグッズは 約12cmの うごく ドール。緑の チェックの おようふく。首と せなかの ほくろは 本人が 1体ずつ 手がき！', 'きゃにめ・DIALOGUE+ 公式'], zh: ['おでかけきょんちゃん', '2024 年生日周邊是約 12cm 的可動娃娃，綠格紋衣服。脖子和背上的痣是本人一隻一隻手寫的！', 'きゃにめ、DIALOGUE+ 官網'], en: ['Odekake Kyon-chan', 'Her 2024 birthday merch: a posable 12 cm doll in a green check outfit. She hand-drew the beauty marks on every single one!', 'canime, DIALOGUE+ site'] },
  { id: 'michizure', icon: 'michi', need: 'up:michi', ja: ['みちづれきょんちゃん', '2026年の たんじょうびグッズは ぬいぐるみの 頭の ポシェット。緑の メッシュに「ω」の くち。', 'きゃにめ'], zh: ['みちづれきょんちゃん', '2026 年生日周邊是布偶頭造型的斜背包，綠色挑染和「ω」嘴。', 'きゃにめ'], en: ['Michizure Kyon-chan', 'Her 2026 birthday merch: a plush-head shoulder bag with a green streak and an "ω" mouth.', 'canime'] },
  { id: 'coin', icon: 'coin', need: 'ach:debtFree', ja: ['しゃっきんと 完済', 'ラジオ「ささもり」には 番組内つうかが あって、いちどは しゃっきん状態に。でも 賞金で 完済！このゲームの しゃっきんシステムは ここから。', 'Wikipedia・超！アニメディア'], zh: ['欠債與還清', '廣播「ささもり」有節目內的虛擬貨幣，一度欠債，後來用獎金還清！遊戲的借款系統就是從這裡來的。', '維基百科、超！アニメディア'], en: ['Debt and Payback', 'The radio show "Sasamori" has its own in-show currency. It once went into debt, then paid it all back with prize money! That is where this game\'s borrowing comes from.', 'Wikipedia, Cho! Animedia'] },
  { id: 'cage', icon: 'ham', need: 'ach:cageClear', ja: ['ケージの中', '「ささもり」は「かわいい」が テーマで ハムスターを そだてる ラジオ。2023年に「かわいいラジオ賞」を 受賞しました。', '超！アニメディア'], zh: ['籠子裡', '「ささもり」是以「可愛」為主題、養倉鼠的廣播，2023 年拿下「かわいいラジオ賞」。', '超！アニメディア'], en: ['Inside the Cage', '"Sasamori" is a radio show themed on cuteness, built around raising hamsters. It won a "Cute Radio Award" in 2023.', 'Cho! Animedia'] },
  { id: 'green', icon: 'pen3', need: 'ach:seals3', ja: ['緑 💚', 'DIALOGUE+ での メンバーカラーは 緑。ファンの よびかたは「ログっ子」。', 'DIALOGUE+ 公式サイト'], zh: ['綠 💚', '在 DIALOGUE+ 的代表色是綠色，粉絲叫做「ログっ子」。', 'DIALOGUE+ 官網'], en: ['Green 💚', 'Her member colour in DIALOGUE+ is green, and fans are called "Logukko".', 'DIALOGUE+ site'] },
  { id: 'yakiniku', icon: 'yaki', need: 'ach:noDamage', ja: ['焼肉 🍖', 'ラジオ「チャカダン」の「きょうか組 鉄の掟」には「一、定期的に組長に焼肉を食べさせる」。このゲームでも 焼肉で HPぜんかい！', '音泉「チャカダン」'], zh: ['燒肉 🍖', '廣播「チャカダン」的「きょうか組 鉄の掟」有一條「一、定期讓組長吃燒肉」。遊戲裡吃燒肉 HP 全回！', '音泉「チャカダン」'], en: ['Yakiniku 🍖', 'Her radio show "Chakadan" has a gang rule: "One: treat the boss to yakiniku regularly." In this game yakiniku heals you fully!', 'Onsen "Chakadan"'] },
  { id: 'zoo', icon: 'zou0', need: 'ach:clearZoo', ja: ['どうぶつえん 🐘', 'ラジオ「ささもり」で かせいだ 賞金は、長野の どうぶつえんの おうえんにも つかわれました。', 'Wikipedia（あつまれ！ささもり！）'], zh: ['動物園 🐘', '廣播「ささもり」贏到的獎金，也拿去贊助長野的動物園。', '維基百科（あつまれ！ささもり！）'], en: ['The Zoo 🐘', 'Prize money won on the radio show "Sasamori" also went to support a zoo in Nagano.', 'Wikipedia (Atsumare! Sasamori!)'] },
  { id: 'matsumoto', icon: 'pine0', need: 'ach:clearSnow', ja: ['安曇野と 松本 ❄', '小学校と 中学校は 安曇野、高校は 松本の 学校に かよっていました。', 'Wikipedia'], zh: ['安曇野與松本 ❄', '國小、國中在安曇野，高中讀松本的學校。', '維基百科'], en: ['Azumino and Matsumoto ❄', 'She went to elementary and junior high school in Azumino, and high school in Matsumoto.', 'Wikipedia'] },
  { id: 'koe', icon: 'mic', need: 'ach:clearNight', ja: ['こえの はなし 🎤', '子役から スタート。じぶんの こえが にがてだったけど、声優の オーディションで ほめられて 声優の みちへ。', 'Wikipedia・超！アニメディア'], zh: ['聲音的故事 🎤', '從童星起步。原本不喜歡自己的聲音，在聲優試鏡被稱讚，才走上聲優之路。', '維基百科、超！アニメディア'], en: ['About Her Voice 🎤', 'She started as a child actor. She used to dislike her own voice, until it was praised at a voice-acting audition.', 'Wikipedia, Cho! Animedia'] },
  { id: 'kogara', icon: 'od0', need: 'ach:clearBerry', ja: ['しんちょう 149cm', 'プロフィールの しんちょうは 149cm。ちいさくても パワフル！', '俳協プロフィール'], zh: ['身高 149cm', '個人資料上的身高是 149cm，小小隻但很有活力！', '俳協個人資料'], en: ['149 cm', 'Her profile lists her height as 149 cm. Small but powerful!', 'Haikyo profile'] },
  { id: 'ongaku', icon: 'encore', need: 'ach:evoMic', ja: ['おんがく 🎵', 'しゅみは おんがく かんしょうと アニソンを うたうこと。', 'DIALOGUE+ 公式サイト・俳協プロフィール'], zh: ['音樂 🎵', '興趣是聽音樂和唱動畫歌。', 'DIALOGUE+ 官網、俳協個人資料'], en: ['Music 🎵', 'Her hobbies include listening to music and singing anime songs.', 'DIALOGUE+ site, Haikyo profile'] },
  { id: 'guitar', icon: 'guitar', need: 'ach:evoApple', ja: ['ギター 🎸', 'ゴシックロックの ユニット「千客万来クリニック」では ギター たんとう。メンバーカラーは 赤。', '千客万来クリニック 公式'], zh: ['吉他 🎸', '在哥德搖滾組合「千客万来クリニック」擔任吉他，代表色是紅色。', '千客万来クリニック 官方'], en: ['Guitar 🎸', 'In the gothic rock unit "Senkyaku Banrai Clinic" she plays guitar, and her colour is red.', 'Senkyaku Banrai Clinic'] },
  { id: 'dialogue7', icon: 'crown', need: 'ach:allStages', ja: ['CDデビュー 7しゅうねん', 'DIALOGUE+ は 2026年に CDデビュー 7しゅうねんを むかえました。', 'X'], zh: ['CD 出道 7 週年', 'DIALOGUE+ 在 2026 年迎來 CD 出道 7 週年。', 'X'], en: ['7 Years Since the CD Debut', 'DIALOGUE+ celebrated 7 years since its CD debut in 2026.', 'X'] },
  { id: 'dress', icon: 'dr0', need: 'ach:clearChapel', ja: ['ドレスの きょん 👗', 'ラジオで 着た ドレスは、パステルの みずいろの プリンセスライン。キラキラの チュールに パフスリーブ、かみは おだんご 2つ。つめも まえの日に おそろいの いろに ぬりました。ドレスを 着たのは 七五三 いらい だそうです。', '文化放送「結婚式は愛の中で」#320'], zh: ['穿禮服的きょん 👗', '在廣播節目裡穿的是粉嫩水藍色的公主線禮服，閃亮亮的薄紗配上泡泡袖，頭髮綁成兩顆丸子頭。前一天還把指甲塗成同色系。上一次穿禮服，已經是七五三的時候了。', '文化放送《結婚式は愛の中で》#320'], en: ['Kyon in a Dress 👗', 'On the radio she wore a pastel light-blue princess-line dress with glittery tulle and puff sleeves, her hair in two buns, and nails painted to match the night before. The last time she wore a dress was for Shichi-Go-San as a little girl.', 'Bunka Hoso \'Kekkonshiki wa Ai no Naka de\' #320'] },
  { id: 'mizuiro', icon: 'glitter', need: 'ach:clearChapel', ja: ['みずいろと ピンク 💙', 'ユニットの メンバーカラーは みどり。でも ほんとうは みずいろと ピンクが 大すき。みずいろは 顔に にあうので、ふだんの ふくでも よく 着ています。', '文化放送「結婚式は愛の中で」#320'], zh: ['水藍色和粉紅色 💙', '團體裡的代表色是綠色，但其實她最喜歡水藍色和粉紅色。水藍色很襯她的臉，所以平常的衣服也常穿水藍色。', '文化放送《結婚式は愛の中で》#320'], en: ['Light Blue and Pink 💙', 'Her member colour in the unit is green, but she really loves light blue and pink. Light blue suits her face, so she often wears it in her own clothes.', 'Bunka Hoso \'Kekkonshiki wa Ai no Naka de\' #320'] },
  { id: 'papa', icon: 'yaki', need: 'ach:gourmet', ja: ['お父さんと 焼肉 🍖', '東京で お父さんと はんぺんと くらしています。お父さんに 焼肉を ごちそう することも。はじめて ちょっと いい 焼肉屋さんに つれていった ときは とても 感動していた けれど、ないている ところは 見たことが ないそうです。', '文化放送「結婚式は愛の中で」#320'], zh: ['和爸爸吃燒肉 🍖', '在東京和爸爸還有はんぺん一起生活，有時會請爸爸吃燒肉。第一次帶爸爸去比較高級的燒肉店時，爸爸非常感動，不過她說從來沒看過爸爸哭。', '文化放送《結婚式は愛の中で》#320'], en: ['Yakiniku with Dad 🍖', 'She lives in Tokyo with her dad and Hanpen, and sometimes treats her dad to yakiniku. He was really moved the first time she took him somewhere fancy, but she says she has never seen him cry.', 'Bunka Hoso \'Kekkonshiki wa Ai no Naka de\' #320'] },
  { id: 'gyuniku', icon: 'steak', need: 'ach:gourmet', ja: ['牛肉が 大すき 🥩', 'とにかく 牛肉が 大すき。このゲームの ローストビーフと ステーキは ここから うまれました。', '文化放送「結婚式は愛の中で」#320'], zh: ['最愛牛肉 🥩', '總之就是超愛牛肉。這個遊戲裡的烤牛肉和牛排就是這樣來的。', '文化放送《結婚式は愛の中で》#320'], en: ['Beef Lover 🥩', "She simply loves beef. That is where this game's roast beef and steak come from.", 'Bunka Hoso \'Kekkonshiki wa Ai no Naka de\' #320'] },
  { id: 'ryouri', icon: 'nikujaga', need: 'ach:gourmet', ja: ['目分量で りょうり 🍲', 'りょうりは はからずに 目分量。にものが とくいで、肉じゃがや ぶり大根も おまかせ。そのかわり、きっちり はかる おかしづくりは にがて だそうです。', '文化放送「結婚式は愛の中で」#320'], zh: ['靠目測做菜 🍲', '做菜不量份量，全靠目測。拿手的是燉煮料理，馬鈴薯燉肉、鰤魚燉蘿蔔都難不倒她。相反地，需要精準秤量的烘焙就不太行。', '文化放送《結婚式は愛の中で》#320'], en: ['Cooking by Eye 🍲', 'She cooks by eye, never measuring. Simmered dishes like nikujaga and buri daikon are her speciality, but baking, where everything must be measured, is not her thing.', 'Bunka Hoso \'Kekkonshiki wa Ai no Naka de\' #320'] },
  { id: 'koyaku', icon: 'kyface', need: 'ach:clearHard', ja: ['子役の ころ 🎬', '小学生の ころに 子役として かつどうを はじめました。ここまで つづけて こられたのは 両親の おかげ、と かんしゃ しています。', '文化放送「結婚式は愛の中で」#320'], zh: ['童星時期 🎬', '小學時以童星身分開始活動。她很感謝爸媽，說能一路走到現在都是多虧了他們。', '文化放送《結婚式は愛の中で》#320'], en: ['Child Performer 🎬', 'She started out as a child performer in elementary school, and she is grateful to her parents for helping her keep going all this way.', 'Bunka Hoso \'Kekkonshiki wa Ai no Naka de\' #320'] },
  { id: 'owarai', icon: 'star3', need: 'ach:evo3', ja: ['お笑いが 大すき 😆', '小学生の ころから ずっと お笑いが 大すきです。', '文化放送「結婚式は愛の中で」#320'], zh: ['最愛搞笑 😆', '從小學開始就一直超喜歡搞笑節目。', '文化放送《結婚式は愛の中で》#320'], en: ['Comedy Fan 😆', 'She has loved comedy ever since elementary school.', 'Bunka Hoso \'Kekkonshiki wa Ai no Naka de\' #320'] },
  { id: 'osana', icon: 'cyal', need: 'ach:evoCyalume', ja: ['長野の おさななじみ 💚', '長野の おさななじみ 4人は、ライブに くるとき みどりの ふくを 着て おうえん してくれます。', '文化放送「結婚式は愛の中で」#320'], zh: ['長野的青梅竹馬 💚', '長野的 4 位青梅竹馬來看演唱會時，都會穿綠色的衣服幫她應援。', '文化放送《結婚式は愛の中で》#320'], en: ['Friends from Nagano 💚', 'Her four childhood friends from Nagano wear green when they come to cheer at her concerts.', 'Bunka Hoso \'Kekkonshiki wa Ai no Naka de\' #320'] },
  { id: 'gosu', icon: 'gs0', need: 'ach:clearHard', ja: ['じぶんの スタイル 🖤', 'ふだん すきな スタイルは、黒・原宿系・ゴスロリ。', '文化放送「結婚式は愛の中で」#320'], zh: ['自己的風格 🖤', '平常喜歡的風格是黑色、原宿風和哥德蘿莉。', '文化放送《結婚式は愛の中で》#320'], en: ['Her Own Style 🖤', 'In everyday life she loves black, Harajuku fashion and gothic lolita.', 'Bunka Hoso \'Kekkonshiki wa Ai no Naka de\' #320'] },
  { id: 'wedding', icon: 'ringcake', need: 'ach:ringCake', ja: ['ゆめの けっこんしき 💒', 'りそうは レストランで ひらく カジュアルな パーティー。ゲストは すきな ふくで きて OK。ケーキは プロレスの リングの かたちに してみたい、という ゆめも あります。', '文化放送「結婚式は愛の中で」#320'], zh: ['夢想中的婚禮 💒', '理想是在餐廳辦一場輕鬆的派對，賓客想穿什麼都可以。她還有個夢想：把結婚蛋糕做成職業摔角擂台的形狀！', '文化放送《結婚式は愛の中で》#320'], en: ['Dream Wedding 💒', 'Her ideal is a casual party at a restaurant where guests can wear whatever they like. She also dreams of a wedding cake shaped like a pro-wrestling ring!', 'Bunka Hoso \'Kekkonshiki wa Ai no Naka de\' #320'] },
  { id: 'taiwan', icon: 'mala', need: 'played', ja: ['おいしい麻辣スープ 🌶️', '配信で、麻辣スープが おいしい と はなしていました。', '配信'], zh: ['好吃的麻辣湯 🌶️', '她在直播裡說過麻辣湯很好吃。', '直播'], en: ['Tasty mala soup 🌶️', 'On her stream she said mala soup is tasty.', 'Her stream'] },
  { id: 'chuka', icon: 'xlb', need: 'ach:clearChina', ja: ['中華が 大すき 🥟', '中華りょうりが 大すきで、いつも もりもり たべます。', '本人の おはなし'], zh: ['最愛中華料理 🥟', '超喜歡中華料理，每次都吃得很豪邁。', '本人分享'], en: ['Loves Chinese Food 🥟', 'She loves Chinese food and always eats heartily.', 'In her own words'] },
  { id: 'remake', icon: 'skirt', need: 'ach:clearChina', ja: ['リメイク スカート 🧵', 'むかしの トップスを、じぶんで スカートに リメイク したことが あります。', '本人の おはなし'], zh: ['改造裙子 🧵', '曾經自己動手把以前的上衣改造成裙子。', '本人分享'], en: ['Remade Skirt 🧵', 'She once remade an old top into a skirt all by herself.', 'In her own words'] },
];
ZUKAN.push(...ZUKAN6);
export function zukanOpen(p, e) {
  const n = e.need; if (!n || hasCheat(p, 'zukan')) return true;
  if (n === 'played') return p.bestTime > 0 || p.clears > 0 || STAGE_IDS.some(k => p.st && p.st[k] && p.st[k].t > 0);
  const [k, id] = n.split(':');
  if (k === 'up') return (p.up[id] || 0) > 0;
  if (k === 'ach') return hasAch(p, id);
  return false;
}

// ---------- ひみつのコード (secret words) ----------
// Each word works once per save. Typed in romaji or kana; case, width, spaces and katakana/hiragana don't matter.
export const CHEATS = {
  ichigo: { words: ['ichigo', 'いちご'], icon: 'coin' },
  azarashi: { words: ['azarashi', 'azarasi', 'あざらし'], icon: 'seal0' },
  shinshu: { words: ['shinshu', 'sinsyu', 'shinsyu', 'sinshu', 'しんしゅう'], icon: 'tree0' },
  hamuhamu: { words: ['hamuhamu', 'はむはむ'], icon: 'ham' },
  hanpen: { words: ['hanpen', 'hampen', 'はんぺん'], icon: 'hp0' },
  kyonkyon: { words: ['kyonkyon', 'きょんきょん'], icon: 'boom' },
  zukan: { words: ['zukan', 'ずかん'], icon: 'kyface' },
  ohayau: { words: ['ohayau', 'おはやう'], icon: 'seal1' }
};
export const CHEAT_COINS = 10000;
export function cheatKey(str) {
  return String(str || '').normalize('NFKC').toLowerCase()
    .replace(/[\u30a1-\u30f6]/g, c => String.fromCharCode(c.charCodeAt(0) - 0x60)) // katakana -> hiragana
    .replace(/[\s\-‐‑‒–—―・.,_、。!！?？~〜'"「」]/g, '');
}
export function findCheat(str) { const k = cheatKey(str); if (!k) return null; for (const id of CHEAT_IDS) if (CHEATS[id].words.includes(k)) return id; return null; }
// returns { ok: true, id } or { ok: false, reason: 'empty' | 'unknown' | 'used' | 'today', id }
// ichigo works once per local calendar day ('today' when used again the same day); the others once per save
export function redeemCheat(p, str, today = localDay()) {
  if (!cheatKey(str)) return { ok: false, reason: 'empty' };
  const id = findCheat(str); if (!id) return { ok: false, reason: 'unknown' };
  if (id === 'ichigo') { if ((p.iday || 0) >= today) return { ok: false, reason: 'today', id }; p.iday = today; }
  else if (hasCheat(p, id)) return { ok: false, reason: 'used', id };
  p.cheats = (p.cheats | (1 << CHEAT_IDS.indexOf(id))) >>> 0;
  if (id === 'ichigo') p.coins = Math.min(MAX_COINS, p.coins + CHEAT_COINS);
  if (id === 'hamuhamu') p.debt = 0;
  if (id === 'kyonkyon') p.boost = 1;
  return { ok: true, id };
}
// the README "all unlocked" profile: every stage cleared, every achievement and shop item, lots of coins
export function allUnlockedProfile(emptyProfile) {
  const p = emptyProfile();
  Object.assign(p, { bestLevel: 50, clears: STAGE_IDS.length, coins: MAX_COINS, debt: 0, ach: achAll(), ach2: achAll2(), bestTime: CLEAR_T, bestKills: 2000 });
  for (const k of UPG_IDS) p.up[k] = UPG_MAX[k];
  for (const k of STAGE_IDS) p.st[k] = { t: CLEAR_T, k: 1000, d: DIFFS.length, by: DIFFS.map(() => ({ t: CLEAR_T, k: 1000 })) };
  p.bestKills = 1000;
  return p;
}
