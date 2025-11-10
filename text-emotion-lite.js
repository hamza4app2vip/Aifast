// Lightweight Arabic emotion analyzer: normalization, negation, emojis, core lexicon
(function(){
  function ready(f){document.readyState==='loading'?document.addEventListener('DOMContentLoaded',f):f();}
  const D=/[\u064B-\u0652]/g,T=/\u0640/g,P=/[\p{P}\p{S}]/gu;
  function norm(s){if(!s)return'';s=s.replace(D,'').replace(T,'').replace(/[إأآا]/g,'ا').replace(/ى/g,'ي').replace(/ة/g,'ه').replace(/ؤ/g,'و').replace(/ئ/g,'ي').replace(/ء/g,'').toLowerCase();return s.replace(/(.)\1{2,}/g,'$1$1');}
  function toks(s){return norm(s).replace(P,' ').split(/\s+/).filter(Boolean)}
  const L={
    happy:new Map([['سعيد',2],['سعاده',2],['مبسوط',2.2],['مبسوطه',2.2],['فرح',2.2],['فرحان',2.2],['رايق',1.6],['مروق',1.8],['متحمس',1.6],['تمام',1.2]].map(([w,v])=>[norm(w),v])),
    sad:new Map([['حزين',2.2],['زعلان',2],['متضايق',1.8],['طفشان',1.4],['مكتئب',2.4],['مقهور',1.8],['بكيت',1.6],['ابكي',1.6]].map(([w,v])=>[norm(w),v])),
    angry:new Map([['غاضب',2.2],['معصب',2.2],['غضب',2],['مستفز',1.8],['تنرفزت',1.8],['متنرفز',2],['قهر',1.6]].map(([w,v])=>[norm(w),v])),
    fearful:new Map([['خايف',2.2],['خوف',2],['مرعوب',2.2],['قلقان',1.8],['متوتر',1.6]].map(([w,v])=>[norm(w),v])),
    disgusted:new Map([['مقرف',2.2],['قرف',2],['مقزز',2.2],['اشمئزاز',2.2]].map(([w,v])=>[norm(w),v])),
    surprised:new Map([['مصدوم',2],['مندهش',2],['تفاجات',2],['تفاجئت',2],['مفاجاه',2]].map(([w,v])=>[norm(w),v])),
    neutral:new Map([['عادي',1],['محايد',1],['طبيعي',1],['ماشي',1]].map(([w,v])=>[norm(w),v]))
  };
  const PH=new Map([['مو مبسوط',['sad',2.2]],['مش مبسوط',['sad',2.2]],['مش سعيد',['sad',2.2]],['مو سعيد',['sad',2.2]]].map(([p,v])=>[norm(p),v]));
  const NEG=new Set(['مو','مش','ليس','ما','بدون','غير','موش','مهوش']);
  const INT=new Set(['جدا','مره','مرة','كتير','قوي','اوي','وايد','حيل','تماما']);
  const DOW=new Set(['قليل','قليلا','شوي','شويه','نوعا','تقريبا']);
  const EM=[
    {re:/[🙂😀😃😄😁😍🤩🥳👍✨🌟❤💖💕💙💚💛💜💞💯]/g,e:'happy',s:2},
    {re:/[😢😭☹🙁😞😔💔]/g,e:'sad',s:2},
    {re:/[😡😠🤬👿💢]/g,e:'angry',s:2.2},
    {re:/[😱😨😰👻]/g,e:'fearful',s:2},
    {re:/[🤢🤮😖]/g,e:'disgusted',s:2},
    {re:/[😲🤯😳]/g,e:'surprised',s:2}
  ];
  function hasNeg(ws,i,d=3){for(let k=Math.max(0,i-d);k<i;k++){if(NEG.has(ws[k]))return true;if(ws[k]==='ما'){for(let j=k+1;j<=Math.min(ws.length-1,k+d+2);j++){if(ws[j]&&ws[j].endsWith('ش'))return true;}}}return false}
  function mult(ws,i,raw){let m=1;for(let k=Math.max(0,i-2);k<=Math.min(ws.length-1,i+2);k++){if(INT.has(ws[k]))m*=1.5;if(DOW.has(ws[k]))m*=0.7}const bangs=(raw.match(/!/g)||[]).length;if(bangs)m*=Math.min(1+0.2*bangs,1.8);return m}
  function analyze(text){const raw=text||'';const n=norm(raw);const ws=toks(raw);const sc={happy:0,sad:0,angry:0,surprised:0,fearful:0,disgusted:0,neutral:0};const hits=[];
    for(const [ph,[emo,w]] of PH.entries()){if(n.includes(ph)){sc[emo]+=w;hits.push({t:'ph',k:ph,e:emo,w,neg:false});}}
    ws.forEach((w,i)=>{for(const [emo,lex] of Object.entries(L)){const v=lex.get(w);if(!v)continue;const neg=hasNeg(ws,i);const m=mult(ws,i,raw);if(neg){const flip=(emo==='happy')?'sad':(emo==='sad')?'happy':(emo==='angry')?'sad':(emo==='fearful')?'neutral':(emo==='disgusted')?'neutral':'sad';sc[flip]+=v*m;hits.push({t:'w',k:w,e:flip,w:v*m,neg:true});}else{sc[emo]+=v*m;hits.push({t:'w',k:w,e:emo,w:v*m,neg:false});}}});
    EM.forEach(({re,e,s})=>{const m=raw.match(re);if(m&&m.length){sc[e]+=s*m.length;hits.push({t:'emoji',k:'emoji',e, w:s*m.length,neg:false});}});
    if(!hits.length&&n.trim())sc.neutral+=1;const sum=Object.values(sc).reduce((a,b)=>a+b,0)||1;const ns=Object.fromEntries(Object.entries(sc).map(([k,v])=>[k,v/sum]));let emo='neutral',best=-1;for(const [k,v]of Object.entries(ns)){if(v>best){best=v;emo=k}}const conf=best;
    const th=hits.filter(h=>h.e===emo).sort((a,b)=>b.w-a.w).slice(0,3);let exp='';if(th.length)exp='اعتمد التحليل على: '+th.map(h=>'"'+h.k+'"'+(h.neg?' (منفية)':'' )).join('، ');
    if(/جدا|مره|مرة|كتير|قوي|اوي|وايد|حيل|تماما/.test(n))exp+=(exp?' ':'')+'اكتشفنا ألفاظ تقوية رفعت الدقة.';
    return {emotion:emo,confidence:conf,scores:ns,explanation:exp};}
  // expose lightweight analyzer for other modules
  window.simpleArabicEmotionAnalyze = analyze;
  if(window.emotionAnalysis && typeof window.emotionAnalysis==='object'){
    window.emotionAnalysis.analyzeText = async (text)=> analyze(text);
  }
  function run(){const input=document.getElementById('sentiment-text');if(!input)return;const r=analyze(input.value||'');if(typeof displayEmotionResults==='function')displayEmotionResults(r,'text');}
  ready(function(){
    const input=document.getElementById('sentiment-text');
    const btn=document.getElementById('analyze-text-emotion-btn');
    if(!input||!btn)return;
    // Capture-phase guard to prevent buggy legacy handlers
    document.addEventListener('click',function(e){
      const t=e.target&&e.target.closest('#analyze-text-emotion-btn');
      if(t){
        e.preventDefault();
        e.stopImmediatePropagation();
        e.stopPropagation();
        run();
      }
    },true);
    // Fallback direct listener
    btn.addEventListener('click',run);
    input.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key==='Enter')run();});
  });
})();
