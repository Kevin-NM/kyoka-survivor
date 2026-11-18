// "Run code" (続きコード): one unfinished run, as a short grouped code in the same alphabet as the save codes.
// Variable length: sentinel bit + data bits + CRC-16, scrambled by a multiplier modulo 31^len.
// Lengths are multiples of 4 and never a save-code length, so the two kinds of code can't be confused.
import { ALPHA, normalize } from './save.js';
// fixed orders: never reorder, only append
export const RC_STAGES = ['apple', 'berry', 'race', 'cage', 'zoo', 'snow', 'night', 'chapel', 'china', 'halloween', 'runway', 'ring', 'dawn', 'cherry', 'station', 'clinic', 'okinawa', 'hq', 'road'];
export const RC_CHARS = ['kyon', 'odekake', 'ranger', 'dress', 'goth', 'dj', 'amaroli', 'waroli', 'machi', 'ekicho', 'redgt', 'kumicho', 'sapphire'];
export const RC_WEAPONS = ['berry', 'lariat', 'beam', 'penlight', 'horse', 'seal', 'brush', 'drum', 'mic', 'apple', 'ham', 'fan', 'guitar', 'cyalume', 'ttable', 'para', 'hlock', 'koma', 'whis', 'syr', 'chaka'];
export const RC_PASSIVES = ['pannier', 'shoes', 'ribbon', 'gobelt', 'suzuri', 'metro', 'nodoame', 'basket', 'omamori', 'gakufu', 'wasabi'];
export const RC_BOOSTS = ['b_atk', 'b_hp', 'b_spd', 'b_mag', 'b_cd', 'b_coin'];
const DIFFS = ['easy', 'normal', 'hard', 'geki'];
const SAVE_LENS = new Set([12, 24, 44, 52, 60, 84, 92, 104]);
const VER = 2; // v2 appends the special-move gauge (v1 codes still restore, with an empty gauge)
// [key, bits] for the fixed part
const FIXED = [['ver', 2], ['id', 16], ['stage', 5], ['char', 4], ['diff', 2], ['endless', 1], ['cleared', 1], ['boosted', 1], ['bossAlive', 1],
  ['t', 14], ['lvl', 7], ['xp', 5], ['hp', 6], ['pending', 3], ['kills', 18], ['picked', 14], ['banked', 14], ['bossKills', 6], ['nextBoss', 14], ['revives', 2],
  ['hamN', 3], ['misN', 3], ['misOk', 3]];
const lim = (v, b) => Math.max(0, Math.min(2 ** b - 1, Math.floor(Number(v) || 0)));
const KSRC = 0x9E3779B97F4A7C15F39CC0605CEDC8341082276BF3A27251C6A4A7935BD1E995B5AD4ECEDA1CE2A9D3n;
const MSRC = 0x243F6A8885A308D313198A2E03707344A4093822299F31D0082EFA98EC4E6C89452821E638D01377BE5466CF34E90C6CC0AC29B7C97C50DD3F84D5B5B5470917n;
function inv(a, m) { let [r0, r1, s0, s1] = [a % m, m, 1n, 0n]; while (r1) { const q = r0 / r1;[r0, r1] = [r1, r0 - q * r1];[s0, s1] = [s1, s0 - q * s1]; } return ((s0 % m) + m) % m; }
const keyFor = L => { const M = 31n ** BigInt(L); let K = KSRC % M; if (K % 31n === 0n) K += 1n; return { M, K }; };
function crc16(v, bits) { let c = 0xFFFF; for (let i = bits - 1; i >= 0; i--) { const b = Number((v >> BigInt(i)) & 1n), t = (c >> 15) & 1; c = (c << 1) & 0xFFFF; if (t ^ b) c ^= 0x1021; } return c; }
const bitLen = v => v.toString(2).length;

// run: { id, stage, char, diff, endless, cleared, boosted, bossAlive, t, lvl, xp (0..1), hp (0..1), pending, kills, picked, banked, bossKills, nextBoss, revives,
//        hamN, misN, misOk, weapons {id: lv}, evo {id: true}, passives {id: lv}, boost {id: n}, sp (0..1, the 必殺技 gauge) }
export function encodeRun(r) {
  const out = []; const put = (v, b) => out.push([BigInt(lim(v, b)), b]);
  const vals = Object.assign({}, r, { ver: VER, stage: RC_STAGES.indexOf(r.stage), char: RC_CHARS.indexOf(r.char), diff: DIFFS.indexOf(r.diff),
    endless: r.endless ? 1 : 0, cleared: r.cleared ? 1 : 0, boosted: r.boosted ? 1 : 0, bossAlive: r.bossAlive ? 1 : 0,
    xp: Math.round(Math.max(0, Math.min(1, r.xp || 0)) * 31), hp: Math.max(1, Math.round(Math.max(0, Math.min(1, r.hp || 0)) * 63)) });
  for (const [k, b] of FIXED) put(vals[k], b);
  for (const id of RC_WEAPONS) put(r.weapons[id] ? 1 : 0, 1);
  for (const id of RC_WEAPONS) if (r.weapons[id]) put(r.evo[id] ? 0 : Math.min(5, r.weapons[id]), 3); // 0 = evolved (level 5)
  for (const id of RC_PASSIVES) put(r.passives[id] ? 1 : 0, 1);
  for (const id of RC_PASSIVES) if (r.passives[id]) put(Math.min(3, r.passives[id]), 2);
  for (const id of RC_BOOSTS) put(r.boost[id] ? 1 : 0, 1);
  for (const id of RC_BOOSTS) if (r.boost[id]) put(r.boost[id], 8);
  put(Math.round(Math.max(0, Math.min(1, r.sp || 0)) * 100), 7);
  let v = 1n, n = 0; for (const [x, b] of out) { v = (v << BigInt(b)) | x; n += b; }
  v ^= MSRC & ((1n << BigInt(n)) - 1n);
  const full = (v << 16n) | BigInt(crc16(v, n + 1));
  let L = 4; while (31n ** BigInt(L) <= full || SAVE_LENS.has(L)) L += 4;
  const { M, K } = keyFor(L); let x = (full * K) % M, s = '';
  for (let i = 0; i < L; i++) { s = ALPHA[Number(x % 31n)] + s; x /= 31n; }
  return s.match(/.{4}/g).join('-');
}
export const isRunLen = n => n >= 20 && n % 4 === 0 && !SAVE_LENS.has(n) && n <= 120;
// -> run object or null
export function decodeRun(str) {
  const s = normalize(str); if (!isRunLen(s.length)) return null;
  let x = 0n; for (const ch of s) { const i = ALPHA.indexOf(ch); if (i < 0) return null; x = x * 31n + BigInt(i); }
  const { M, K } = keyFor(s.length), full = (x * inv(K, M)) % M;
  const c = Number(full & 0xFFFFn); let v = full >> 16n; if (v < 2n) return null;
  const n = bitLen(v) - 1; if (crc16(v, n + 1) !== c) return null;
  v ^= MSRC & ((1n << BigInt(n)) - 1n);
  let pos = n; const get = b => { if (pos < b) throw 0; pos -= b; return Number((v >> BigInt(pos)) & ((1n << BigInt(b)) - 1n)); };
  try {
    const r = {}; for (const [k, b] of FIXED) r[k] = get(b);
    if (r.ver < 1 || r.ver > VER || r.stage >= RC_STAGES.length || r.char >= RC_CHARS.length) return null;
    r.stage = RC_STAGES[r.stage]; r.char = RC_CHARS[r.char]; r.diff = DIFFS[r.diff];
    for (const k of ['endless', 'cleared', 'boosted', 'bossAlive']) r[k] = !!r[k];
    r.xp /= 31; r.hp /= 63;
    r.weapons = {}; r.evo = {}; r.passives = {}; r.boost = {};
    const hasW = RC_WEAPONS.filter(() => get(1)); for (const id of hasW) { const l = get(3); if (l > 5) return null; r.weapons[id] = l || 5; if (!l) r.evo[id] = true; }
    const hasP = RC_PASSIVES.filter(() => get(1)); for (const id of hasP) { const l = get(2); if (!l) return null; r.passives[id] = l; }
    const hasB = RC_BOOSTS.filter(() => get(1)); for (const id of hasB) { const l = get(8); if (!l) return null; r.boost[id] = l; }
    r.sp = 0; if (r.ver >= 2) { const g = get(7); if (g > 100) return null; r.sp = g / 100; }
    if (pos !== 0) return null;
    return r;
  } catch (e) { return null; }
}
