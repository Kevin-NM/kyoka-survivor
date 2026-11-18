// Phase 6 meta data: nine more stages + the encore loop, eight characters, achievements and 30 more きょん図鑑 entries.
// Facts are about Kyon herself only (public posts and pages). Other people, shops and brands are never named;
// sources are given as generic kinds ("her post", "event page"). Merged into meta.js.
const SRC = { post: ['本人の投稿', '本人貼文', 'Her post'], event: ['イベントの案内', '活動公告', 'Event page'], news: ['ニュース記事', '新聞報導', 'News article'], show: ['番組ページ', '節目頁面', 'Show page'], wiki: ['プロフィール事典', '個人資料百科', 'Profile encyclopedia'], mag: ['雑誌インタビュー', '雜誌訪談', 'Magazine interview'], tour: ['ツアーの行程', '旅行行程', 'Tour itinerary'] };
const z = (id, icon, need, src, ja, zh, en) => ({ id, icon, need, ja: [...ja, SRC[src][0]], zh: [...zh, SRC[src][1]], en: [...en, SRC[src][2]] });

export const STAGES6 = {
  halloween: { ja: ['ハロウィンDJナイト', 'レーザーと かぼちゃの クラブ。ビートに のって おどろう'], zh: ['萬聖節DJ之夜', '雷射和南瓜的夜店，跟著節拍跳舞吧'], en: ['Halloween DJ Night', 'A club of lasers and pumpkins. Dance to the beat'] },
  runway: { ja: ['パリコレ・ランウェイ', 'ピンクの ひると ゴシックの よる。ショーが はじまる'], zh: ['巴黎時裝週伸展台', '粉紅的白天與哥德的夜晚，時裝秀開始了'], en: ['Paris Collection Runway', 'Pink by day, gothic by night. The show begins'] },
  ring: { ja: ['両国リング', 'じっきょう席つきの リング。チャンピオンが まってる'], zh: ['兩國擂台', '附實況席的擂台，冠軍在等著'], en: ['Ryogoku Ring', 'A ring with a commentary desk. The champion awaits'] },
  dawn: { ja: ['夜明けの味噌汁', 'よるから あさまで いっしょ。ねむけに まけないで'], zh: ['黎明的味噌湯', '從晚上陪到早上，別輸給睡意'], en: ['Miso Soup at Dawn', 'Together from night till morning. Stay awake'] },
  cherry: { ja: ['山形さくらんぼバスツアー', 'さくらんぼ畑と 温泉の たび。将棋の こまに ちゅうい'], zh: ['山形櫻桃巴士之旅', '櫻桃園與溫泉之旅，小心將棋棋子'], en: ['Yamagata Cherry Bus Tour', 'Cherry orchards and hot springs. Mind the shogi pieces'] },
  station: { ja: ['一日駅長・山口駅', 'もみじの えき。黄色い 線の うちがわへ'], zh: ['一日站長：山口站', '楓葉車站，請退到黃線後方'], en: ['Station Master for a Day', 'Yamaguchi Station in autumn. Stay behind the yellow line'] },
  clinic: { ja: ['千客万来クリニック', 'よるの びょういんと バンドの ステージ'], zh: ['千客万来診所', '夜晚的醫院和樂團舞台'], en: ['千客万来 Clinic', 'A night hospital with a band stage'] },
  okinawa: { ja: ['きょうみお沖縄ミッション', 'うみと ジャングル。ミッションを クリアしよう'], zh: ['きょうみお沖繩任務', '大海和叢林，完成任務吧'], en: ['きょうみお Okinawa Mission', 'Sea and jungle. Clear the missions'] },
  hq: { ja: ['亨香組 本部', 'ふすまと ちょうちんの おやしき。鉄の掟を まもれ'], zh: ['亨香組 本部', '紙拉門與燈籠的宅邸，遵守鉄の掟'], en: ['亨香組 HQ', 'A mansion of sliding doors and lanterns. Keep the 鉄の掟'] },
  road: { ja: ['20周年への道 ∞', '3分ごとに 時代が かわる むげんの アンコール'], zh: ['通往20週年之路 ∞', '每 3 分鐘換一個時代的無限安可'], en: ['Road to the 20th ∞', 'An endless encore. The era changes every 3 minutes'] }
};
export const CHARS6 = {
  dj: { spr: 'dj', need: 'clearHalloween', ja: ['DJきょん', 'うさみみ DJ。ターンテーブルで スタート。こうげきが はやいけど HPは ひかえめ'], zh: ['DJきょん', '兔耳 DJ，從轉盤開始，攻擊快但 HP 偏少'], en: ['DJ Kyon', 'Bunny-eared DJ. Starts with the Turntable. Fast attacks, low HP'] },
  amaroli: { spr: 'am', need: 'clearRunway', ja: ['甘ロリきょん', 'あまい ロリータ。レースの日傘 Lv2 で スタート'], zh: ['甘ロリきょん', '甜美蘿莉塔，從蕾絲陽傘 Lv2 開始'], en: ['Ama-Loli Kyon', 'Sweet lolita. Starts with the Lace Parasol at Lv2'] },
  waroli: { spr: 'wa', need: 'clearRunway', ja: ['和ロリきょん', '和風 ロリータ。レースの日傘 Lv2 で スタート、すこし かたい'], zh: ['和ロリきょん', '和風蘿莉塔，從蕾絲陽傘 Lv2 開始，稍微耐打'], en: ['Wa-Loli Kyon', 'Japanese-style lolita. Lace Parasol Lv2, a little sturdier'] },
  machi: { spr: 'mc', need: 'clearCherry', ja: ['町娘きょん', 'かんざしの 町娘。将棋の駒手裏剣で スタート'], zh: ['町娘きょん', '戴髮簪的町娘，從將棋棋子手裏劍開始'], en: ['Machi-musume Kyon', 'A townsgirl with a hairpin. Starts with Shogi Shuriken'] },
  ekicho: { spr: 'ek', need: 'clearStation', ja: ['駅長きょん', '駅長さんの せいふく。♪と コインを すいよせる はんいが ひろい'], zh: ['駅長きょん', '站長制服，吸取♪和硬幣的範圍很大'], en: ['Station Master Kyon', 'In uniform. Big pickup range for ♪ and coins'] },
  redgt: { spr: 'gr', need: 'clearClinic', ja: ['ギターきょん（赤）', '赤い ピックで ギターが つよい。ギターで スタート'], zh: ['ギターきょん（紅）', '紅色彈片讓吉他更強，從吉他開始'], en: ['Guitar Kyon (Red)', 'A red pick makes her guitar hit harder. Starts with it'] },
  kumicho: { spr: 'kc', need: 'clearHq', ja: ['くみちょーきょん', 'チャカ⇄ダンビラで スタート。ときどき 好成員が たすけに くる'], zh: ['くみちょーきょん', '從チャカ⇄ダンビラ開始，好成員會不時來幫忙'], en: ['Kumicho Kyon', 'Starts with チャカ⇄ダンビラ. 好成員 come to help now and then'] },
  sapphire: { spr: 'bs', need: 'hamcards', ja: ['漆黒のブルーサファイア', 'まっくろな ハムスターの すがた。ちいさくて ときどき こうげきを かわす'], zh: ['漆黒のブルーサファイア', '漆黑倉鼠的模樣，小小的，偶爾能閃開攻擊'], en: ['漆黒のブルーサファイア', 'A jet-black hamster. Tiny, and sometimes dodges hits'] }
};
const clr = (icon, ja, zh, en) => ({ icon, ja: [ja + ' クリア', `「${ja}」で 5分 いきのこる`], zh: [zh + '過關', `在「${zh}」撐過 5 分鐘`], en: [en + ' Cleared', `Survive 5 minutes on ${en}`] });
const evo = (icon, wj, ej, wz, ez, we, ee) => ({ icon, ja: [ej, `「${wj}」を Lv5にして しんか`], zh: [ez, `把「${wz}」升到 Lv5 進化`], en: [ee, `Evolve ${we}`] });
export const ACH6 = {
  clearHalloween: clr('woofer0', 'ハロウィンDJナイト', '萬聖節DJ之夜', 'Halloween DJ Night'),
  clearRunway: clr('msew0', 'パリコレ・ランウェイ', '巴黎時裝週伸展台', 'the Runway'),
  clearRing: clr('champ0', '両国リング', '兩國擂台', 'Ryogoku Ring'),
  clearDawn: clr('nabe0', '夜明けの味噌汁', '黎明的味噌湯', 'Miso Soup at Dawn'),
  clearCherry: clr('oushou0', '山形さくらんぼバスツアー', '山形櫻桃巴士之旅', 'the Cherry Bus Tour'),
  clearStation: clr('loco0', '一日駅長・山口駅', '一日站長：山口站', 'Yamaguchi Station'),
  clearClinic: clr('sushim0', '千客万来クリニック', '千客万来診所', '千客万来 Clinic'),
  clearOkinawa: clr('shisaA0', 'きょうみお沖縄ミッション', 'きょうみお沖繩任務', 'the Okinawa Mission'),
  clearHq: clr('scroll0', '亨香組 本部', '亨香組 本部', '亨香組 HQ'),
  clearRoad: { icon: 'towel', ja: ['はじめての アンコール', '「20周年への道 ∞」で 5分 いきのこる'], zh: ['第一次安可', '在「通往20週年之路 ∞」撐過 5 分鐘'], en: ['First Encore', 'Last 5 minutes on the Road to the 20th'] },
  evoTtable: evo('discE', 'ターンテーブル', 'ハロウィンDJセット', '轉盤', '萬聖節DJ組', 'the Turntable', 'Halloween DJ Set'),
  evoPara: evo('paraE', 'レースの日傘', 'パリコレの日傘', '蕾絲陽傘', '巴黎時裝週陽傘', 'the Lace Parasol', 'Runway Parasol'),
  evoHlock: evo('hlockE', 'きょん式ハートロック', 'ギュッとハートロック', 'きょん式ハートロック', 'ギュッとハートロック', 'きょん式ハートロック', 'ギュッとハートロック'),
  evoKoma: evo('kin0', '将棋の駒手裏剣', '王手！', '將棋棋子手裏劍', '將軍！', 'the Shogi Shuriken', 'Check!'),
  evoWhis: evo('bellE', '駅長のホイッスル', '発車ベル', '站長哨子', '發車鈴', "the Station Master's Whistle", 'Departure Bell'),
  evoSyr: evo('syrE', 'ちゅうしゃロケット', '千客万来', '針筒火箭', '千客万来', 'the Syringe Rocket', '千客万来'),
  evoChaka: evo('chakaE', 'チャカ⇄ダンビラ', 'くみちょーの本気', 'チャカ⇄ダンビラ', 'くみちょー認真了', 'チャカ⇄ダンビラ', "くみちょー's Real Deal"),
  hamcards: { icon: 'hamcard', ja: ['ハムナンバーカード 5まい', '「夜明けの味噌汁」で 1回に ハムナンバーカードを 5まい あつめる'], zh: ['5 張ハムナンバーカード', '在「黎明的味噌湯」一場內收集 5 張ハムナンバーカード'], en: ['Five ハムナンバーカード', 'Collect 5 ハムナンバーカード in one run of Miso Soup at Dawn'] },
  encore: { icon: 'note6', ja: ['芸歴 ∞', '「20周年への道 ∞」で 芸歴が 2027を こえる'], zh: ['演藝資歷 ∞', '在「通往20週年之路 ∞」讓資歷超過 2027'], en: ['Career ∞', 'Push the career counter past 2027 on the Road to the 20th'] },
  loop2: { icon: 'crown', ja: ['2周目', '「20周年への道 ∞」で 2周目に はいる'], zh: ['第 2 輪', '在「通往20週年之路 ∞」進入第 2 輪'], en: ['Second Lap', 'Reach lap 2 on the Road to the 20th'] },
  mission3: { icon: 'mission', ja: ['ミッション 3つ', '「きょうみお沖縄ミッション」で 1回に ミッションを 3つ クリア'], zh: ['完成 3 個任務', '在「きょうみお沖繩任務」一場內完成 3 個任務'], en: ['Three Missions', 'Clear 3 missions in one Okinawa run'] },
  allStages2: { icon: 'star3', ja: ['ぜんぶの ステージ II', '19の ステージを ぜんぶ クリア'], zh: ['全部關卡 II', '19 個關卡全部過關'], en: ['Every Stage II', 'Clear all 19 stages'] }
};
export const UNLOCK_BY6 = { clearHalloween: ['char:dj'], clearRunway: ['char:amaroli', 'char:waroli'], clearCherry: ['char:machi'], clearStation: ['char:ekicho'], clearClinic: ['char:redgt'], clearHq: ['char:kumicho'], hamcards: ['char:sapphire'] };

export const ZUKAN6 = [
  z('kosien', 'bball', 'played', 'post', ['母校の野球部 ⚾', '長野の 母校の 野球部を、SNSで おうえん していました。'], ['母校的棒球隊 ⚾', '曾在社群網站上為長野的母校棒球隊加油。'], ['Her old school team ⚾', 'She cheered on her old school\'s baseball team in Nagano on social media.']),
  z('yamagata', 'cherry', 'ach:clearCherry', 'post', ['22年ぶりの山形 🍒', 'こどもの ころ 山形に すんでいました。2026年に ファンの みんなと 22年ぶりに たずねました。'], ['睽違 22 年的山形 🍒', '小時候住過山形，2026 年和粉絲一起睽違 22 年再訪。'], ['Yamagata after 22 years 🍒', 'She lived in Yamagata as a child, and went back with fans in 2026, 22 years later.']),
  z('hpbday', 'hp0', 'played', 'post', ['はんぺんの誕生日 🎂', 'はんぺんの おたんじょうびは 4月17日です。'], ['はんぺん的生日 🎂', 'はんぺん的生日是 4 月 17 日。'], ['Hanpen\'s birthday 🎂', 'Hanpen\'s birthday is 17 April.']),
  z('busguide', 'bus', 'ach:clearCherry', 'event', ['バスガイドきょん 🚌', 'お誕生日の ファンツアーで、じぶんで バスガイドを つとめました。'], ['巴士導遊きょん 🚌', '在生日粉絲旅行中親自擔任巴士導遊。'], ['Bus guide Kyon 🚌', 'On her birthday fan tour she was the bus guide herself.']),
  z('bento', 'bento', 'ach:clearCherry', 'event', ['手づくりのおべんとう 🍱', 'ツアーの おべんとうは、メニューも つつみも かのじょが かんがえました。ばしょは 成人式を むかえた 会場でした。'], ['親手設計的便當 🍱', '旅行便當的菜單和包裝都是她設計的，地點是她辦成人式的會場。'], ['Her own bento 🍱', 'She planned the tour bento, menu and wrapping both, served at the hall of her coming-of-age ceremony.']),
  z('mcfirst', 'rmic', 'ach:clearRunway', 'event', ['はじめての司会 🎤', '2025年の 配信イベントで はじめて 本かくてきに 司会を つとめ、相棒と「次世代司会ユニット」を くみました。'], ['第一次主持 🎤', '2025 年的節目活動第一次正式擔任主持，和搭檔組成「次世代司会ユニット」。'], ['First time as MC 🎤', 'At a 2025 streaming event she was a proper MC for the first time, forming the "次世代司会ユニット" with her partner.']),
  z('ekicho', 'ekicho', 'ach:clearStation', 'event', ['一日駅長 🚉', '2025年11月、山口の えきで 一日駅長を つとめました。'], ['一日站長 🚉', '2025 年 11 月在山口的車站擔任一日站長。'], ['Station master for a day 🚉', 'In November 2025 she was station master for a day at a station in Yamaguchi.']),
  z('jikkyo', 'desk', 'ach:clearRing', 'news', ['実況席のきょん 🎙️', '2024年の おわりに、プロレスの 大会で じっきょう席の ゲストかいせつを しました。'], ['實況席的きょん 🎙️', '2024 年底在摔角大會的轉播席擔任來賓解說。'], ['Kyon on commentary 🎙️', 'At the end of 2024 she was a guest commentator at a pro-wrestling show.']),
  z('djdebut', 'ttable', 'ach:clearHalloween', 'news', ['DJデビュー 🎧', '2026年の ハロウィンに はじめて DJを しました。うさぎの すがたで ステージへ。'], ['DJ 出道 🎧', '2026 年萬聖節第一次當 DJ，扮成兔子上台。'], ['DJ debut 🎧', 'On Halloween 2026 she DJed for the first time, on stage dressed as a bunny.']),
  z('halloween', 'jack', 'ach:clearHalloween', 'post', ['いちばん好きな日はハロウィン 🎃', 'いちばん 好きな 日は ハロウィン。まいとし 仮装を たのしんでいます。'], ['最喜歡的日子是萬聖節 🎃', '最喜歡的日子是萬聖節，每年都會變裝。'], ['Her favourite day is Halloween 🎃', 'Halloween is her favourite day, and she dresses up every year.']),
  z('fashionmc', 'mirror', 'ach:clearRunway', 'news', ['ファッションショーのMC 👗', '2026年に ファッションショーの 司会を 2回 つとめ、ショーの お洋服も きました。'], ['時裝秀主持 👗', '2026 年主持了兩場時裝秀，還穿上秀裡的衣服。'], ['Fashion show MC 👗', 'In 2026 she hosted two fashion shows, wearing clothes from the show.']),
  z('trump', 'trump', 'ach:clearRunway', 'post', ['トランプとティータイム 🃏', 'ショーで きた ロリータの お洋服の テーマは「トランプ」と「ティータイム」でした。'], ['撲克牌和下午茶 🃏', '時裝秀上穿的蘿莉塔洋裝，主題是「撲克牌」和「下午茶」。'], ['Cards and teatime 🃏', 'The lolita outfit she wore at the show had a playing-cards and teatime theme.']),
  z('amawa', 'para', 'ach:clearRunway', 'post', ['甘ロリと和ロリ 🎀', '雑誌で、あまい ロリータと 和風の ロリータを しょうかい しました。'], ['甜蘿莉與和蘿莉 🎀', '在雜誌上介紹甜系和和風蘿莉塔。'], ['Sweet and Japanese lolita 🎀', 'In a magazine she showed off both sweet and Japanese-style lolita looks.']),
  z('heartlock', 'hlock', 'ach:clearRing', 'post', ['きょん式ハートロック 💘', 'デビューいらい、CDを おくりだす まえに 1まいずつ「ぎゅっ」と だきしめて きました。'], ['きょん式ハートロック 💘', '出道以來，每張 CD 出貨前她都會一張張「緊緊」抱過。'], ['きょん式ハートロック 💘', 'Since her debut she has hugged every CD tight before it ships.']),
  z('towel', 'towel', 'ach:clearRoad', 'post', ['熱唱タオルの筆文字 ✍️', 'グッズの タオルの 文字は、かのじょが 筆で かきました。'], ['熱唱タオル的書法字 ✍️', '周邊毛巾上的字是她親手用毛筆寫的。'], ['The 熱唱タオル lettering ✍️', 'The lettering on her merch towel is her own brush calligraphy.']),
  z('utamoriya', 'redpick', 'ach:clearClinic', 'post', ['歌の守屋の日 🎸', '2026年10月、バンドと いっしょに ワンマンライブを ひらきました。'], ['歌の守屋の日 🎸', '2026 年 10 月和樂團一起開了個人演唱會。'], ['歌の守屋の日 🎸', 'In October 2026 she played a solo concert with a live band.']),
  z('korea', 'heart', 'ach:clearOkinawa', 'post', ['はじめての海外ライブ 🇰🇷', '2026年、韓国で はじめての 海外ライブ。「サランへヨ」と つたえました。'], ['第一次海外演出 🇰🇷', '2026 年在韓國第一次海外演出，說了「サランへヨ」。'], ['First show abroad 🇰🇷', 'In 2026 she played her first show abroad, in Korea, and told the crowd "Saranghaeyo!" (I love you).']),
  z('sapphire', 'bs0', 'ach:hamcards', 'mag', ['漆黒のブルーサファイア 🐹', 'ハムスターの なかまたちの 中での よびなは「漆黒のブルーサファイア」。くろい ハムスターです。'], ['漆黒のブルーサファイア 🐹', '在倉鼠夥伴中的稱號是「漆黒のブルーサファイア」，是一隻黑色倉鼠。'], ['漆黒のブルーサファイア 🐹', 'Among her hamster friends her title is "漆黒のブルーサファイア": a black hamster.']),
  z('aprilfool', 'chaka', 'ach:clearHq', 'wiki', ['エイプリルフールから始まった番組 🔫', 'エイプリルフールの 24時間だけの 番組が、そのまま レギュラー番組に なりました。'], ['從愚人節開始的節目 🔫', '愚人節限定 24 小時的節目，後來真的變成了固定節目。'], ['A show born on April Fools\' 🔫', 'A 24-hour April Fools\' show of hers went on to become a regular programme.']),
  z('kumicho', 'kc0', 'ach:clearHq', 'show', ['亨香組のくみちょー ⚔️', 'じぶんの 番組では「くみちょー」。リスナーは「好成員」と よばれます。'], ['亨香組的くみちょー ⚔️', '在自己的節目裡是「くみちょー」，聽眾被稱為「好成員」。'], ['くみちょー of 亨香組 ⚔️', 'On her own show she is the "くみちょー", and listeners are called "好成員".']),
  z('isshokazoku', 'scrollp', 'ach:clearHq', 'show', ['鉄の掟「一生家族」 📜', '組の 鉄の掟の ひとつは「一生家族」です。'], ['鉄の掟「一生家族」 📜', '組的鉄の掟之一是「一生家族」。'], ['鉄の掟: 一生家族 📜', 'One of the gang\'s 鉄の掟 is "一生家族" (family for life).']),
  z('kyoncafe', 'waffle', 'ach:clearDawn', 'post', ['きょんカフェ 🧇', '番組で クレープや マフィン、ワッフルを 手づくり しました。'], ['きょんカフェ 🧇', '在節目裡親手做了可麗餅、瑪芬和鬆餅。'], ['きょんカフェ 🧇', 'On her show she made crêpes, muffins and waffles by hand.']),
  z('ponkotsu', 'qmark', 'played', 'mag', ['ポンコツ伝説 🧺', 'ゴミを せんたくきに いれてしまった ことが ある、と じぶんで はなしています。'], ['迷糊傳說 🧺', '她自己說過曾經把垃圾丟進洗衣機。'], ['A clumsy legend 🧺', 'She says she once put rubbish in the washing machine.']),
  z('oimo', 'imo', 'ach:clearStation', 'post', ['おいもの役 🍠', 'テレビアニメで おいもの キャラクターを えんじ、「ひみつどうぐに なれて うれしい」と よろこびました。'], ['地瓜的角色 🍠', '在電視動畫裡配過地瓜角色，說「能成為秘密道具真開心」。'], ['The sweet-potato role 🍠', 'She voiced a sweet potato in a TV anime and was happy to "become a secret gadget".']),
  z('mother', 'note2', 'ach:clearRoad', 'post', ['お母さんのひとこと 💚', 'MVを みた お母さんの「きょうかは アーティストに なったんだなぁ」の ひとことに、なみだが でました。'], ['媽媽的一句話 💚', '媽媽看了 MV 說「きょうか成為藝人了呢」，她感動得哭了。'], ['Her mother\'s words 💚', 'After watching her MV, her mother said "Kyoka has become an artist", and it made her cry.']),
  z('hamura', 'hamcoin', 'ach:clearDawn', 'show', ['ハムら市 🐹', '6周年の イベントは 東京の 羽村市で。「ハムら市に あつまれ」が あいことば でした。'], ['ハムら市 🐹', '六週年活動在東京羽村市舉辦，口號是「ハムら市にあつまれ」。'], ['ハムら市 🐹', 'The 6th-anniversary event was held in Hamura, Tokyo, under the slogan "gather in ハムら市".']),
  z('yoake', 'clockp', 'ach:clearDawn', 'post', ['夜明けまでいっしょ 🌅', '2026年、ファンと よあけまで いっしょに すごす オールナイトの イベントを ひらきました。'], ['陪你到天亮 🌅', '2026 年辦了陪粉絲一起到天亮的徹夜活動。'], ['Together till dawn 🌅', 'In 2026 she held an all-night event, staying with fans until dawn.']),
  z('koma', 'koma', 'ach:clearCherry', 'tour', ['将棋の駒づくり ♟️', '山形の たびでは、将棋の こまに 1文字 ほる たいけんが ありました。'], ['製作將棋棋子 ♟️', '山形之旅的行程中有在將棋棋子上刻一個字的體驗。'], ['Carving a shogi piece ♟️', 'The Yamagata trip included carving one character into a shogi piece.']),
  z('twintail', 'am0', 'played', 'post', ['ツインテール至上主義 🎀', '「おおきな ツインテールが さいこう」と はなしています。'], ['雙馬尾至上主義 🎀', '她說過「誇張的雙馬尾最棒」。'], ['Twin-tails above all 🎀', 'She says big, bold twin-tails are the best.']),
  z('senshi', 'sword', 'ach:clearHq', 'post', ['自作の名刀「千紫万紅」 🗡️', 'マンガを よみながら、じぶんの 刀に「千紫万紅」と なまえを つけました。'], ['自創名刀「千紫万紅」 🗡️', '看漫畫時，幫自己的刀取名為「千紫万紅」。'], ['Her own blade "千紫万紅" 🗡️', 'While reading a manga she named her own sword "千紫万紅".'])
];
