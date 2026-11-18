// Phase 4 texts (花のチャペル batch): glowsticks, wedding foods, the chapel stage, ring cake. Merged into P2 below.
import { P2 } from './text2.js';
export const P4 = {
  ja: {
    items: {
      cyalume: ['サイリウム', 'パキッと おって ファンに くばる！ ひかる ばしょで 敵に ダメージ'],
      evo_cyalume: ['ミニライブ', 'みんなの サイリウムが 大きく ひかる！ かずも ふえる'],
      rbeef: ['ローストビーフ', 'HP 35 かいふく'], steak: ['ステーキ', 'HP 45 かいふく'],
      nikujaga: ['肉じゃが', 'HP 25 かいふく'], buri: ['ぶり大根', 'HP 25 かいふく'],
      tapi: ['タピオカミルクティー', 'すこしの あいだ スピードアップ'],
      tsand: ['台湾サンドイッチ', 'HP 30 かいふく'], mala: ['麻辣スープ', 'HP 20 かいふく＋すこしの あいだ ほのおの オーラ'],
      aman: ['アニマルまん', 'どうぶつの かたちの まんじゅう。HP 25 かいふく'], xlb: ['焼き小籠包', 'HP 20 かいふく。あつあつ！'], jpai: ['大鶏排', '梅パウダーつき。HP 50 かいふく']
    },
    st: { china: { banner: 'FINAL　中華街', boss: '爆竹ドラゴン', warn: '⚠ 爆竹ドラゴンが おどりだした！', down: 'ドラゴンが おとなしく なった！ おなか いっぱい！', wave: 'ギョーザの大群が きた！' }, chapel: { banner: 'STAGE 8　花のチャペル', boss: '暴走ウェディングベル', warn: '⚠ ウェディングベルが あばれだした！', down: 'ベルが しずかに なった！ おめでとう！', wave: 'ブーケの大群が きた！' } },
    stNight: 'STAGE 7　夜のステージ',
    pick: { tapi: '🧋 タピオカで スピードアップ！', mala: '🌶 麻辣で ほのおの オーラ！', xlb: '🥟 あちちっ！ でも おいしい！' },
    ate: '{n}！ おいしい！', ringTitle: 'リングケーキ！'
  },
  zh: {
    items: {
      cyalume: ['發光棒', '啪地折亮發給粉絲！發光的地方會傷害敵人'],
      evo_cyalume: ['迷你演唱會', '大家的發光棒一起大大發亮！數量也變多'],
      rbeef: ['烤牛肉', '回復 35 HP'], steak: ['牛排', '回復 45 HP'],
      nikujaga: ['馬鈴薯燉肉', '回復 25 HP'], buri: ['鰤魚燉蘿蔔', '回復 25 HP'],
      tapi: ['珍珠奶茶', '短時間移動速度提升'],
      tsand: ['台式三明治', '回復 30 HP'], mala: ['麻辣湯', '回復 20 HP＋短時間火焰光環'],
      aman: ['動物造型包子', '動物造型的包子，回復 25 HP'], xlb: ['煎小籠包', '回復 20 HP，小心燙！'], jpai: ['大雞排', '撒上梅子粉，回復 50 HP']
    },
    st: { china: { banner: 'FINAL　中華街', boss: '爆竹龍', warn: '⚠ 爆竹龍開始跳舞了！', down: '龍安靜下來了！吃得好飽！', wave: '煎餃大軍來了！' }, chapel: { banner: 'STAGE 8　花之教堂', boss: '暴走婚禮鐘', warn: '⚠ 婚禮鐘開始暴走了！', down: '鐘聲安靜下來了！恭喜！', wave: '捧花大軍來了！' } },
    stNight: 'STAGE 7　夜晚的舞台',
    pick: { tapi: '🧋 喝珍奶，速度提升！', mala: '🌶 麻辣湯，火焰光環！', xlb: '🥟 好燙！但是好好吃！' },
    ate: '{n}！好好吃！', ringTitle: '擂台蛋糕！'
  },
  en: {
    items: {
      cyalume: ['Glowsticks', 'Snap them and hand them out! Glowing spots hurt foes'],
      evo_cyalume: ['Mini Live', "Everyone's glowsticks shine big! And there are more"],
      rbeef: ['Roast Beef', 'Heal 35 HP'], steak: ['Steak', 'Heal 45 HP'],
      nikujaga: ['Nikujaga', 'Heal 25 HP'], buri: ['Buri Daikon', 'Heal 25 HP'],
      tapi: ['Tapioca Milk Tea', 'Short speed boost'],
      tsand: ['Taiwanese Sandwich', 'Heal 30 HP'], mala: ['Mala Soup', 'Heal 20 HP + a short fire aura'],
      aman: ['Animal Buns', 'Steamed buns shaped like animals. Heal 25 HP'], xlb: ['Pan-fried Soup Dumplings', 'Heal 20 HP. Hot!'], jpai: ['Giant Fried Chicken', 'With plum powder. Heal 50 HP']
    },
    st: { china: { banner: 'FINAL  Chinatown', boss: 'Firecracker Dragon', warn: '⚠ The firecracker dragon starts to dance!', down: 'The dragon calms down! So full!', wave: 'A dumpling swarm!' }, chapel: { banner: 'STAGE 8  Flower Chapel', boss: 'Runaway Wedding Bell', warn: '⚠ The wedding bell is going wild!', down: 'The bell is quiet! Congratulations!', wave: 'A bouquet swarm!' } },
    stNight: 'STAGE 7  Night Stage',
    pick: { tapi: '🧋 Tapioca speed boost!', mala: '🌶 Mala fire aura!', xlb: '🥟 Hot hot! But tasty!' },
    ate: '{n}! Yum!', ringTitle: 'Ring Cake!'
  }
};
for (const l in P4) {
  const { items, st, stNight, pick, ...rest } = P4[l];
  Object.assign(P2[l].items, items); Object.assign(P2[l].st, st); P2[l].st.night.banner = stNight;
  P2[l].pick = Object.assign({}, P2[l].pick, pick); Object.assign(P2[l], rest);
}
