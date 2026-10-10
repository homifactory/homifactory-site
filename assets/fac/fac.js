/* HOMI FACTORY 공통 동작
   ① Business ▾ 하위 메뉴에서 지금 페이지 표시 (FR-COM-003 보조)
   ② 문의폼 공통 동작 + 스팸 방지 (FR-COM-008·009)
   ③ Home 히어로 배경 영상 (FR-COM-015) */
(function () {
  /* 어두운 머리줄: 흰색 심볼 로고로 바꿔 끼움 */
  function whiteLogo(){var im=document.querySelector('.hh[data-site="factory"] .hh-logo img');if(im&&im.src.indexOf('logo-symbol-white')<0){im.src='/assets/logo-symbol-white.png';return true}return !!im}
  if(!whiteLogo()){document.addEventListener('DOMContentLoaded',whiteLogo);setTimeout(whiteLogo,600)}

  'use strict';

  /* ── ① 지금 보고 있는 Business 하위 페이지 ── */
  function markSub() {
    var here = location.pathname.replace(/\.html$/, '').replace(/\/$/, '') || '/';
    document.querySelectorAll('.hh[data-site="factory"] .hh-col-title').forEach(function (a) {
      var h = (a.getAttribute('href') || '').replace(/\.html$/, '').replace(/\/$/, '');
      if (h && h === here) a.setAttribute('aria-current', 'page');
    });
  }
  markSub();

  /* ── ② 문의폼 (form[data-fac-form]) ── */
  var MAIL = 'https://formsubmit.co/ajax/support@homifactory.com';
  var STORE = 'https://hook.us2.make.com/ygeoee1dy78ed05ce2ifrddovcs62sfh';   /* MARKET·PRODUCTION 과 같은 접수 기록 시트 */
  var MSG = {
    req: '필수 항목이에요. 내용을 입력해 주세요.',
    email: '이메일 형식을 확인해 주세요. (예: name@company.com)',
    phone: '전화번호 형식을 확인해 주세요. (예: 010-1234-5678)',
    agree: '개인정보 수집·이용에 동의해 주셔야 보낼 수 있어요.',
    pick: '하나 이상 골라 주세요.',
    top: '입력 내용을 확인해 주세요. 표시된 칸을 고치면 바로 보낼 수 있어요.',
    sending: '보내는 중…',
    fail: '전송에 실패했어요. 잠시 후 다시 시도하시거나 <a href="mailto:support@homifactory.com">support@homifactory.com</a> 으로 보내 주세요.'
  };
  var isEmail = function (v) { return /^[^\s@]+@[^\s@]+\.[A-Za-z]{2,}$/.test(v); };
  var isPhone = function (v) { return /^\+?\d{9,15}$/.test(v.replace(/[\s\-().]/g, '')); };

  document.querySelectorAll('form[data-fac-form]').forEach(function (f) {
    f.noValidate = true;
    f.removeAttribute('action');
    var n = 0;
    function box(el) { return el.closest('.privacy-check') || el.closest('.form-field') || el.parentNode; }
    function setErr(el, msg) {
      var b = box(el), p = b.querySelector(':scope > .cf-err');
      if (!msg) { if (p) p.remove(); el.removeAttribute('aria-invalid'); b.classList.remove('is-invalid'); return true; }
      if (!p) { p = document.createElement('p'); p.className = 'cf-err'; p.id = 'fac-err-' + (++n); p.setAttribute('role', 'alert'); b.appendChild(p); }
      p.textContent = msg; el.setAttribute('aria-invalid', 'true'); el.setAttribute('aria-describedby', p.id); b.classList.add('is-invalid'); return false;
    }
    function check(el) {
      var v = (el.value || '').trim();
      var grp = el.closest('[data-req-group]');
      if (grp) { var any = grp.querySelector('input:checked'); var first = grp.querySelector('input'); return setErr(first, any ? '' : MSG.pick); }
      if (el.type === 'checkbox') return setErr(el, el.checked ? '' : MSG.agree);
      if (el.required && !v) return setErr(el, MSG.req);
      if (el.type === 'email' && v && !isEmail(v)) return setErr(el, MSG.email);
      if (el.type === 'tel' && v && !isPhone(v)) return setErr(el, MSG.phone);
      return setErr(el, '');
    }
    function fields() {
      return [].slice.call(f.querySelectorAll('input:not([type=hidden]):not(.cf-hp),select,textarea'))
        .filter(function (el) {
          var grp = el.closest('[data-req-group]');
          if (grp) return el === grp.querySelector('input');
          return el.required || el.type === 'email' || el.type === 'tel';
        });
    }
    f.addEventListener('blur', function (e) { var t = e.target; if (t.matches('input,select,textarea') && (t.value || t.getAttribute('aria-invalid'))) check(t); }, true);
    f.addEventListener('input', function (e) { if (e.target.getAttribute('aria-invalid')) check(e.target); });
    f.addEventListener('change', function (e) {
      var grp = e.target.closest && e.target.closest('[data-req-group]');
      var t = grp ? grp.querySelector('input') : e.target;
      if (t.getAttribute('aria-invalid')) check(t);
    });

    var top = document.createElement('p'); top.className = 'cf-top-err'; top.setAttribute('role', 'alert'); top.hidden = true;
    var btn = f.querySelector('[type=submit]'); btn.classList.add('cf-submit'); btn.insertAdjacentElement('afterend', top);

    function done() {
      var d = document.createElement('div');
      d.className = 'cf-done'; d.tabIndex = -1; d.setAttribute('role', 'status');
      d.innerHTML = '<div class="cf-done-ic" aria-hidden="true">✓</div><h3>문의가 접수되었어요</h3>' +
        '<p>남겨 주신 내용을 확인한 뒤 <strong>2영업일 안에</strong> 담당자가 연락드릴게요.</p>' +
        '<p>급한 일은 <a href="tel:01040262695">010-4026-2695</a> 또는 <a href="mailto:support@homifactory.com">support@homifactory.com</a> 으로 알려 주세요.</p>' +
        '<a class="cf-done-btn" href="/">HOMI FACTORY 홈으로</a>';
      f.hidden = true; f.parentNode.insertBefore(d, f.nextSibling); d.focus(); d.scrollIntoView({ block: 'center' });
    }
    if (/[?&]sent=1/.test(location.search)) done();

    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var bad = fields().filter(function (el) { return !check(el); });
      if (bad.length) { top.textContent = MSG.top; top.hidden = false; bad[0].focus(); return; }
      top.hidden = true;
      var hp = f.querySelector('.cf-hp');
      if (hp && hp.value) { done(); return; }   /* 스팸(숨은 칸이 채워짐): 보내지 않고 끝낸 것처럼 */
      var label = btn.innerHTML; btn.disabled = true; btn.textContent = MSG.sending;
      var g = function (name) { var el = f.elements[name]; return el ? (el.value || '').trim() : ''; };
      var multi = function (name) { return [].slice.call(f.querySelectorAll('input[type=checkbox][name="' + name + '"]:checked')).map(function (x) { return x.value; }).join(', '); };
      var want = multi('관심 분야') || multi('관심 있는 일') || g('문의유형');
      var mail = { _subject: '[HOMI FACTORY 문의] ' + (g('이름') || g('담당자명')) + (want ? ' · ' + want : ''), _cc: g('_cc'), _template: 'table', _captcha: 'false', _honey: '' };
      [].slice.call(f.querySelectorAll('input:not([type=hidden]):not(.cf-hp),select,textarea')).forEach(function (el) {
        if (!el.name || el.name === '개인정보동의') return;
        if (el.type === 'checkbox') { mail[el.name] = multi(el.name); return; }
        mail[el.name] = (el.value || '').trim();
      });
      mail['개인정보 동의'] = '동의'; mail['접수 페이지'] = location.href.split('?')[0];
      /* 접수 기록(⑥): 시트 칸 이름이 MARKET 기준이라 맞춰 넣고, 방향 칸에 [FACTORY] 표시 */
      var row = { lang: 'KR', brand: g('소속') || g('회사명'), link: '', dir: '[FACTORY] ' + want, countries: multi('활동 지역'), channel: '',
        concern: g('문의 내용') || g('지금 고민하고 있는 것') || g('프로젝트내용'), goal: '', timing: g('활동 예정 시기'), budget: '',
        name: g('이름') || g('담당자명'), phone: g('연락처'), email: g('이메일'), page: mail['접수 페이지'], hp: '' };
      var post = function (u, b) { return fetch(u, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(b) }).then(function (r) { if (!r.ok) throw new Error(r.status); return r; }); };
      var a = post(MAIL, mail).then(function (r) { return r.json(); }).then(function (j) { if (j && (j.success === false || j.success === 'false')) throw new Error('mail'); return true; });
      var s = post(STORE, row);
      /* 통합 관리자 문의함(Supabase com_inquiries) — FR-COM-019, MARKET·PRODUCTION 과 같은 곳 */
      var db = fetch('https://bcngbtwzuqtwtxaebftf.supabase.co/rest/v1/com_inquiries', { method: 'POST', headers: { 'Content-Type': 'application/json', apikey: 'sb_publishable_4f1Mbi136Y8iuHSk-xub8A_43uK3Wiy', Prefer: 'return=minimal' },
        body: JSON.stringify({ site: 'factory', kind: 'inquiry', name: row.name, phone: row.phone, email: row.email, summary: row.brand, lang: 'KR', page: row.page,
          data: { '소속': row.brand, '관심 분야': want, '문의 내용': row.concern } }) }).then(function (r) { if (!r.ok) throw new Error(r.status); return true; });
      Promise.allSettled([a, s, db]).then(function (rs) {
        if (rs.some(function (x) { return x.status === 'fulfilled'; })) done();
        else { btn.disabled = false; btn.innerHTML = label; top.innerHTML = MSG.fail; top.hidden = false; }
      });
    });
  });

  /* ── ④ 일하는 방식 3원칙·숫자 4개 (FR-FAC-014) — /assets/fac/data/site.json 한 곳만 고치면 Home·About 둘 다 바뀐다 ── */
  var slots = document.querySelectorAll('[data-fac]');
  if (slots.length && window.fetch) {
    var esc = function (t) { return String(t == null ? '' : t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
    fetch('/assets/fac/data/site.json', { cache: 'no-cache' }).then(function (r) { return r.ok ? r.json() : null; }).then(function (d) {
      if (!d) return;
      slots.forEach(function (el) {
        var k = el.getAttribute('data-fac');
        if (k === 'stats' && d.stats) el.innerHTML = d.stats.map(function (x) { return '<div class="f-stat"><b>' + esc(x.num) + '</b><span>' + esc(x.label) + '</span>' + (x.note ? '<small>' + esc(x.note) + '</small>' : '') + '</div>'; }).join('');
        if (k === 'principles' && d.principles) el.innerHTML = d.principles.map(function (x) { return '<article class="x-card"><i>' + esc(x.no) + ' <span>' + esc(x.en || '') + '</span></i><h3>' + esc(x.title) + '</h3><p>' + esc(x.text) + '</p></article>'; }).join('');
      });
    }).catch(function () {});
  }

  /* ── ③ 히어로 배경 영상 (FR-COM-015) ──
     영상이 준비되면 아래 HERO 에 주소만 넣으면 된다.
     컷 3~4개는 편집에서 0.5초 크로스페이드로 이어 붙인 24~30초 한 파일(소리 없음).
     desktop: 1080p MP4, mobile: 720p MP4(비우면 모바일은 정지 이미지), poster: 첫 프레임 정지 이미지 */
  var HERO = { desktop: '/assets/fac/hero/hero-f-1080.mp4', mobile: '/assets/fac/hero/hero-f-720.mp4', poster: '/assets/fac/hero/hero-f-poster.jpg' };   /* HERO-F · 4컷(연습실·공연장·지하철·공항) 26초 루프 */
  var hero = document.querySelector('.fac-hero');
  if (hero) {
    var media = hero.querySelector('.fac-hero-media');
    if (HERO.poster) { media.style.setProperty('--fac-poster', 'url("' + HERO.poster + '")'); media.classList.add('has-poster'); }
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var mobile = window.matchMedia('(max-width: 900px)').matches;
    var src = mobile ? HERO.mobile : HERO.desktop;
    if (src && !reduce) {
      var v = document.createElement('video');
      v.muted = true; v.defaultMuted = true; v.loop = true; v.autoplay = true; v.playsInline = true;
      v.setAttribute('muted', ''); v.setAttribute('playsinline', ''); v.setAttribute('webkit-playsinline', '');
      v.setAttribute('aria-hidden', 'true'); v.preload = 'auto';
      if (HERO.poster) v.poster = HERO.poster;
      v.src = src;
      v.addEventListener('playing', function () { v.classList.add('on'); });
      v.addEventListener('error', function () { v.remove(); });   /* 실패하면 정지 화면 유지 */
      media.appendChild(v);
      var tryPlay = function () { var p = v.play(); if (p && p.catch) p.catch(function () {}); };
      /* 화면 밖으로 나가면 일시정지 (⑤) */
      if ('IntersectionObserver' in window) {
        new IntersectionObserver(function (es) { es.forEach(function (en) { if (en.isIntersecting) tryPlay(); else v.pause(); }); }, { threshold: 0.05 }).observe(hero);
      } else tryPlay();
      document.addEventListener('visibilitychange', function () { if (document.hidden) v.pause(); });
    }
  }
})();
