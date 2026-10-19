export const SYMBOLS = ['cherry','lemon','grape','bell','seven','wild'];
export const SYMBOL_LABEL = {cherry:'🍒',lemon:'🍋',grape:'🍇',bell:'🔔',seven:'7',wild:'✦'};
export const SLOT_PAY = {cherry:4,lemon:5,grape:7,bell:10,seven:25,wild:40};
export function random() { const a = new Uint32Array(1); globalThis.crypto.getRandomValues(a); return a[0] / 4294967296; }
export function chooseSlot(rng=random) { const r=rng(); return r<.29?'cherry':r<.54?'lemon':r<.75?'grape':r<.90?'bell':r<.98?'seven':'wild'; }
export function slotMultiplier(reels) {
  const ordinary = reels.filter(x=>x!=='wild');
  if (!ordinary.length) return 40;
  if (ordinary.every(x=>x===ordinary[0])) return SLOT_PAY[ordinary[0]];
  if (reels.filter(x=>x==='cherry').length===2) return 1;
  return 0;
}
export const HORSES = [
  {name:'ミッドナイト',en:'MIDNIGHT',color:'#9cafcb',power:87,stamina:68,odds:2.8,place:1.35,style:'先行',note:'スタートの速さが武器。短いコースで真価を発揮。'},
  {name:'サンセット',en:'SUNSET',color:'#dc9b72',power:78,stamina:85,odds:3.5,place:1.55,style:'差し',note:'後半の粘りが自慢。長いコースなら期待大。'},
  {name:'クローバー',en:'CLOVER',color:'#99c8ae',power:73,stamina:77,odds:4.5,place:1.8,style:'自在',note:'どんなコースも堅実に走る、バランス型。'},
  {name:'ブレイズ',en:'BLAZE',color:'#d98888',power:91,stamina:48,odds:5.5,place:2.05,style:'逃げ',note:'爆発的なスピード。最後まで脚が持つかが勝負。'},
  {name:'ムーンリバー',en:'MOON RIVER',color:'#b5a1ce',power:65,stamina:96,odds:7,place:2.5,style:'追込',note:'雨と長距離が得意。終盤に一気に追い上げる。'},
  {name:'ラッキースター',en:'LUCKY STAR',color:'#e2cd86',power:61,stamina:66,odds:11,place:3.6,style:'大穴',note:'気分屋のダークホース。ハマれば大きな配当に。'}
];
export function raceResult(distance,wet,rng=random) {
  return HORSES.map((h,i)=>({i,score:h.power*(distance===1200?.70:.38)+h.stamina*(distance===1200?.30:.62)+(wet&&i===4?12:0)+(i===5?62:42)*rng()})).sort((a,b)=>b.score-a.score).map(x=>x.i);
}
export const REDS = [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36];
export function rouletteMultiplier(n,type,pick) { if(type==='straight') return n===pick?36:0; if(n===0)return 0; return ({red:REDS.includes(n),black:!REDS.includes(n),odd:n%2===1,even:n%2===0}[type])?2:0; }
export function makeDeck(rng=random) { const deck=[]; for(const suit of ['♠','♥','♦','♣'])for(const rank of ['A','2','3','4','5','6','7','8','9','10','J','Q','K'])deck.push({suit,rank}); for(let i=deck.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[deck[i],deck[j]]=[deck[j],deck[i]];} return deck; }
export function handValue(cards) { let score=0,aces=0; for(const c of cards){ if(c.rank==='A'){score+=11;aces++;} else score+=['J','Q','K'].includes(c.rank)?10:Number(c.rank); } while(score>21&&aces){score-=10;aces--;}return score; }
export function blackjackOutcome(player,dealer,stake,natural=true) { const p=handValue(player),d=handValue(dealer); if(p>21)return {payout:0,label:'BUST',detail:'21 を超えました。次のハンドへ。'}; if(natural&&player.length===2&&p===21){ if(dealer.length===2&&d===21)return {payout:stake,label:'PUSH',detail:'両者ブラックジャック。ベットを返却。'};return {payout:Math.floor(stake*2.5),label:'BLACKJACK',detail:'ナチュラル 21！ 3 : 2 のボーナス配当。'};}if(dealer.length===2&&d===21)return {payout:0,label:'DEALER BLACKJACK',detail:'ディーラーがナチュラル 21。'};if(d>21||p>d)return {payout:stake*2,label:'YOU WIN',detail:d>21?'ディーラーがバスト！':'あなたのハンドが上回りました。'};if(p===d)return {payout:stake,label:'PUSH',detail:'引き分け。ベットを返却。'};return {payout:0,label:'DEALER WINS',detail:'ディーラーのハンドが上回りました。'}; }
