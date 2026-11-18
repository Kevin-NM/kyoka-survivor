// Phase 6 texts: the seven new weapons and their evolutions, stage pickups, nine stages + the encore loop. Merged into P2.
// Proper nouns without an established translation (亨香組, 鉄の掟, きょん式ハートロック, 千客万来, 熱唱タオル, ...) stay as they are.
import { P2 } from './text2.js';
export const P6 = {
  ja: {
    items: {
      ttable: ['ターンテーブル', 'レコードが とんでいって もどってくる'], evo_ttable: ['ハロウィンDJセット', 'レコード 4まいが まわり、ビートごとに ドーン！'],
      para: ['レースの日傘', 'まわりを まわる 日傘が 敵を おしかえす'], evo_para: ['パリコレの日傘', '日傘が 3本に。ときどき トランプが まいちる'],
      hlock: ['きょん式ハートロック', 'ちかくの 敵を ぎゅっと だきしめて ハート ばくはつ'], evo_hlock: ['ギュッとハートロック', '3たいを いっぺんに。まわりの 敵は くらくら'],
      koma: ['将棋の駒手裏剣', '将棋の こまを まわりに なげる'], evo_koma: ['王手！', '8ほうこうに 駒が とび、敵を おいかける'],
      whis: ['駅長のホイッスル', 'ピーッ！ 前の 敵を ふきとばして おそくする'], evo_whis: ['発車ベル', 'ジリリリ！ まわり ぜんぶに 音の わ'],
      syr: ['ちゅうしゃロケット', '敵を おいかけて ポンッと はじける'], evo_syr: ['千客万来', 'ロケットが 6はつ。はじけると すこし かいふく'],
      chaka: ['チャカ⇄ダンビラ', 'みずでっぽうと ダンビラを かわりばんこに'], evo_chaka: ['くみちょーの本気', 'みずでっぽうと ダンビラを どうじに'],
      crepe: ['クレープ', 'HPが 25 かいふく'], muffin: ['チョコマフィン', 'HPが 20 かいふく'], waffle: ['ワッフル', 'HPが 25 かいふく'], trump: ['トランプ＆ティーカップ', 'ひとやすみ。HPが 30 かいふく'],
      imo: ['おいも', 'HPが 25 かいふく'], miso: ['味噌汁', 'あったまる。HPが 30 かいふく'], cherry: ['さくらんぼ', 'ふたつぶで 2かい かいふく'], senbeiI: ['おせんべい', 'HPが 20 かいふく'],
      okisoba: ['沖縄そば', 'HPが 40 かいふく'], eihireI: ['炙りエイヒレ', 'HPが 30 かいふく'], usamimi: ['うさ耳', 'しばらく あしが はやくなる'], cbelt: ['チャンピオンベルト', 'しばらく むてき'],
      hamcard: ['ハムナンバーカード', 'あつめよう（5まいで いいこと）'], hamcoin: ['ハムコイン', 'いちごコイン +5'], kanzashi: ['町娘のかんざし', 'しばらく こうげき力 アップ'], ekicho: ['駅長帽', 'コインを ぜんぶ すいよせる'],
      kusuri: ['おくすり', 'なにかが おこる…？'], nurse: ['ナースキャップ', 'しばらく HPが すこしずつ かいふく'], kakigori: ['いちごミルクかき氷', 'しばらく 敵が おそくなる'], emono: ['キョウカのエモノ', 'ぶきに エモノの こうかが つく'],
      towel: ['熱唱タオル', 'ふりまわすと 敵が おうえんで とまる'], mission: ['ミッションカード', 'ミッション']
    },
    st: {
      halloween: { banner: 'STAGE 10　ハロウィンDJナイト', boss: 'ウーファーゴーレム', warn: '⚠ ウーファーゴーレムが ビートを きざみだした！', down: 'ゴーレムが しずかに なった！ フロア さいこう！', wave: 'かぼちゃ ダンサーズが きた！' },
      runway: { banner: 'STAGE 11　パリコレ・ランウェイ', boss: 'マスターミシン', warn: '⚠ マスターミシンが ぬいはじめた！', down: 'ミシンが とまった！ ショーは だいせいこう！', wave: 'ピンクッションの むれ！' },
      ring: { banner: 'STAGE 12　両国リング', boss: 'チャンピオン', warn: '⚠ チャンピオンが ロープに とびこんだ！', down: '3カウント！ ベルトは きょんの もの！', wave: 'レフェリーが いっぱい！' },
      dawn: { banner: 'STAGE 13　夜明けの味噌汁', boss: 'ねむねむ大鍋', warn: '⚠ ねむねむ大鍋が ぐつぐつ いいだした！', down: 'お鍋が ひえた！ おはよう！', wave: '眠気ひつじが いっぱい…' },
      cherry: { banner: 'STAGE 14　山形さくらんぼバスツアー', boss: '王将', warn: '⚠ 王将が じんを くんだ！ 金と銀を さきに たおそう', down: '王将を つんだ！ たびは つづく！', wave: '歩兵が すすんでくる！' },
      station: { banner: 'STAGE 15　一日駅長・山口駅', boss: 'くろがね蒸気機関車', warn: '⚠ 蒸気機関車が はいってくる！ 黄色い 線の うちがわへ', down: '機関車が とまった！ 発車 オーライ！', wave: 'きっぷが にげだした！' },
      clinic: { banner: 'STAGE 16　千客万来クリニック', boss: 'おにくのおすしモンスター', warn: '⚠ おにくのおすしモンスターが あらわれた！', down: 'モンスターは おなかいっぱい！ おだいじに！', wave: 'カプセルが ころがってきた！' },
      okinawa: { banner: 'STAGE 17　きょうみお沖縄ミッション', boss: 'でっかいシーサー', warn: '⚠ でっかいシーサーが 2たい！', down: 'シーサーが まもりがみに もどった！', wave: '熱帯魚の むれ！' },
      hq: { banner: 'FINAL　亨香組 本部', boss: '鉄の掟 巻物大魔神', warn: '⚠ 鉄の掟 巻物大魔神が よみあげる！', down: '巻物が まるまった！ 一生家族！', wave: '子分たちが あつまってきた！' },
      road: { banner: '∞　20周年への道', boss: 'アンコールボス', warn: '⚠ アンコールボスが とうじょう！', down: 'ボスを たおした！ ショーは つづく！', wave: 'セットリストの 敵たち！' }
    },
    pick: { usamimi: 'うさ耳！ はやくなった！', cbelt: 'ベルトを まいた！ むてき！', kanzashi: 'かんざし！ こうげき アップ！', ekicho: '駅長帽！ コイン あつまれ！', nurse: 'ナースキャップ！ じわじわ かいふく',
      kakigori: 'かき氷！ 敵が ゆっくりに', towel: '熱唱タオル！ 敵が おうえんで とまった！', hamcoin: 'ハムコイン！', cherry: 'さくらんぼ ふたつぶ！' },
    hamcard: 'ハムナンバーカード {n}/5', hamDone: 'ハムナンバーカード コンプリート！',
    kusuri: ['おくすり：あしが はやくなった！', 'おくすり：からだが あつい！', 'おくすり：バリア！', 'おくすり：げんき いっぱい！'],
    emono: ['エモノ「たこやき」：こうげきが おおきく！', 'エモノ「マイク」：エコーで れんしゃ アップ！', 'エモノ「ねこみみ」：あしが はやい にゃ！'],
    grab: 'つかまれた！ うごいて ぬけだそう！', drowsy: 'ねむい…', thief: '裏切り者に コインを とられた！', flash: 'フラッシュ！', help: '好成員が たすけに きた！',
    rail: '⚠ 黄色い 線の うちがわへ！', guard: '金と銀が 王将を まもっている！', split: 'おすしが わかれた！',
    rules: ['鉄の掟：くみちょーには ていきてきに 焼肉を おごること！', '鉄の掟：むずかしい 漢字には ふりがなを！', '鉄の掟：一生家族！', '鉄の掟：おいしい ものを たべたら ほうこく！'],
    mission: 'ミッション：{s}びょうで {n}たい たおせ！', missionLeft: 'ミッション {k}/{n}（{s}）', missionOk: 'ミッション クリア！ コイン +30', missionNg: 'ミッション しっぱい…',
    era: ['子役スタジオ', 'ラジオブース', 'ユニットのステージ', 'ランウェイ', 'DJクラブ', 'コンサートホール'], eraBanner: '{n}周目　{e}',
    geireki: '芸歴 {y}', geirekiInf: '芸歴 ∞', encore: 'アンコール！', lap: '{n}周目',
    endTitle: '本日の公演は終了しました', endLine: '芸歴 {y} · {n}周目', ragNight: 'ランウェイが よるに なった…',
    pageStage: ['1–10', '11–19'], pageChar: 'ページ {n}'
  },
  zh: {
    items: {
      ttable: ['轉盤', '唱片飛出去再飛回來'], evo_ttable: ['萬聖節DJ組', '4 張唱片繞圈，每段節拍砰一聲！'],
      para: ['蕾絲陽傘', '繞著身邊轉的陽傘把敵人推開'], evo_para: ['巴黎時裝週陽傘', '陽傘變成 3 把，不時撒出撲克牌'],
      hlock: ['きょん式ハートロック', '緊緊抱住附近的敵人，愛心爆炸'], evo_hlock: ['ギュッとハートロック', '一次抱 3 隻，周圍敵人頭暈'],
      koma: ['將棋棋子手裏劍', '向四周丟出將棋棋子'], evo_koma: ['將軍！', '棋子飛向 8 個方向並追蹤敵人'],
      whis: ['站長哨子', '嗶——！吹飛前方敵人並讓它們變慢'], evo_whis: ['發車鈴', '鈴鈴鈴！一整圈的音環'],
      syr: ['針筒火箭', '追蹤敵人然後砰地炸開'], evo_syr: ['千客万来', '火箭 6 發，炸開時回復一點 HP'],
      chaka: ['チャカ⇄ダンビラ', '水槍和ダンビラ輪流使用'], evo_chaka: ['くみちょー認真了', '水槍和ダンビラ同時使用'],
      crepe: ['可麗餅', '回復 25 HP'], muffin: ['巧克力瑪芬', '回復 20 HP'], waffle: ['鬆餅', '回復 25 HP'], trump: ['撲克牌＆茶杯', '休息一下，回復 30 HP'],
      imo: ['地瓜', '回復 25 HP'], miso: ['味噌湯', '暖呼呼，回復 30 HP'], cherry: ['櫻桃', '兩顆，回復兩次'], senbeiI: ['仙貝', '回復 20 HP'],
      okisoba: ['沖繩麵', '回復 40 HP'], eihireI: ['炙烤魟魚鰭', '回復 30 HP'], usamimi: ['兔耳', '一段時間跑得更快'], cbelt: ['冠軍腰帶', '一段時間無敵'],
      hamcard: ['ハムナンバーカード', '收集起來（5 張有好事）'], hamcoin: ['ハムコイン', '草莓幣 +5'], kanzashi: ['町娘髮簪', '一段時間攻擊力提升'], ekicho: ['站長帽', '把硬幣全部吸過來'],
      kusuri: ['藥', '會發生什麼呢…？'], nurse: ['護士帽', '一段時間內慢慢回復 HP'], kakigori: ['草莓牛奶刨冰', '一段時間敵人變慢'], emono: ['キョウカのエモノ', '武器加上エモノ效果'],
      towel: ['熱唱タオル', '揮動後敵人會被應援定住'], mission: ['任務卡', '任務']
    },
    st: {
      halloween: { banner: 'STAGE 10　萬聖節DJ之夜', boss: '重低音魔像', warn: '⚠ 重低音魔像開始打節拍了！', down: '魔像安靜下來了！舞池最棒！', wave: '南瓜舞者來了！' },
      runway: { banner: 'STAGE 11　巴黎時裝週伸展台', boss: '大師縫紉機', warn: '⚠ 大師縫紉機開始縫了！', down: '縫紉機停了！時裝秀大成功！', wave: '針插刺蝟大軍！' },
      ring: { banner: 'STAGE 12　兩國擂台', boss: '冠軍', warn: '⚠ 冠軍衝向圍繩了！', down: '3 秒！腰帶是きょん的！', wave: '好多裁判！' },
      dawn: { banner: 'STAGE 13　黎明的味噌湯', boss: '睏睏大鍋', warn: '⚠ 睏睏大鍋開始咕嘟咕嘟了！', down: '鍋子涼了！早安！', wave: '好多瞌睡羊…' },
      cherry: { banner: 'STAGE 14　山形櫻桃巴士之旅', boss: '王將', warn: '⚠ 王將佈陣了！先打倒金和銀', down: '將死王將！旅程繼續！', wave: '步兵前進中！' },
      station: { banner: 'STAGE 15　一日站長：山口站', boss: '鐵色蒸汽火車', warn: '⚠ 蒸汽火車進站了！請退到黃線後方', down: '火車停了！發車 OK！', wave: '車票逃走了！' },
      clinic: { banner: 'STAGE 16　千客万来診所', boss: '肉壽司怪獸', warn: '⚠ 肉壽司怪獸出現了！', down: '怪獸吃飽了！保重身體！', wave: '膠囊滾過來了！' },
      okinawa: { banner: 'STAGE 17　きょうみお沖繩任務', boss: '巨大風獅爺', warn: '⚠ 兩隻巨大風獅爺！', down: '風獅爺變回守護神了！', wave: '熱帶魚群！' },
      hq: { banner: 'FINAL　亨香組 本部', boss: '鉄の掟 卷軸大魔神', warn: '⚠ 鉄の掟 卷軸大魔神開始宣讀！', down: '卷軸捲起來了！一生家族！', wave: '小弟們集合了！' },
      road: { banner: '∞　通往20週年之路', boss: '安可 Boss', warn: '⚠ 安可 Boss 登場！', down: '打倒 Boss 了！表演繼續！', wave: '歌單上的敵人們！' }
    },
    pick: { usamimi: '兔耳！變快了！', cbelt: '繫上腰帶！無敵！', kanzashi: '髮簪！攻擊提升！', ekicho: '站長帽！硬幣集合！', nurse: '護士帽！慢慢回復',
      kakigori: '刨冰！敵人變慢了', towel: '熱唱タオル！敵人被應援定住了！', hamcoin: 'ハムコイン！', cherry: '兩顆櫻桃！' },
    hamcard: 'ハムナンバーカード {n}/5', hamDone: 'ハムナンバーカード 收集完成！',
    kusuri: ['藥：跑得更快了！', '藥：身體好熱！', '藥：護盾！', '藥：元氣滿滿！'],
    emono: ['エモノ「章魚燒」：攻擊變大了！', 'エモノ「麥克風」：回音讓連射提升！', 'エモノ「貓耳」：跑得好快喵！'],
    grab: '被抓住了！快移動掙脫！', drowsy: '好睏…', thief: '被叛徒偷走硬幣了！', flash: '閃光！', help: '好成員來幫忙了！',
    rail: '⚠ 請退到黃線後方！', guard: '金和銀在保護王將！', split: '壽司分裂了！',
    rules: ['鉄の掟：要定期請くみちょー吃燒肉！', '鉄の掟：難的漢字要標上假名！', '鉄の掟：一生家族！', '鉄の掟：吃到好吃的要回報！'],
    mission: '任務：{s} 秒內打倒 {n} 隻！', missionLeft: '任務 {k}/{n}（{s}）', missionOk: '任務完成！硬幣 +30', missionNg: '任務失敗…',
    era: ['童星攝影棚', '廣播錄音室', '團體的舞台', '伸展台', 'DJ 夜店', '演唱會場'], eraBanner: '第 {n} 輪　{e}',
    geireki: '資歷 {y}', geirekiInf: '資歷 ∞', encore: '安可！', lap: '第 {n} 輪',
    endTitle: '本日的公演已經結束', endLine: '資歷 {y} · 第 {n} 輪', ragNight: '伸展台變成夜晚了…',
    pageStage: ['1–10', '11–19'], pageChar: '第 {n} 頁'
  },
  en: {
    items: {
      ttable: ['Turntable', 'Records fly out and come back'], evo_ttable: ['Halloween DJ Set', 'Four records spin round you, and the beat drops BOOM!'],
      para: ['Lace Parasol', 'A parasol circles you and pushes foes back'], evo_para: ['Runway Parasol', 'Three parasols, and now and then a flurry of cards'],
      hlock: ['きょん式ハートロック', 'Hug a nearby foe tight, then a heart bursts'], evo_hlock: ['ギュッとハートロック', 'Three at once, and the foes around get dizzy'],
      koma: ['Shogi Shuriken', 'Throws shogi pieces all around'], evo_koma: ['Check!', 'Pieces fly 8 ways and chase foes'],
      whis: ["Station Master's Whistle", 'Peep! Blows away foes in front and slows them'], evo_whis: ['Departure Bell', 'Brrring! A ring of sound all around'],
      syr: ['Syringe Rocket', 'Chases a foe and pops'], evo_syr: ['千客万来', 'Six rockets, and each pop heals you a little'],
      chaka: ['チャカ⇄ダンビラ', 'A water pistol and a ダンビラ, in turns'], evo_chaka: ["くみちょー's Real Deal", 'The water pistol and the ダンビラ at once'],
      crepe: ['Crêpe', 'Heals 25 HP'], muffin: ['Choc Muffin', 'Heals 20 HP'], waffle: ['Waffle', 'Heals 25 HP'], trump: ['Cards & Teacup', 'A little break. Heals 30 HP'],
      imo: ['Sweet Potato', 'Heals 25 HP'], miso: ['Miso Soup', 'Warms you up. Heals 30 HP'], cherry: ['Cherries', 'A pair: heals twice'], senbeiI: ['Rice Cracker', 'Heals 20 HP'],
      okisoba: ['Okinawa Soba', 'Heals 40 HP'], eihireI: ['Grilled Ray Fin', 'Heals 30 HP'], usamimi: ['Bunny Ears', 'Faster for a while'], cbelt: ['Champion Belt', 'Invincible for a while'],
      hamcard: ['ハムナンバーカード', 'Collect them (5 is lucky)'], hamcoin: ['ハムコイン', 'Strawberry coins +5'], kanzashi: ['Townsgirl Hairpin', 'More damage for a while'], ekicho: ['Station Cap', 'Pulls in every coin'],
      kusuri: ['Medicine', 'Something will happen…?'], nurse: ['Nurse Cap', 'Slowly heals for a while'], kakigori: ['Strawberry Milk Shaved Ice', 'Foes slow down for a while'], emono: ['キョウカのエモノ', 'Gives your weapons an エモノ effect'],
      towel: ['熱唱タオル', 'Wave it and foes freeze, cheering'], mission: ['Mission Card', 'Mission']
    },
    st: {
      halloween: { banner: 'STAGE 10  Halloween DJ Night', boss: 'Woofer Golem', warn: '⚠ The Woofer Golem drops the beat!', down: 'The golem goes quiet! Best floor ever!', wave: 'Pumpkin dancers!' },
      runway: { banner: 'STAGE 11  Paris Collection Runway', boss: 'Master Sewing Machine', warn: '⚠ The Master Sewing Machine starts stitching!', down: 'The machine stops! The show is a hit!', wave: 'A pincushion swarm!' },
      ring: { banner: 'STAGE 12  Ryogoku Ring', boss: 'The Champion', warn: '⚠ The Champion bounces off the ropes!', down: 'Three count! The belt is Kyon\'s!', wave: 'So many referees!' },
      dawn: { banner: 'STAGE 13  Miso Soup at Dawn', boss: 'Sleepy Big Pot', warn: '⚠ The Sleepy Big Pot starts to bubble!', down: 'The pot cools down! Good morning!', wave: 'So many sleepy sheep…' },
      cherry: { banner: 'STAGE 14  Yamagata Cherry Bus Tour', boss: 'The King', warn: '⚠ The King sets up a formation! Take out the gold and silver first', down: 'Checkmate! The trip goes on!', wave: 'Pawns advancing!' },
      station: { banner: 'STAGE 15  Station Master for a Day', boss: 'Iron Steam Locomotive', warn: '⚠ The locomotive is coming in! Stay behind the yellow line', down: 'The locomotive stops! All clear!', wave: 'The tickets ran away!' },
      clinic: { banner: 'STAGE 16  千客万来 Clinic', boss: 'Meat Sushi Monster', warn: '⚠ The Meat Sushi Monster appears!', down: 'The monster is full! Get well soon!', wave: 'Rolling capsules!' },
      okinawa: { banner: 'STAGE 17  きょうみお Okinawa Mission', boss: 'Giant Shisa', warn: '⚠ Two giant shisa!', down: 'The shisa are guardians again!', wave: 'A school of tropical fish!' },
      hq: { banner: 'FINAL  亨香組 HQ', boss: '鉄の掟 Scroll Demon', warn: '⚠ The 鉄の掟 Scroll Demon reads aloud!', down: 'The scroll rolls up! 一生家族!', wave: 'The henchmen gather!' },
      road: { banner: '∞  Road to the 20th', boss: 'Encore Boss', warn: '⚠ An encore boss takes the stage!', down: 'Boss down! The show goes on!', wave: 'Foes from the setlist!' }
    },
    pick: { usamimi: 'Bunny ears! Faster!', cbelt: 'Belt on! Invincible!', kanzashi: 'Hairpin! More damage!', ekicho: 'Station cap! Coins, come here!', nurse: 'Nurse cap! Healing slowly',
      kakigori: 'Shaved ice! Foes slow down', towel: '熱唱タオル! Foes freeze, cheering!', hamcoin: 'ハムコイン!', cherry: 'Two cherries!' },
    hamcard: 'ハムナンバーカード {n}/5', hamDone: 'ハムナンバーカード complete!',
    kusuri: ['Medicine: faster feet!', 'Medicine: so hot!', 'Medicine: a barrier!', 'Medicine: full of energy!'],
    emono: ['エモノ "takoyaki": bigger attacks!', 'エモノ "mic": the echo speeds you up!', 'エモノ "cat ears": faster, nya!'],
    grab: 'Grabbed! Keep moving to break free!', drowsy: 'So sleepy…', thief: 'A traitor stole your coins!', flash: 'Flash!', help: '好成員 came to help!',
    rail: '⚠ Stay behind the yellow line!', guard: 'Gold and silver guard the King!', split: 'The sushi split!',
    rules: ['鉄の掟: treat the くみちょー to yakiniku regularly!', '鉄の掟: put furigana on hard kanji!', '鉄の掟: 一生家族!', '鉄の掟: report anything tasty you eat!'],
    mission: 'Mission: defeat {n} in {s} s!', missionLeft: 'Mission {k}/{n} ({s})', missionOk: 'Mission clear! Coins +30', missionNg: 'Mission failed…',
    era: ['Child-actor studio', 'Radio booth', 'Unit stage', 'Runway', 'DJ club', 'Concert hall'], eraBanner: 'Lap {n}  {e}',
    geireki: 'Career {y}', geirekiInf: 'Career ∞', encore: 'Encore!', lap: 'Lap {n}',
    endTitle: "Today's show has ended", endLine: 'Career {y} · Lap {n}', ragNight: 'Night falls on the runway…',
    pageStage: ['1–10', '11–19'], pageChar: 'Page {n}'
  }
};
for (const l in P6) {
  const { items, st, pick, ...rest } = P6[l];
  Object.assign(P2[l].items, items); Object.assign(P2[l].st, st); P2[l].pick = Object.assign({}, P2[l].pick, pick); P2[l].p6 = rest;
}
