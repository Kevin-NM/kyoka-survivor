// Phase 3 texts: new weapons/passives/evolutions, strawberry cake pickup, difficulty select, evolution list. Merged into P2 below.
import { P2 } from './text2.js';
export const P3 = {
  ja: {
    items: {
      ham: ['ハムスターボール', 'ころころ ころがって 敵に ぶつかる'], fan: ['おうえんうちわ', 'かぜで 敵を ふきとばす'], guitar: ['ギター', 'ジャーン！ かみなりが おちる'],
      omamori: ['おまもり', 'うける ダメージ ダウン'], gakufu: ['がくふ', '♪の けいけんち アップ'], wasabi: ['安曇野わさび', 'ときどき 2ばいダメージ！'],
      evo_lariat: ['ギガ・ラリアット', 'でっかい わっかで なぎはらう！ 敵は ふらふら'], evo_penlight: ['ペンライトの海', '8本の ペンライトが 2じゅうに まわる！'],
      evo_horse: ['愛馬の大行進', '4ほうこうから うまが かけぬける！'], evo_ham: ['ハムハム大行進', 'ハムスターボールが 6こに！'],
      evo_fan: ['うちわ大旋風', 'ぐるっと 全方向に 大きな かぜ！'], evo_guitar: ['ゴシックロック・ソロ', 'かみなりが 敵から 敵へ つぎつぎ とぶ！'],
    },
    pick: { magI: '🧲 ぜんぶ すいよせ！', bombI: '💣 どかーん！', cakeI: '🍰 いちごケーキ！ HP ぜんかい＆むてき！' },
    heal: ['いちごケーキ', 'HP ぜんかい'], coinBag: ['いちごコインぶくろ', 'いちごコイン +30'],
    diffTitle: 'むずかしさを えらんでね', diffCoin: 'いちごコイン ×{m}', diffBest: 'さいこう {t}', diffNone: 'まだ きろく なし', diffClear: '★ クリア',
    resDiff: '{d}　いちごコイン ×{m}', evoTab: '⭐ しんか', evoRule: 'ぶきを <b>Lv5（MAX）</b>に すると、つぎの レベルアップで しんか できるよ！ パッシブは いらないよ。',
    evoPas: 'パッシブ アイテム', evoSoon: '★ {n}が MAX！ つぎの レベルアップで しんか！', evoHint: 'MAXで しんか', elite: 'つよい',
  },
  zh: {
    items: {
      ham: ['倉鼠滾球', '滾來滾去撞飛敵人'], fan: ['應援扇', '用風把敵人吹走'], guitar: ['吉他', '鏘～！落下閃電'],
      omamori: ['護身符', '受到的傷害減少'], gakufu: ['樂譜', '♪的經驗值增加'], wasabi: ['安曇野山葵', '有時造成 2 倍傷害！'],
      evo_lariat: ['超級金臂勾', '超大圈圈橫掃！敵人頭昏眼花'], evo_penlight: ['螢光棒之海', '8 支螢光棒內外兩圈轉！'],
      evo_horse: ['愛馬大遊行', '馬兒從四個方向奔過來！'], evo_ham: ['倉鼠大遊行', '倉鼠滾球變成 6 顆！'],
      evo_fan: ['應援扇大旋風', '往四面八方吹出大風！'], evo_guitar: ['哥德搖滾獨奏', '閃電在敵人之間連鎖跳躍！'],
    },
    pick: { magI: '🧲 全部吸過來！', bombI: '💣 轟隆！', cakeI: '🍰 草莓蛋糕！HP 全滿＋短暫無敵！' },
    heal: ['草莓蛋糕', 'HP 全回復'], coinBag: ['草莓幣袋', '草莓幣 +30'],
    diffTitle: '選擇難度', diffCoin: '草莓幣 ×{m}', diffBest: '最佳 {t}', diffNone: '還沒有紀錄', diffClear: '★ 已過關',
    resDiff: '{d}　草莓幣 ×{m}', evoTab: '⭐ 進化', evoRule: '把武器升到 <b>Lv5（MAX）</b>，下一次升級就能進化！不需要被動道具。',
    evoPas: '被動道具', evoSoon: '★ {n} 滿級了！下次升級就能進化！', evoHint: '滿級可進化', elite: '強敵',
  },
  en: {
    items: {
      ham: ['Hamster Ball', 'Rolls around and bumps into foes'], fan: ['Cheer Fan', 'Blows foes away with a gust'], guitar: ['Guitar', 'Strum! Lightning strikes foes'],
      omamori: ['Lucky Charm', 'Take less damage'], gakufu: ['Sheet Music', 'More XP from ♪'], wasabi: ['Azumino Wasabi', 'Sometimes deals double damage!'],
      evo_lariat: ['Giga Lariat', 'A huge sweeping ring that dizzies foes!'], evo_penlight: ['Sea of Penlights', '8 penlights spin in two rings!'],
      evo_horse: ['Grand Stampede', 'Horses charge in from 4 sides!'], evo_ham: ['Hamster Parade', 'Six hamster balls!'],
      evo_fan: ['Fan Whirlwind', 'A huge gust in every direction!'], evo_guitar: ['Gothic Rock Solo', 'Lightning chains from foe to foe!'],
    },
    pick: { magI: '🧲 Everything comes to you!', bombI: '💣 KABOOM!', cakeI: '🍰 Strawberry cake! Full HP + shield!' },
    heal: ['Strawberry Cake', 'Full HP'], coinBag: ['Strawberry Coin Bag', '+30 Strawberry Coins'],
    diffTitle: 'Choose difficulty', diffCoin: 'Coins ×{m}', diffBest: 'Best {t}', diffNone: 'No record yet', diffClear: '★ Cleared',
    resDiff: '{d} · Coins ×{m}', evoTab: '⭐ Evolutions', evoRule: 'Get a weapon to <b>Lv5 (MAX)</b> and it can evolve at the next level-up. No passive item needed!',
    evoPas: 'Passive items', evoSoon: '★ {n} is MAX! It evolves at the next level-up!', evoHint: 'Evolves at MAX', elite: 'Elite',
  }
};
for (const l in P3) { const { items, ...rest } = P3[l]; Object.assign(P2[l].items, items); Object.assign(P2[l], rest); }
