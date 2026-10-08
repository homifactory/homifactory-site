/* HOMI FACTORY 실시간 상담 창 (FR-FAC-017) — MARKET(/market) 위젯을 팩토리용으로 옮김 */

/* FR-FAC-017 HOMI FACTORY 실시간 상담 창 — MARKET 과 같은 방식(채널톡 가입 전 자체 위젯), 「급한 일이에요」 먼저 연결 */
(function(){
  var CFG={
    channelKey:'',                     /* 채널톡 플러그인 키를 넣으면 채널톡으로 전환 */
    kakaoUrl:'',                       /* 카카오톡 채널 주소 (예: https://pf.kakao.com/_xxxx/chat) — Q-41 */
    phone:'010-4026-2695',
    email:'support@homifactory.com',
    endpoint:'https://formsubmit.co/ajax/support@homifactory.com',
    open:10, close:22                  /* 운영시간 (KST) */
  };
  if(window.__hcLoaded) return; window.__hcLoaded=true;

  if(CFG.channelKey){
    (function(){var w=window;if(w.ChannelIO)return;var ch=function(){ch.c(arguments)};ch.q=[];ch.c=function(a){ch.q.push(a)};w.ChannelIO=ch;
      var s=document.createElement('script');s.async=true;s.src='https://cdn.channel.io/plugin/ch-plugin-web.js';document.head.appendChild(s);})();
    window.ChannelIO('boot',{pluginKey:CFG.channelKey,language:'ko'});
    return;
  }

  var TYPES=['Marketing','Global PR','Content Production','Monitoring Service','기타'];
  var URG=['이슈 대응','반응이 올라오는 중','급한 일정','기타'];
  var KEY='hcf-state-v1', st={};
  try{ st=JSON.parse(sessionStorage.getItem(KEY)||'{}')||{}; }catch(e){ st={}; }
  st.msgs=st.msgs||[]; st.view=st.view||'home';
  function save(){ try{ sessionStorage.setItem(KEY,JSON.stringify(st)); }catch(e){} }

  function kstHour(){ try{ return +new Intl.DateTimeFormat('en-GB',{hour:'2-digit',hour12:false,timeZone:'Asia/Seoul'}).format(new Date())%24; }catch(e){ return new Date().getHours(); } }
  function inHours(){ var h=kstHour(); return h>=CFG.open && h<CFG.close; }
  function esc(s){ return String(s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];}); }
  var I={
    chat:'<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 3C6.5 3 2 6.6 2 11c0 2.4 1.3 4.6 3.4 6.1L4.6 21l4.2-2.3c1 .3 2.1.4 3.2.4 5.5 0 10-3.6 10-8.1S17.5 3 12 3z"/></svg>',
    x:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>',
    xs:'<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>',
    back:'<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 6l-6 6 6 6"/></svg>',
    kakao:'<svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" aria-hidden="true"><path d="M12 4C7 4 3 7.1 3 11c0 2.5 1.7 4.7 4.2 5.9l-.9 3.3c-.1.3.3.6.6.4l3.9-2.6c.4 0 .8.1 1.2.1 5 0 9-3.1 9-7S17 4 12 4z"/></svg>',
    tel:'<svg viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.5c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z"/></svg>',
    send:'<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>'
  };

  var fab=document.createElement('button');
  fab.type='button'; fab.className='hc-fab'+(st.seen?' hc-seen':''); fab.setAttribute('aria-label','실시간 상담 열기');
  fab.setAttribute('aria-expanded','false'); fab.setAttribute('aria-controls','hc-panel');
  fab.innerHTML='<span class="hc-b">'+I.chat+'</span><span class="hc-x">'+I.x+'</span><span class="hc-badge">1</span>';
  var pn=document.createElement('div');
  pn.className='hc-panel'; pn.id='hc-panel'; pn.setAttribute('role','dialog'); pn.setAttribute('aria-label','HOMI FACTORY 실시간 상담');
  document.body.appendChild(pn); document.body.appendChild(fab);

  function head(back){
    return '<div class="hc-head"><div class="hc-top">'+(back?'<button type="button" class="hc-back" data-a="home" aria-label="처음으로">'+I.back+'</button>':'')
      +'<span class="hc-logo" aria-hidden="true">HF</span><span class="hc-name">HOMI FACTORY</span>'
      +'<button type="button" class="hc-icon" data-a="close" aria-label="상담 창 닫기">'+I.xs+'</button></div>'
      +'<button type="button" class="hc-hours-t" data-a="hours" aria-expanded="'+(st.hours?'true':'false')+'">운영시간 보기 ›</button>'
      +'<div class="hc-hours"'+(st.hours?'':' hidden')+'>평일 10:00 ~ 22:00 · 주말·공휴일 상담 가능</div></div>';
  }
  function home(){
    var on=inHours();
    var tel=st.telShown?'<div class="hc-info">전화 상담 <a href="tel:'+CFG.phone.replace(/-/g,'')+'">'+CFG.phone+'</a></div>':'';
    var kk=st.kakaoMsg?'<div class="hc-info">카카오톡 채널을 준비하고 있어요. 지금은 <b>문의하기</b>로 남겨 주세요.</div>':'';
    return head(false)+'<div class="hc-body">'
      +'<div class="hc-card"><div class="hc-who"><span class="hc-logo" aria-hidden="true">HF</span>HOMI FACTORY</div>'
      +'<p class="hc-greet">안녕하세요, HOMI FACTORY입니다.\n급한 일은 [급한 일이에요]를 눌러 주세요.\n담당자에게 먼저 연결됩니다.</p>'
      +'<button type="button" class="hc-cta" data-a="start">'+(st.msgs.length?'대화 이어가기 ›':'문의하기 ›')+'</button>'
      +'<button type="button" class="hc-urgent" data-a="urgent">급한 일이에요 <em>URGENT</em> ›</button>'
      +'<p class="hc-note">'+(on?'🕘 운영시간 안에 답변 드려요 · 급한 일은 전화도 받습니다':'🌙 지금은 운영시간이 아니에요 · 연락처를 남기시면 다음 운영시간에 답변드려요')+'</p></div>'
      +'<div class="hc-card hc-other"><b>다른 방법으로 문의</b>'
      +'<button type="button" class="hc-rnd hc-kakao" data-a="kakao" aria-label="카카오톡으로 문의">'+I.kakao+'</button>'
      +'<button type="button" class="hc-rnd hc-tel" data-a="tel" aria-label="전화로 문의">'+I.tel+'</button></div>'
      +kk+tel+'</div>'+tabs('home');
  }
  function tabs(cur){
    var T=[['home','홈','<path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"/>'],['chat','대화','<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/>'],['set','설정','<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>']];
    return '<nav class="hc-tabs" aria-label="상담 창 메뉴">'+T.map(function(t){ return '<button type="button" data-a="tab-'+t[0]+'"'+(t[0]===cur?' aria-current="page"':'')+'><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+t[2]+'</svg>'+t[1]+'</button>'; }).join('')+'</nav>';
  }
  function settings(){
    var langs=[].map.call(document.querySelectorAll('.hh-lang-menu a'),function(a){ return '<a href="'+a.getAttribute('href')+'"'+(a.getAttribute('aria-current')?' aria-current="true"':'')+' hreflang="'+(a.getAttribute('hreflang')||'')+'">'+esc(a.textContent)+'</a>'; }).join('');
    return head(false)+'<div class="hc-body">'
      +(langs?'<div class="hc-card hc-set"><h4>언어</h4><div class="hc-langs">'+langs+'</div></div>':'')
      +'<div class="hc-card hc-set"><h4>운영시간</h4><p class="hc-note" style="text-align:left;margin:0">평일 10:00 ~ 22:00 · 주말·공휴일 상담 가능<br>운영시간 밖에 남기신 문의는 다음 운영시간에 답변드려요.</p></div>'
      +'<div class="hc-card hc-set"><h4>대화 기록</h4>'+(st.msgs.length?'<button type="button" class="hc-ghost" data-a="reset">이 브라우저의 대화 기록 지우기</button>':'<p class="hc-note" style="text-align:left;margin:0">아직 대화 기록이 없어요.</p>')+'</div>'
      +'</div>'+tabs('set');
  }
  function bubble(m){ return '<div class="hc-m '+m.r+'">'+esc(m.t)+'</div>'; }
  function chat(){
    var b='<div class="hc-msgs" aria-live="polite">'+st.msgs.map(bubble).join('');
    if(!st.type) b+='<div class="hc-chips" role="group" aria-label="'+(st.urgent?'상황':'관심 분야')+'">'+(st.urgent?URG:TYPES).map(function(t){return '<button type="button" class="hc-chip" data-t="'+esc(t)+'">'+esc(t)+'</button>';}).join('')+'</div>';
    if(st.ask && !st.sent) b+='<form class="hc-form" data-f="1" novalidate>'
      +'<input type="text" name="name" placeholder="성함 *" autocomplete="name" value="'+esc(st.name||'')+'" required>'
      +'<input type="text" name="contact" placeholder="연락처 (전화 또는 이메일) *" autocomplete="email" value="'+esc(st.contact||'')+'" required>'
      +'<input type="text" name="_honey" style="display:none" tabindex="-1" autocomplete="off">'
      +'<label class="hc-agree"><input type="checkbox" name="agree"><span>상담 답변을 위한 개인정보(성함·연락처·문의 내용) 수집·이용에 동의합니다. 상담 완료 후 1년 보관 · <a href="/privacy" target="_blank" rel="noopener">개인정보처리방침</a></span></label>'
      +'<div class="hc-err" role="alert"></div><button type="submit" class="hc-cta" style="margin-top:4px">보내기</button></form>';
    if(st.urgent) b+='<a class="hc-callnow" href="tel:'+CFG.phone.replace(/-/g,'')+'">지금 바로 전화하기 · '+CFG.phone+'</a>';
    b+='</div>';
    var showInput=!!st.type && !(st.ask && !st.sent);
    return head(true)+'<div class="hc-body">'+b+'</div>'
      +'<form class="hc-input" data-i="1"'+(showInput?'':' hidden')+'><textarea rows="1" placeholder="메시지를 입력하세요" aria-label="메시지 입력"></textarea><button type="submit" class="hc-send" aria-label="보내기">'+I.send+'</button></form>'+tabs('chat');
  }
  function render(){
    pn.innerHTML=st.view==='chat'?chat():st.view==='set'?settings():home();
    var body=pn.querySelector('.hc-body'); if(st.view==='chat'&&body) body.scrollTop=body.scrollHeight;
  }
  function push(r,t){ st.msgs.push({r:r,t:t}); save(); }
  function setOpen(o,focus){
    st.open=o; if(o){ st.seen=true; fab.classList.add('hc-seen'); }
    pn.classList.toggle('open',o); fab.setAttribute('aria-expanded',o?'true':'false');
    fab.setAttribute('aria-label',o?'실시간 상담 닫기':'실시간 상담 열기'); save();
    if(o){ render(); if(focus){ var f=pn.querySelector('textarea:not([hidden]),.hc-cta,.hc-chip'); if(f) setTimeout(function(){f.focus();},60);} }
    else if(focus) fab.focus();
  }
  function startChat(){
    st.view='chat';
    if(!st.msgs.length){ push('bot','안녕하세요, HOMI FACTORY입니다.\n관심 있는 분야를 골라 주세요.'); }
    save(); render();
    var f=pn.querySelector('.hc-chip,textarea'); if(f) f.focus();
  }
  /* 통합 관리자 문의함(Supabase com_inquiries)에도 함께 넣기 — 실패해도 메일 접수에는 영향 없음 (FR-COM-019) */
  function toInbox(p){
    if(!p['대화 내용']) return;
    var c=p['연락처']||'', em=/@/.test(c)?c:'', ph=em?'':c, lc=(document.documentElement.lang||'ko').slice(0,2).toUpperCase();
    try{ fetch('https://bcngbtwzuqtwtxaebftf.supabase.co/rest/v1/com_inquiries',{method:'POST',headers:{'Content-Type':'application/json','apikey':'sb_publishable_4f1Mbi136Y8iuHSk-xub8A_43uK3Wiy','Prefer':'return=minimal'},
      body:JSON.stringify({site:'factory',kind:st.urgent?'urgent':'chat',name:p['성함']||null,phone:ph||null,email:em||null,summary:'[실시간 상담] '+(p['상담 유형']||''),
        data:{'상담 유형':p['상담 유형'],'대화 내용':p['대화 내용'],'운영시간 여부':p['운영시간 여부']},lang:lc==='KO'?'KR':lc,page:(p['페이지']||'').split('?')[0]})}).catch(function(){}); }catch(e){}
  }
  function send(payload){
    toInbox(payload);
    return fetch(CFG.endpoint,{method:'POST',headers:{'Content-Type':'application/json','Accept':'application/json'},body:JSON.stringify(payload)})
      .then(function(r){ if(!r.ok) throw new Error(r.status); return r.json(); })
      .then(function(j){ if(j && (j.success===false||j.success==='false')) throw new Error(j.message||'fail'); return j; });
  }
  function transcript(){ return st.msgs.filter(function(m){return m.r!=='sys';}).map(function(m){return (m.r==='me'?'고객: ':'HOMI: ')+m.t;}).join('\n'); }

  fab.addEventListener('click',function(){ setOpen(!st.open,true); });
  document.addEventListener('keydown',function(e){ if(e.key==='Escape'&&st.open) setOpen(false,true); });

  pn.addEventListener('click',function(e){
    var a=e.target.closest('[data-a]'), chip=e.target.closest('[data-t]');
    if(chip){ st.type=chip.getAttribute('data-t'); push('me',st.type); push('bot',st.urgent?('['+st.type+'] 긴급 건으로 담당자에게 먼저 알릴게요.\n상황을 짧게 남겨 주세요. 지금 바로 통화가 필요하면 '+CFG.phone+' 로 전화 주세요.'):(st.type+' 상담이시군요.\n준비 중인 활동과 고민을 편하게 남겨 주세요. 일정·지역 등 아는 만큼만 적어 주셔도 괜찮아요.')); render(); var ta=pn.querySelector('textarea'); if(ta) ta.focus(); return; }
    if(!a) return;
    var k=a.getAttribute('data-a');
    if(k==='close') setOpen(false,true);
    else if(k==='home'||k==='tab-home'){ st.view='home'; save(); render(); }
    else if(k==='tab-chat') startChat();
    else if(k==='tab-set'){ st.view='set'; save(); render(); }
    else if(k==='reset'){ st={msgs:[],view:'home',open:true,seen:true}; save(); render(); }
    else if(k==='hours'){ st.hours=!st.hours; save(); render(); }
    else if(k==='start'){ if(st.urgent){ st={msgs:[],view:'home',open:true,seen:true}; } startChat(); }
    else if(k==='urgent'){ if(!st.urgent||st.sent){ st={msgs:[],view:'home',open:true,seen:true}; } st.urgent=true; st.view='chat'; if(!st.msgs.length){ push('me','급한 일이에요'); push('bot','담당자에게 먼저 연결해 드릴게요.\n어떤 상황인가요?'); } save(); render(); var f0=pn.querySelector('.hc-chip'); if(f0) f0.focus(); }
    else if(k==='kakao'){ if(CFG.kakaoUrl){ window.open(CFG.kakaoUrl,'_blank','noopener'); } else { st.kakaoMsg=true; save(); render(); } }
    else if(k==='tel'){ if(window.matchMedia('(pointer:coarse)').matches){ location.href='tel:'+CFG.phone.replace(/-/g,''); } else { st.telShown=true; save(); render(); } }
  });

  pn.addEventListener('keydown',function(e){
    if(e.target.matches('.hc-input textarea') && e.key==='Enter' && !e.shiftKey && !e.isComposing){ e.preventDefault(); e.target.form.requestSubmit(); }
  });

  pn.addEventListener('submit',function(e){
    e.preventDefault();
    var f=e.target;
    if(f.matches('[data-i]')){
      var ta=f.querySelector('textarea'), v=ta.value.trim(); if(!v) return;
      push('me',v);
      if(!st.sent){
        st.ask=true; push('bot',on()?'확인했어요. 답변 받으실 성함과 연락처를 남겨 주시면 담당자가 바로 연락드릴게요.':'지금은 운영시간이 아니에요. 성함과 연락처를 남겨 주시면 다음 운영시간에 먼저 연락드릴게요.');
        save(); render(); var n=pn.querySelector('.hc-form input[name=name]'); if(n) n.focus();
      } else {
        save(); render();
        send({_subject:'[HOMI FACTORY 상담·추가] '+st.type+' · '+st.name,_template:'table','상담 유형':st.type,'성함':st.name,'연락처':st.contact,'추가 메시지':v,'페이지':location.href})
          .then(function(){ push('sys','전달됐어요'); render(); })
          .catch(function(){ push('sys','전송에 실패했어요. '+CFG.email+' 로 보내 주세요.'); render(); });
      }
      return;
    }
    if(f.matches('[data-f]')){
      var name=f.name.value.trim(), contact=f.contact.value.trim(), err=f.querySelector('.hc-err'), btn=f.querySelector('button[type=submit]');
      st.name=name; st.contact=contact; save();
      if(f._honey.value) return;
      if(!name||!contact){ err.textContent='성함과 연락처를 입력해 주세요.'; return; }
      if(!/@/.test(contact) && contact.replace(/\D/g,'').length<9){ err.textContent='전화번호 또는 이메일 형식을 확인해 주세요.'; return; }
      if(!f.agree.checked){ err.textContent='개인정보 수집·이용에 동의해 주세요.'; return; }
      btn.disabled=true; btn.textContent='보내는 중…'; err.textContent='';
      send({_subject:(st.urgent?'[HOMI FACTORY 긴급] ':'[HOMI FACTORY 상담] ')+st.type+' · '+name,_template:'table','상담 유형':st.type,'성함':name,'연락처':contact,'대화 내용':transcript(),'운영시간 여부':on()?'운영시간 내':'운영시간 외','페이지':location.href})
        .then(function(){ st.sent=true; push('bot','접수됐어요, '+name+'님. 운영시간(평일 10:00~22:00) 안에 담당자가 '+contact+' (으)로 연락드릴게요.\n더 전하실 내용이 있으면 이어서 남겨 주세요.'); render(); })
        .catch(function(){ btn.disabled=false; btn.textContent='보내기'; err.innerHTML='전송에 실패했어요. 잠시 후 다시 시도하시거나 <a href="mailto:'+CFG.email+'">'+CFG.email+'</a> 로 보내 주세요.'; });
    }
  });
  function on(){ return inHours(); }

  document.addEventListener('focusin',function(e){ if(e.target.matches('input,textarea,select')&&!pn.contains(e.target)) document.documentElement.classList.add('hc-typing'); });
  document.addEventListener('focusout',function(e){ if(!pn.contains(e.target)) document.documentElement.classList.remove('hc-typing'); });
  /* 이전 버튼(alert) 제거 + 상태 복원 */
  document.querySelectorAll('.channel-btn').forEach(function(b){ b.remove(); });
  render(); if(st.open) setOpen(true,false);
})();
