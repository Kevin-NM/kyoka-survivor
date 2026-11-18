// Phase 6 stage data: foes, bosses, enemy mixes, looks, props and pickups for the nine new stages
// and the encore loop. Pure data; the behaviour lives in main.js (see "phase 6").
const L = (amb, fog, fogMax, sat, vig, bloom, shadow, extra) => Object.assign({ amb, fog, fogMax, pool: [0.05, 0.04, 0.03], gain: [1.02, 1, 0.98], lift: [0.03, 0.02, 0.05], sat, vig, bloom, shadow }, extra || {});
// ground / look index -> look
export const LOOKS6 = {
  9: L([0.84, 0.76, 1.0], [0.16, 0.06, 0.24], 0.5, 1.22, 0.72, 0.95, [0.04, 0.0, 0.1, 0.55], { gain: [1.0, 0.92, 1.06], lift: [0.05, 0.02, 0.09] }),
  10: L([1.06, 1.0, 1.02], [0.96, 0.84, 0.9], 0.34, 1.12, 0.46, 0.62, [0.16, 0.06, 0.16, 0.38]),
  21: L([0.82, 0.76, 0.96], [0.18, 0.08, 0.2], 0.48, 1.18, 0.72, 0.9, [0.06, 0.0, 0.08, 0.55], { gain: [1.0, 0.92, 1.04] }),
  11: L([1.02, 1.0, 1.04], [0.62, 0.66, 0.8], 0.36, 1.08, 0.62, 0.7, [0.06, 0.06, 0.16, 0.45]),
  12: L([0.78, 0.8, 1.0], [0.1, 0.1, 0.26], 0.5, 1.05, 0.7, 0.75, [0.02, 0.02, 0.12, 0.5], { gain: [0.96, 0.96, 1.06] }),
  13: L([1.06, 1.02, 0.94], [0.74, 0.84, 0.72], 0.34, 1.16, 0.5, 0.55, [0.1, 0.06, 0.12, 0.42]),
  14: L([1.08, 0.96, 0.86], [0.9, 0.66, 0.5], 0.4, 1.14, 0.6, 0.65, [0.2, 0.08, 0.06, 0.45]),
  15: L([0.86, 0.94, 0.98], [0.1, 0.18, 0.2], 0.48, 1.08, 0.72, 0.85, [0.0, 0.04, 0.08, 0.52], { gain: [0.96, 1.0, 1.02] }),
  16: L([1.08, 1.04, 0.96], [0.66, 0.86, 0.92], 0.3, 1.22, 0.44, 0.6, [0.06, 0.1, 0.16, 0.4]),
  17: L([0.98, 0.86, 0.74], [0.3, 0.16, 0.1], 0.46, 1.1, 0.7, 0.8, [0.12, 0.04, 0.02, 0.5], { gain: [1.04, 0.96, 0.9] }),
  18: L([0.98, 0.98, 1.02], [0.5, 0.52, 0.6], 0.38, 1.0, 0.6, 0.7, [0.08, 0.08, 0.14, 0.45]),
  19: L([0.98, 0.84, 0.86], [0.3, 0.1, 0.14], 0.46, 1.1, 0.7, 0.8, [0.1, 0.02, 0.06, 0.5]),
  20: L([1.08, 0.98, 0.86], [0.5, 0.32, 0.18], 0.42, 1.15, 0.62, 0.85, [0.16, 0.06, 0.04, 0.45])
};
// the dawn stage brightens to this look over the run
export const SUNRISE = L([1.1, 0.98, 0.9], [0.98, 0.74, 0.6], 0.36, 1.16, 0.5, 0.75, [0.2, 0.08, 0.1, 0.4], { gain: [1.06, 1.0, 0.94] });
// props per ground index: (h, h2) -> [sprite, shadow] or null
const v2 = (n, h2) => n + ((h2 * 2) | 0);
export const PROPS6 = {
  9: (h, h2) => h < 0.007 ? ['spkwall', 1] : h < 0.02 ? ['jack', 1] : h < 0.03 ? ['laser', 1] : null,
  10: (h, h2) => h < 0.008 ? ['mirror', 1] : h < 0.016 ? ['rack', 1] : h < 0.024 ? ['teatable', 1] : h < 0.03 ? ['spot', 1] : null,
  21: (h, h2) => h < 0.008 ? ['mirror', 1] : h < 0.016 ? ['rack', 1] : h < 0.026 ? ['spot', 1] : null,
  11: (h, h2) => h < 0.007 ? ['ropepost', 1] : h < 0.012 ? ['desk', 1] : h < 0.026 ? ['chairp', 1] : null,
  12: (h, h2) => h < 0.008 ? ['clockp', 1] : h < 0.022 ? ['cushion', 0.6] : h < 0.03 ? ['lampp', 1] : null,
  13: (h, h2) => h < 0.016 ? [v2('ctree', h2), 1] : h < 0.02 ? ['onsen', 0.6] : h < 0.024 ? ['torii', 1] : h < 0.03 ? ['shogiban', 1] : h < 0.2 ? ['tuft' + ((h2 * 4) | 0), 0.6] : null,
  14: (h, h2) => h < 0.01 ? [v2('momiji', h2), 1] : h < 0.016 ? ['stbench', 1] : h < 0.021 ? ['stsign', 1] : h < 0.026 ? ['gatep', 1] : null,
  15: (h, h2) => h < 0.008 ? ['bed', 1] : h < 0.014 ? ['ampst', 1] : h < 0.022 ? ['curtain', 1] : null,
  16: (h, h2) => h < 0.012 ? ['palm', 1] : h < 0.024 ? ['hibis', 1] : h < 0.029 ? ['shisap', 1] : h < 0.033 ? ['tank', 1] : null,
  17: (h, h2) => h < 0.01 ? [v2('fusuma', h2), 1] : h < 0.017 ? ['toro', 1] : h < 0.021 ? ['scrollp', 1] : h < 0.027 ? ['bonsai', 1] : null,
  18: (h, h2) => h < 0.008 ? ['camera', 1] : h < 0.016 ? ['clap', 0.6] : h < 0.022 ? ['spot', 1] : null,
  19: (h, h2) => h < 0.01 ? ['rmic', 1] : h < 0.016 ? ['onair', 1] : null,
  20: (h, h2) => h < 0.006 ? ['piano', 1] : h < 0.014 ? ['amp', 1] : h < 0.02 ? ['towelp', 1] : h < 0.026 ? ['stlight', 1] : null
};
// foes. zig: weaves; fly: no ground shadow; heavy late foes are like the bear (hp 140)
export const ETYPES6 = {
  pumpk: { hp: 14, spd: 32, dmg: 5, r: 8, xp: 1 }, kuroneko: { hp: 11, spd: 50, dmg: 4, r: 7, xp: 1, zig: 1 }, zdance: { hp: 46, spd: 22, dmg: 9, r: 8, xp: 4, zig: 1 }, disco: { hp: 140, spd: 20, dmg: 12, r: 11, xp: 8 },
  pinh: { hp: 14, spd: 32, dmg: 5, r: 8, xp: 1 }, flashb: { hp: 11, spd: 46, dmg: 4, r: 7, xp: 1, zig: 1, fly: 1 }, fabric: { hp: 46, spd: 24, dmg: 9, r: 8, xp: 4 }, manq: { hp: 140, spd: 20, dmg: 12, r: 11, xp: 8 },
  referee: { hp: 14, spd: 33, dmg: 5, r: 8, xp: 1, zig: 1 }, flyer: { hp: 12, spd: 44, dmg: 4, r: 7, xp: 1 }, chairf: { hp: 46, spd: 22, dmg: 9, r: 8, xp: 4 }, masked: { hp: 140, spd: 20, dmg: 12, r: 11, xp: 8, grab: 1 },
  hitsuji: { hp: 14, spd: 30, dmg: 4, r: 8, xp: 1, drowsy: 1 }, alarm: { hp: 11, spd: 48, dmg: 4, r: 7, xp: 1, zig: 1 }, akubi: { hp: 46, spd: 22, dmg: 9, r: 8, xp: 4 }, ramen: { hp: 140, spd: 20, dmg: 12, r: 11, xp: 8 },
  fu: { hp: 14, spd: 36, dmg: 5, r: 8, xp: 1, march: 1 }, keima: { hp: 12, spd: 46, dmg: 4, r: 8, xp: 1, hop: 1 }, amenbo: { hp: 40, spd: 30, dmg: 8, r: 8, xp: 3, zig: 1 }, senbei: { hp: 13, spd: 38, dmg: 5, r: 8, xp: 1 }, kaku: { hp: 140, spd: 24, dmg: 12, r: 11, xp: 8, diag: 1 },
  kin: { hp: 260, spd: 30, dmg: 10, r: 10, xp: 6, guard: 1 }, gin: { hp: 260, spd: 30, dmg: 10, r: 10, xp: 6, guard: 1 },
  kippu: { hp: 13, spd: 34, dmg: 5, r: 7, xp: 1, zig: 1 }, hato: { hp: 11, spd: 50, dmg: 4, r: 7, xp: 1, fly: 1 }, suitcase: { hp: 46, spd: 22, dmg: 9, r: 8, xp: 4 }, gate: { hp: 140, spd: 20, dmg: 12, r: 11, xp: 8 },
  capsule: { hp: 14, spd: 32, dmg: 5, r: 7, xp: 1 }, syringe: { hp: 11, spd: 40, dmg: 4, r: 7, xp: 1, dash: 1 }, clip: { hp: 46, spd: 22, dmg: 9, r: 8, xp: 4, zig: 1 }, tenteki: { hp: 140, spd: 20, dmg: 12, r: 11, xp: 8 },
  sushi: { hp: 30, spd: 40, dmg: 6, r: 7, xp: 2 },
  tfish: { hp: 13, spd: 36, dmg: 5, r: 7, xp: 1, zig: 1 }, ka: { hp: 9, spd: 52, dmg: 4, r: 6, xp: 1, zig: 1, fly: 1 }, taifu: { hp: 46, spd: 22, dmg: 9, r: 9, xp: 4, fly: 1, wind: 1 }, yashigani: { hp: 140, spd: 20, dmg: 12, r: 11, xp: 8 },
  kobun: { hp: 14, spd: 33, dmg: 5, r: 8, xp: 1 }, eihire: { hp: 12, spd: 48, dmg: 4, r: 7, xp: 1 }, uragiri: { hp: 46, spd: 26, dmg: 8, r: 8, xp: 4, thief: 1 }, daruma: { hp: 140, spd: 20, dmg: 12, r: 11, xp: 8, sturdy: 1 },
  woofer: { hp: 2700, spd: 24, dmg: 14, r: 26, xp: 0, boss: true }, msew: { hp: 2700, spd: 24, dmg: 14, r: 26, xp: 0, boss: true }, champ: { hp: 2700, spd: 28, dmg: 14, r: 24, xp: 0, boss: true },
  nabe: { hp: 2700, spd: 22, dmg: 14, r: 26, xp: 0, boss: true }, oushou: { hp: 2500, spd: 24, dmg: 14, r: 22, xp: 0, boss: true }, loco: { hp: 2700, spd: 26, dmg: 15, r: 26, xp: 0, boss: true },
  sushim: { hp: 2700, spd: 24, dmg: 14, r: 26, xp: 0, boss: true }, shisaA: { hp: 1500, spd: 24, dmg: 14, r: 24, xp: 0, boss: true }, shisaB: { hp: 1500, spd: 22, dmg: 14, r: 24, xp: 0, boss: true },
  scroll: { hp: 2800, spd: 22, dmg: 14, r: 24, xp: 0, boss: true }
};
// the usual shape of a stage: A from the start, B from 0:25, C from 1:00, D (heavy) late; an extra from 0:40 where the doc lists five foes
const mix = (A, B, C, D, X) => t => [[A, 3], [B, t > 25 ? 2.2 : 0], [C, t > 60 ? 1.6 : 0], [D, t > 190 ? 0.65 : 0], ...(X ? [[X, t > 40 ? 1.2 : 0]] : [])];
export const SDEF6 = {
  halloween: { g: 9, song: 'club', boss: 'woofer', summon: 'pumpk', waves: ['pumpk', 'kuroneko', 'zdance'], mix: mix('pumpk', 'kuroneko', 'zdance', 'disco') },
  runway: { g: 10, song: 'runway', boss: 'msew', summon: 'pinh', waves: ['pinh', 'flashb', 'fabric'], mix: mix('pinh', 'flashb', 'fabric', 'manq'), night: 21 },
  ring: { g: 11, song: 'ring', boss: 'champ', summon: 'referee', waves: ['referee', 'flyer', 'chairf'], mix: mix('referee', 'flyer', 'chairf', 'masked') },
  dawn: { g: 12, song: 'dawn', boss: 'nabe', summon: 'hitsuji', waves: ['hitsuji', 'alarm', 'akubi'], mix: mix('hitsuji', 'alarm', 'akubi', 'ramen') },
  cherry: { g: 13, song: 'cherry', boss: 'oushou', summon: 'fu', waves: ['fu', 'keima', 'fu'], mix: mix('fu', 'keima', 'amenbo', 'kaku', 'senbei') },
  station: { g: 14, song: 'station', boss: 'loco', summon: 'kippu', waves: ['kippu', 'hato', 'suitcase'], mix: mix('kippu', 'hato', 'suitcase', 'gate') },
  clinic: { g: 15, song: 'clinic', boss: 'sushim', summon: 'capsule', waves: ['capsule', 'syringe', 'clip'], mix: mix('capsule', 'syringe', 'clip', 'tenteki') },
  okinawa: { g: 16, song: 'okinawa', boss: 'shisaA', summon: 'tfish', waves: ['tfish', 'ka', 'tfish'], mix: mix('tfish', 'ka', 'taifu', 'yashigani') },
  hq: { g: 17, song: 'hq', boss: 'scroll', summon: 'kobun', waves: ['kobun', 'eihire', 'uragiri'], mix: mix('kobun', 'eihire', 'uragiri', 'daruma') },
  road: { g: 18, song: 'encore', boss: 'woofer', summon: 'pumpk', waves: ['onpu', 'pumpk', 'kobun'], mix: t => ERAS[0].mix(t), loop: true }
};
// encore loop eras (ERA_T = 3 minutes each, see main.js): ground, song, foes (a "setlist" of earlier stages) and the boss pool
export const ERAS = [
  { g: 18, song: 'encore', mix: mix('cater', 'crow', 'stink', 'kuma'), boss: ['boss', 'mokuba'] },
  { g: 19, song: 'cage', mix: mix('dust', 'bat', 'paper', 'mole'), boss: ['wheel', 'bmole'] },
  { g: 6, song: 'night', mix: mix('onpu', 'bat', 'spk', 'kuma'), boss: ['bigspk', 'bell'] },
  { g: 10, song: 'runway', mix: mix('pinh', 'flashb', 'fabric', 'manq'), boss: ['msew', 'champ'] },
  { g: 9, song: 'club', mix: mix('pumpk', 'kuroneko', 'zdance', 'disco'), boss: ['woofer', 'cdragon'] },
  { g: 20, song: 'encore', mix: mix('tulip', 'heartb', 'bouq', 'daruma'), boss: ['scroll', 'zou'] }
];
export const PART_COL6 = {
  pumpk: [0xe87a1a, 0x4a7a2a, 0xffe060], kuroneko: [0x2a2632, 0xffe040, 0xffffff], zdance: [0x8ac88a, 0x6a3a8a, 0xffd040], disco: [0xd8e0f0, 0xffffff, 0x8a94b8],
  pinh: [0xc8283a, 0xffd040, 0xffffff], flashb: [0xffffff, 0x3a6ad0, 0x2a2632], fabric: [0xff7eb6, 0xfff0f6, 0xc8a0e8], manq: [0xe8dcc8, 0xff9ac0, 0xffffff],
  referee: [0xffffff, 0x1a1626, 0xf0c8a0], flyer: [0xffd040, 0xe8394f, 0xffffff], chairf: [0xa8acb8, 0xffffff, 0x6a6e7a], masked: [0x3a6ad0, 0xffffff, 0xe8394f],
  hitsuji: [0xffffff, 0xf0eef8, 0x6ec3ff], alarm: [0x3a7ae0, 0xffd040, 0xffffff], akubi: [0x9a7ad8, 0xffffff, 0xff9ab0], ramen: [0xe8303a, 0xfff0b0, 0xffffff],
  fu: [0xd8b078, 0xfff0d0, 0x1a1210], keima: [0xd8b078, 0xfff0d0, 0x1a1210], kaku: [0xd8b078, 0xfff0d0, 0x1a1210], kin: [0xe8c08a, 0xffd040, 0x8a1420], gin: [0xe8c08a, 0xc8d0e0, 0x1a1210], amenbo: [0x8ad0f0, 0x5a4a3a, 0xffffff], senbei: [0xd8a050, 0x1a2a1a, 0xffffff],
  kippu: [0xfff4d0, 0xd8a810, 0xffffff], hato: [0x8a8ea8, 0x5ab87a, 0xffffff], suitcase: [0x2a8a8a, 0xffd040, 0xffffff], gate: [0xb8bcc8, 0xe8394f, 0x3ab85a],
  capsule: [0xff5a7a, 0xfff4f8, 0xffffff], syringe: [0xd8eef8, 0xff7eb6, 0xffffff], clip: [0xb8865a, 0xffffff, 0x8ab8d8], tenteki: [0xc8f0f8, 0xa8acb8, 0xffffff], sushi: [0xd85a4a, 0xffffff, 0x1a3a1a],
  tfish: [0xffa020, 0xffffff, 0x1a1626], ka: [0x5a5a6a, 0xd8f0ff, 0xffffff], taifu: [0x9aaac8, 0xffffff, 0x3a4a6a], yashigani: [0x8a3aa8, 0xd84a3a, 0xffffff],
  kobun: [0x3a3a5a, 0xf0c8a0, 0xffffff], eihire: [0xe8b060, 0xa86a2a, 0xffffff], uragiri: [0x2a2a3a, 0xe8394f, 0xffffff], daruma: [0xd8203a, 0xfff4e8, 0xffd040],
  woofer: [0x8a3ad8, 0xffd040, 0xffffff], msew: [0xff7eb6, 0xffffff, 0xffd040], champ: [0xffd040, 0xd8303a, 0xffffff], nabe: [0xd8a040, 0xffffff, 0x6ec3ff], oushou: [0xd8a868, 0xffd040, 0x1a1210],
  loco: [0x3a3644, 0xffd040, 0xffffff], sushim: [0xd85a4a, 0xffffff, 0x1a3a1a], shisaA: [0xd8884a, 0xffffff, 0x8a4a1a], shisaB: [0xc8783a, 0xffffff, 0x8a4a1a], scroll: [0xfff4dc, 0xd8303a, 0x1a1210]
};
export const LIFT6 = {
  pumpk: (t, e) => Math.abs(Math.sin(t * 6 + e.ph)) * 4, disco: (t, e) => 10 + Math.sin(t * 2 + e.ph) * 2, flashb: (t, e) => 8 + Math.sin(t * 5 + e.ph) * 2, flyer: (t, e) => Math.abs(Math.sin(t * 4 + e.ph)) * 10,
  chairf: (t, e) => 5 + Math.sin(t * 6 + e.ph) * 3, keima: (t, e) => e.hopH || 0, hato: (t, e) => 9 + Math.sin(t * 6 + e.ph) * 2, ka: (t, e) => 10 + Math.sin(t * 9 + e.ph) * 2, taifu: (t, e) => 9 + Math.sin(t * 2 + e.ph) * 3,
  tfish: (t, e) => 4 + Math.sin(t * 4 + e.ph) * 2, capsule: (t, e) => Math.abs(Math.sin(t * 7 + e.ph)) * 5, sushi: (t, e) => Math.abs(Math.sin(t * 7 + e.ph)) * 3,
  oushou: (t, e) => 4 + Math.sin(t * 2) * 2, scroll: (t, e) => 8 + Math.sin(t * 2) * 3, msew: () => 0, loco: () => 0
};
// stage pickups dropped instead of the old food list (same drop chance); effects are in main.js
export const STAGE_FOODS = {
  halloween: ['crepe', 'muffin', 'usamimi'], runway: ['trump', 'waffle', 'crepe'], ring: ['cbelt', 'imo', 'muffin'], dawn: ['miso', 'hamcard', 'hamcoin'],
  cherry: ['cherry', 'senbeiI', 'kanzashi'], station: ['ekicho', 'imo', 'senbeiI'], clinic: ['kusuri', 'nurse', 'muffin'], okinawa: ['okisoba', 'kakigori', 'imo'], hq: ['eihireI', 'emono', 'imo'],
  road: ['miso', 'okisoba', 'cherry', 'crepe', 'waffle', 'eihireI', 'kusuri', 'kakigori']
};
export const FOOD_HP6 = { crepe: 25, muffin: 20, waffle: 25, trump: 30, imo: 25, miso: 30, cherry: 20, senbeiI: 20, okisoba: 40, eihireI: 30 };
export const ITEM_GLOW6 = { crepe: [1, 0.85, 0.6], muffin: [1, 0.6, 0.75], waffle: [1, 0.8, 0.4], trump: [1, 0.7, 0.8], imo: [0.9, 0.5, 0.8], miso: [1, 0.75, 0.4], cherry: [1, 0.35, 0.4], senbeiI: [1, 0.75, 0.4],
  okisoba: [0.5, 0.7, 1], eihireI: [1, 0.75, 0.4], usamimi: [1, 0.6, 0.8], cbelt: [1, 0.85, 0.3], hamcard: [1, 0.6, 0.8], hamcoin: [1, 0.85, 0.3], kanzashi: [1, 0.6, 0.8], ekicho: [0.5, 0.6, 1],
  kusuri: [0.5, 0.8, 1], nurse: [1, 0.7, 0.85], kakigori: [0.6, 0.9, 1], emono: [1, 0.4, 0.4], towel: [1, 0.5, 0.8], mission: [0.5, 0.8, 1] };
// stage-select thumbnails
export const THUMB6 = { halloween: [9, ['jack', 'pumpk0', 'woofer0']], runway: [10, ['mirror', 'manq0', 'msew0']], ring: [11, ['ropepost', 'masked0', 'champ0']], dawn: [12, ['clockp', 'hitsuji0', 'nabe0']],
  cherry: [13, ['ctree0', 'fu0', 'oushou0']], station: [14, ['momiji0', 'kippu0', 'loco0']], clinic: [15, ['bed', 'syringe0', 'sushim0']], okinawa: [16, ['palm', 'tfish0', 'shisaA0']], hq: [17, ['fusuma0', 'daruma0', 'scroll0']], road: [20, ['towelp', 'onpu0', 'piano']] };
