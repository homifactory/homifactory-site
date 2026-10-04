/* HOMI 공통 헤더 컴포넌트 (FR-COM-001·002·003, FR-COM-004·005, FR-MKT-001·029)
   - 3개 사이트가 같은 마크업·동작을 쓰고, 사이트별로 메뉴 설정과 색·톤(CSS 변수)만 다르다
   - 로고를 누르면 해당 사이트 Home (FR-COM-002)
   - 지금 보고 있는 메뉴에 밑줄 (FR-COM-003): 페이지 기준 + Home 안 구간(How We Work·Case)은 스크롤 위치 기준
   사용: <body data-site="market" data-page="home" [data-header="fixed"]>
         <header id="homi-header"></header><script src="/shared/homi-header.js?v=..."></script> */
(function () {
  var slot = document.getElementById('homi-header');
  if (!slot) return;
  var body = document.body;
  var site = body.getAttribute('data-site') || 'market';
  var page = body.getAttribute('data-page') || '';

  var ICON = {
    'user-plus': '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M19 8v6M22 11h-6"/>',
    volume: '<path d="M11 5 6 9H2v6h4l5 4V5z"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/><path d="M19 5a10 10 0 0 1 0 14"/>',
    users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
    box: '<path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/><path d="m7.5 4.3 9 5.1"/>',
    store: '<path d="M4 10v10h16V10"/><path d="M3 4h18l1 5a3 3 0 0 1-5 1 3 3 0 0 1-5 0 3 3 0 0 1-5 0 3 3 0 0 1-5-1z"/><path d="M10 20v-5h4v5"/>',
    plane: '<path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/>',
    globe: '<circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/>',
    bag: '<path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/>',
    rocket: '<path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/>',
    stall: '<path d="M3 7h18"/><path d="M4 7l1.5-3h13L20 7"/><path d="M6 7v14M18 7v14"/><path d="M6 11h12"/><path d="M10 7v4M14 7v4"/>'
  };
  function svg(name, w) {
    return '<svg viewBox="0 0 24 24" width="' + (w || 20) + '" height="' + (w || 20) + '" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + ICON[name] + '</svg>';
  }

  /* ── 사이트별 설정 — 메뉴·링크만 다르고 구조는 같다 ── */
  var SITES = {
    market: {
      name: 'HOMI', sub: 'MARKET', home: '/market/', logo: '/assets/logo-symbol.png',
      menu: [
        { key: 'home', label: 'Home', href: '/market/' },
        { key: 'service', label: '서비스', mega: [
          { title: '인플루언서 마케팅', href: '/market/service-influencer', items: [
            ['svc-mega', 'user-plus', '메가 인플루언서·셀럽', '브랜드의 얼굴(모델)이 필요해요'],
            ['svc-macro', 'volume', '매크로 인플루언서', '브랜드의 화제성과 노출이 필요해요'],
            ['svc-micro', 'users', '마이크로 인플루언서', '일상 속에서 자연스럽게 퍼지게 하고 싶어요'],
            ['svc-nano', 'box', '나노·체험단', '제품을 써본 실제 후기가 많이 필요해요']] },
          { title: '방문 프로모션', href: '/market/service-visit', items: [
            ['svc-domestic', 'store', '국내 인플루언서 방문', '동네·상권 손님에게 우리 매장을 알리고 싶어요'],
            ['svc-inbound', 'plane', '해외 인플루언서 한국 방문', '한국에 오는 외국인 손님을 매장으로 부르고 싶어요'],
            ['svc-overseas', 'globe', '해외 현지 매장 방문', '해외 매장·입점처를 현지 손님에게 알리고 싶어요']] },
          { title: '팝업 및 행사 운영', href: '/market/service-event', items: [
            ['svc-popup', 'bag', '브랜드 팝업스토어', '팝업으로 브랜드를 직접 경험하게 하고 싶어요'],
            ['svc-launch', 'rocket', '런칭·쇼케이스', '신제품 런칭을 크게 알리고 싶어요'],
            ['svc-festival', 'stall', '축제·페스티벌 부스', '행사 현장에서 고객을 직접 만나고 싶어요']] }
        ] },
        { key: 'how', label: 'How We Work', href: '/market/#how-we-work', spy: 'how-we-work' },
        { key: 'case', label: 'Case', href: '/market/#case', spy: 'case' }
      ],
      langs: [{ code: 'KR', label: '한국어 · KR', href: '/market/' }],   /* 번역이 준비된 언어만 노출 (FR-COM-006) */
      siblings: [{ label: 'HOMI PRODUCTION', href: '/production/' }],
      cta: { label: '무료 상담 받기', href: '/market/contact' }
    },
    factory: {
      name: 'HOMI', sub: 'FACTORY', home: '/', logo: '/assets/logo-symbol.png',
      menu: [
        { key: 'home', label: 'Home', href: '/' },
        { key: 'about', label: 'About us', href: '/about' },
        { key: 'business', label: 'Business', href: '/service-marketing' },
        { key: 'contact', label: 'Contact', href: '/contact' }
      ],
      langs: [{ code: 'KR', label: '한국어 · KR', href: '/' }, { code: 'ID', label: 'Bahasa · ID', href: '/id/' }],
      siblings: [{ label: 'HOMI PRODUCTION', href: '/production/' }]
    },
    production: {
      name: 'HOMI', sub: 'PRODUCTION', home: '/production/', logo: '/assets/logo-symbol.png',
      menu: [
        { key: 'visual', label: 'VISUAL WORKS', href: '/production/' },
        { key: 'commercial', label: 'COMMERCIAL WORKS', href: '/production/commercial-works' },
        { key: 'studio', label: 'STUDIO', href: '/production/studio' },
        { key: 'contact', label: 'CONTACT', href: '/production/contact' }
      ],
      langs: [{ code: 'KR', label: '한국어 · KR', href: '/production/' }],
      siblings: [{ label: 'HOMI FACTORY', href: '/' }],
      cta: { label: '문의하기', href: '/production/contact' }
    }
  };
  var C = SITES[site] || SITES.market;
  var lang = C.langs[0];

  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  function megaCols(m) {
    return m.map(function (col) {
      return '<div class="hh-col"><a class="hh-col-title" href="' + col.href + '">' + esc(col.title) + '</a>' +
        col.items.map(function (it) {
          return '<a class="hh-mi" href="' + col.href + '#' + it[0] + '"><span class="hh-ic">' + svg(it[1]) + '</span>' +
            '<span class="hh-tx"><span class="hh-lb">' + esc(it[2]) + '</span><span class="hh-gl">' + esc(it[3]) + '</span></span></a>';
        }).join('') + '</div>';
    }).join('');
  }
  var GLOBE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><circle cx="12" cy="12" r="9.5"/><path d="M2.5 12h19M12 2.5c2.6 2.6 3.9 6 3.9 9.5S14.6 18.9 12 21.5C9.4 18.9 8.1 15.5 8.1 12S9.4 5.1 12 2.5z"/></svg>';

  var center = C.menu.map(function (it) {
    if (it.mega) {
      return '<li class="hh-has-mega"><button type="button" class="hh-link" data-key="' + it.key + '" aria-expanded="false" aria-haspopup="true" aria-controls="hh-mega">' +
        esc(it.label) + ' <span class="hh-caret" aria-hidden="true">▾</span></button>' +
        '<div class="hh-mega" id="hh-mega"><div class="hh-mega-grid">' + megaCols(it.mega) + '</div></div></li>';
    }
    return '<li><a class="hh-link" data-key="' + it.key + '" href="' + it.href + '">' + esc(it.label) + '</a></li>';
  }).join('');

  var langHtml = '<div class="hh-lang"><button type="button" class="hh-lang-btn" aria-haspopup="true" aria-expanded="false" aria-label="언어 선택, 현재 ' + lang.code + '">' + GLOBE +
    '<span>' + C.langs.map(function (l) { return l.code; }).join(' / ') + '</span><span class="hh-caret" aria-hidden="true">▾</span></button>' +
    '<ul class="hh-lang-menu">' + C.langs.map(function (l, i) { return '<li><a href="' + l.href + '"' + (i === 0 ? ' aria-current="true"' : '') + '>' + esc(l.label) + '</a></li>'; }).join('') + '</ul></div>';
  var sibHtml = C.siblings.map(function (s) { return '<a class="hh-sib" href="' + s.href + '">' + esc(s.label) + ' <span aria-hidden="true">↗</span></a>'; }).join('');
  var ctaHtml = C.cta ? '<a class="hh-cta" href="' + C.cta.href + '">' + esc(C.cta.label) + '</a>' : '';

  var panel = C.menu.map(function (it) {
    if (it.mega) {
      return '<button type="button" class="hh-pacc" data-key="' + it.key + '" aria-expanded="false"><span class="hh-ptxt">' + esc(it.label) + '</span><span class="hh-caret" aria-hidden="true">▾</span></button>' +
        '<div class="hh-psub">' + megaCols(it.mega) + '</div>';
    }
    return '<a class="hh-plink" data-key="' + it.key + '" href="' + it.href + '"><span>' + esc(it.label) + '</span></a>';
  }).join('') + '<div class="hh-pfoot"><div class="hh-plang" aria-label="언어">' +
    C.langs.map(function (l, i) { return '<a href="' + l.href + '"' + (i === 0 ? ' aria-current="true"' : '') + '>' + esc(l.label) + '</a>'; }).join('') +
    '</div>' + sibHtml + ctaHtml + '</div>';

  slot.innerHTML =
    '<div class="hh" data-site="' + site + '">' +
      '<div class="hh-in">' +
        '<div class="hh-left"><a class="hh-logo" href="' + C.home + '" aria-label="' + C.name + ' ' + C.sub + ' Home">' +
          '<img src="' + C.logo + '" alt="" width="26" height="28"><span class="hh-logo-text">' + C.name + ' <span>' + C.sub + '</span></span></a></div>' +
        '<nav class="hh-center" aria-label="주 메뉴"><ul class="hh-menu">' + center + '</ul></nav>' +
        '<div class="hh-right">' + langHtml + sibHtml + ctaHtml +
          '<button type="button" class="hh-burger" aria-label="메뉴 열기" aria-expanded="false" aria-controls="hh-panel"><span></span></button></div>' +
      '</div>' +
      '<nav class="hh-panel" id="hh-panel" aria-label="모바일 메뉴">' + panel + '</nav>' +
    '</div>';

  var hh = slot.firstChild;
  var fixed = body.getAttribute('data-header') === 'fixed';

  /* ── 위치: 고정 배너가 있으면 그 바로 아래 ── */
  function place() {
    var top = 0;
    var ban = document.querySelector('.trend-banner,.renewal-banner');
    if (ban && getComputedStyle(ban).position === 'fixed') top = Math.max(0, Math.round(ban.getBoundingClientRect().bottom));
    hh.style.top = top + 'px';
    if (fixed) { hh.style.position = 'fixed'; hh.style.left = '0'; hh.style.right = '0'; slot.style.minHeight = '0'; }
    var bottom = Math.round(hh.getBoundingClientRect().bottom);
    hh.style.setProperty('--hh-bottom', bottom + 'px');
    document.documentElement.style.setProperty('--hh-offset', bottom + 'px');
    document.documentElement.style.scrollPaddingTop = (bottom + 16) + 'px';
  }
  place();
  window.addEventListener('resize', place);
  window.addEventListener('load', place);

  /* ── 현재 메뉴 밑줄 (FR-COM-003) ── */
  var links = hh.querySelectorAll('[data-key]');
  function setCurrent(key) {
    links.forEach(function (a) {
      var on = a.getAttribute('data-key') === key;
      a.classList.toggle('is-current', on);
      if (a.tagName === 'A') { if (on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); }
    });
  }
  setCurrent(page);
  /* Home 안의 구간 메뉴(How We Work·Case): 그 구간이 화면 위쪽에 와 있는 동안 밑줄 */
  var spies = C.menu.filter(function (m) { return m.spy; });
  if (page === 'home' && spies.length) {
    var ticking = false;
    function spy() {
      ticking = false;
      /* 헤더가 본문보다 먼저 그려지므로 구간은 매번 찾는다 */
      var spyEls = spies.map(function (m) { return { key: m.key, el: document.getElementById(m.spy) }; }).filter(function (s) { return s.el; });
      var line = (parseInt(getComputedStyle(document.documentElement).getPropertyValue('--hh-offset'), 10) || 0) + window.innerHeight * 0.3;
      var cur = 'home';
      spyEls.forEach(function (s) { var r = s.el.getBoundingClientRect(); if (r.top <= line && r.bottom > line) cur = s.key; });
      setCurrent(cur);
    }
    window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(spy); } }, { passive: true });
    window.addEventListener('hashchange', spy);
    window.addEventListener('load', spy);
    document.addEventListener('DOMContentLoaded', spy);
  }

  /* ── 드롭다운: 마우스 올림 · 클릭 · 키보드 · Esc (FR-COM-004) ── */
  function dropdown(wrap, trigger) {
    var t;
    function set(o) { wrap.classList.toggle('open', o); trigger.setAttribute('aria-expanded', o ? 'true' : 'false'); }
    if (window.matchMedia('(hover:hover)').matches) {
      wrap.addEventListener('mouseenter', function () { clearTimeout(t); set(true); });
      wrap.addEventListener('mouseleave', function () { t = setTimeout(function () { set(false); }, 140); });
    }
    trigger.addEventListener('click', function (e) { e.preventDefault(); set(!wrap.classList.contains('open')); });
    wrap.addEventListener('focusout', function (e) { if (!wrap.contains(e.relatedTarget)) set(false); });
    document.addEventListener('click', function (e) { if (!wrap.contains(e.target)) set(false); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && wrap.classList.contains('open')) { set(false); trigger.focus(); } });
  }
  var mega = hh.querySelector('.hh-has-mega');
  if (mega) dropdown(mega, mega.querySelector('.hh-link'));
  var lg = hh.querySelector('.hh-lang');
  dropdown(lg, lg.querySelector('.hh-lang-btn'));

  /* ── 모바일 메뉴 패널 (FR-COM-005) ── */
  var burger = hh.querySelector('.hh-burger'), pnl = hh.querySelector('.hh-panel');
  function setPanel(o) {
    pnl.classList.toggle('open', o); burger.setAttribute('aria-expanded', o ? 'true' : 'false');
    burger.setAttribute('aria-label', o ? '메뉴 닫기' : '메뉴 열기');
    document.documentElement.style.overflow = o ? 'hidden' : '';
    document.documentElement.classList.toggle('hh-menu-open', o);  /* 열려 있는 동안 떠 있는 버튼(상담 등) 숨김 */
    if (o) place();
  }
  burger.addEventListener('click', function () { setPanel(!pnl.classList.contains('open')); });
  pnl.addEventListener('click', function (e) {
    var acc = e.target.closest('.hh-pacc');
    if (acc) { var sub = acc.nextElementSibling, o = !sub.classList.contains('open'); sub.classList.toggle('open', o); acc.setAttribute('aria-expanded', o ? 'true' : 'false'); return; }
    if (e.target.closest('a')) setPanel(false);
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && pnl.classList.contains('open')) { setPanel(false); burger.focus(); } });
  window.matchMedia('(min-width:901px)').addEventListener('change', function (m) { if (m.matches) setPanel(false); });

  /* ── 서비스 카드 위치로 이동했을 때 해당 카드 잠깐 강조 ── */
  function land() {
    if (!/^#svc-/.test(location.hash)) return;
    var el = document.getElementById(location.hash.slice(1)); if (!el) return;
    el.classList.remove('hh-target'); void el.offsetWidth; el.classList.add('hh-target');
  }
  window.addEventListener('hashchange', land); window.addEventListener('load', land);
})();
