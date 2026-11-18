// Texts for the shop, select, zukan and result screens (ja default, zh-TW, en).
export const META_T = {
  ja: {
    shopBtn: '🐹 おみせ', zukanBtn: '📒 ずかん', coins: 'いちごコイン', coinRec: '🍓コイン {n}',
    selTitle: 'だれと どこへ いく？', selChar: 'キャラクター', selStage: 'ステージ', go: 'しゅっぱつ！', back: 'もどる', locked: '？？？',
    lockHint: '🔒 じっせき「{a}」で でてくるよ',
    shopTitle: 'ハムスターの おみせ', hello: 'いらっしゃい！🐹<br>いちごコインで ずっと つよくなれるよ', thanks: 'まいど ありがとう！🐹',
    worried: 'しゃっきん 🍓{d}…💦<br>つぎに あそんだ コインで かえしてね', lent: 'かしたよ…💦<br>あそんで もらった コインから かえしてね',
    tooMuch: 'ごめんね、これいじょうは かせないよ〜<br>（しゃっきんは 🍓{m} まで）', maxed: 'それは もう MAX だよ！',
    buy: 'かう', borrowBuy: 'かりて かう', max: 'MAX', debt: 'しゃっきん', wallet: 'もっている コイン',
    borrowTitle: 'コインが たりないよ', borrowMsg: 'あと 🍓{n} たりないよ。<br>かりて かう？<br><small>つぎから もらう コインで じどうで かえすよ</small>', borrowYes: 'かりて かう', borrowNo: 'やめる',
    zkTitle: 'きょん図鑑', zkTab: '📒 ずかん', achTab: '🏆 じっせき', source: '出典：', zkLocked: '🔒 まだ ひみつ', zkHintUp: '🔒 おみせで「{u}」を かうと よめるよ', zkHintAch: '🔒 じっせき「{a}」で よめるよ', zkHintPlay: '🔒 1回 あそぶと よめるよ',
    unlockChar: '→ キャラ「{n}」', unlockStage: '→ ステージ「{n}」', unlockEndless: '→ むげんモード', done: 'たっせい！',
    achGet: '🏆 じっせき：{a}', newUnlock: '🎁 あたらしく つかえる：{n}', newAch: 'あたらしい じっせき',
    earned: '🍓 +{n} いちごコイン', repaid: 'しゃっきん へんさい −{r}（のこり {d}）', paidOff: '完済！🎉 しゃっきん ゼロ！', total: 'いま {n} コイン',
    endlessBtn: '∞ むげんモードで つづける', endlessBest: 'むげんモード {t}'
  },
  zh: {
    shopBtn: '🐹 商店', zukanBtn: '📒 圖鑑', coins: '草莓幣', coinRec: '🍓 草莓幣 {n}',
    selTitle: '要和誰去哪裡？', selChar: '角色', selStage: '關卡', go: '出發！', back: '返回', locked: '？？？',
    lockHint: '🔒 達成成就「{a}」就會出現',
    shopTitle: '倉鼠的商店', hello: '歡迎光臨！🐹<br>用草莓幣可以永久變強喔', thanks: '謝謝惠顧！🐹',
    worried: '欠債 🍓{d}…💦<br>下次玩拿到的幣要還喔', lent: '借給妳了…💦<br>之後玩拿到的幣會拿來還',
    tooMuch: '抱歉，不能再借了～<br>（最多只能欠 🍓{m}）', maxed: '這個已經 MAX 了！',
    buy: '購買', borrowBuy: '借錢買', max: 'MAX', debt: '欠債', wallet: '持有草莓幣',
    borrowTitle: '草莓幣不夠喔', borrowMsg: '還差 🍓{n}。<br>要借錢買嗎？<br><small>之後拿到的幣會自動拿來還</small>', borrowYes: '借錢買', borrowNo: '不要',
    zkTitle: 'きょん圖鑑', zkTab: '📒 圖鑑', achTab: '🏆 成就', source: '出處：', zkLocked: '🔒 還是祕密', zkHintUp: '🔒 在商店買「{u}」就能看', zkHintAch: '🔒 達成成就「{a}」就能看', zkHintPlay: '🔒 玩一次就能看',
    unlockChar: '→ 角色「{n}」', unlockStage: '→ 關卡「{n}」', unlockEndless: '→ 無盡模式', done: '達成！',
    achGet: '🏆 成就：{a}', newUnlock: '🎁 新解鎖：{n}', newAch: '新成就',
    earned: '🍓 +{n} 草莓幣', repaid: '還債 −{r}（還欠 {d}）', paidOff: '還清了！🎉 欠債歸零！', total: '現在有 {n} 草莓幣',
    endlessBtn: '∞ 用無盡模式繼續', endlessBest: '無盡模式 {t}'
  },
  en: {
    shopBtn: '🐹 Shop', zukanBtn: '📒 Kyon Book', coins: 'Strawberry Coins', coinRec: '🍓 {n} coins',
    selTitle: 'Who and where?', selChar: 'Character', selStage: 'Stage', go: 'Let\'s go!', back: 'Back', locked: '???',
    lockHint: '🔒 Appears after "{a}"',
    shopTitle: 'Hamster Shop', hello: 'Welcome! 🐹<br>Strawberry Coins make you stronger for good', thanks: 'Thank you! 🐹',
    worried: 'You owe 🍓{d}… 💦<br>Coins from your next runs pay it back', lent: 'Lent you the coins… 💦<br>Coins you earn will pay it back',
    tooMuch: 'Sorry, I can\'t lend more~<br>(debt limit is 🍓{m})', maxed: 'That one is already MAX!',
    buy: 'Buy', borrowBuy: 'Borrow & buy', max: 'MAX', debt: 'Debt', wallet: 'Your coins',
    borrowTitle: 'Not enough coins', borrowMsg: 'You are 🍓{n} short.<br>Borrow and buy?<br><small>Coins you earn later pay it back automatically</small>', borrowYes: 'Borrow & buy', borrowNo: 'No thanks',
    zkTitle: 'Kyon Book', zkTab: '📒 Book', achTab: '🏆 Goals', source: 'Source: ', zkLocked: '🔒 Still a secret', zkHintUp: '🔒 Buy "{u}" in the shop to read', zkHintAch: '🔒 Complete "{a}" to read', zkHintPlay: '🔒 Play once to read',
    unlockChar: '→ Character "{n}"', unlockStage: '→ Stage "{n}"', unlockEndless: '→ Endless mode', done: 'Done!',
    achGet: '🏆 Goal: {a}', newUnlock: '🎁 New: {n}', newAch: 'New goals',
    earned: '🍓 +{n} Strawberry Coins', repaid: 'Debt repaid −{r} ({d} left)', paidOff: 'Debt-free! 🎉', total: 'Now {n} coins',
    endlessBtn: '∞ Keep going (endless)', endlessBest: 'Endless {t}'
  }
};
