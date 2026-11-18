// Phase 5 texts: endless power-ups once every slot is maxed, full-slot note, endless threat level and record. Merged into P2 below.
import { P2 } from './text2.js';
export const P5 = {
  ja: {
    items: {
      b_atk: ['こうげき +3%', 'ずっと かさねられる パワーアップ'], b_hp: ['さいだいHP +5', 'ずっと かさねられる。HP も 5 かいふく'],
      b_spd: ['スピード +2%', 'かさねられる（20かいまで）'], b_mag: ['回収はんい +5%', 'かさねられる（20かいまで）'],
      b_cd: ['クールダウン -1%', 'かさねられる（25かいまで）'], b_coin: ['いちごコイン +10', 'その場で コインが ふえる']
    },
    boostTag: 'ずっと', stack: 'いま ×{n}', slotsFull: 'スロット満タン', threat: 'きけん Lv{n}', eliteWave: '⚠ つよい敵の むれが きた！',
    endlessBest: '∞ さいこう {t}', endlessRec: '∞ エンドレス {t}'
  },
  zh: {
    items: {
      b_atk: ['攻擊 +3%', '可以無限疊加的強化'], b_hp: ['最大 HP +5', '可以無限疊加，並回復 5 HP'],
      b_spd: ['速度 +2%', '可疊加（最多 20 次）'], b_mag: ['吸取範圍 +5%', '可疊加（最多 20 次）'],
      b_cd: ['冷卻 -1%', '可疊加（最多 25 次）'], b_coin: ['草莓幣 +10', '馬上拿到草莓幣']
    },
    boostTag: '無限', stack: '目前 ×{n}', slotsFull: '欄位已滿', threat: '危險 Lv{n}', eliteWave: '⚠ 強敵大軍來了！',
    endlessBest: '∞ 最佳 {t}', endlessRec: '∞ 無盡 {t}'
  },
  en: {
    items: {
      b_atk: ['Damage +3%', 'A power-up that stacks forever'], b_hp: ['Max HP +5', 'Stacks forever. Also heals 5 HP'],
      b_spd: ['Speed +2%', 'Stacks (up to 20)'], b_mag: ['Pickup range +5%', 'Stacks (up to 20)'],
      b_cd: ['Cooldowns -1%', 'Stacks (up to 25)'], b_coin: ['Strawberry coins +10', 'Coins right away']
    },
    boostTag: 'STACK', stack: 'Now ×{n}', slotsFull: 'Slots full', threat: 'Threat Lv{n}', eliteWave: '⚠ An elite horde is coming!',
    endlessBest: '∞ Best {t}', endlessRec: '∞ Endless {t}'
  }
};
for (const l in P5) { const { items, ...rest } = P5[l]; Object.assign(P2[l].items, items); Object.assign(P2[l], rest); }
