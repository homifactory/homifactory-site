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
    'person-star': '<circle cx="9" cy="7" r="4"/><path d="M2 21v-2a4 4 0 0 1 4-4h5"/><path d="m18 12.5 1.5 3 3.2.5-2.35 2.3.55 3.2-2.9-1.5-2.9 1.5.55-3.2L13.3 16l3.2-.5z"/>',
    megaphone: '<path d="m3 11 15-6v14L3 13z"/><path d="M18 9.5a3 3 0 0 1 0 5"/><path d="M6.5 13.6 8 20h3l-1.3-5.5"/>',
    booth: '<path d="M2 3.5c3.3 1.7 6.7 2.5 10 2.5s6.7-.8 10-2.5"/><path d="m5.2 4.8.9 2.7 1.6-2M10.6 5.9l1.4 2.6 1.4-2.6M16.3 5.5l1.6 2 .9-2.7"/><path d="M3.5 13h17l-1.6-3.5H5.1z"/><path d="M5 13v8M19 13v8M5 17h14"/>',
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
            ['svc-mega', 'person-star', '메가 인플루언서·셀럽', '브랜드의 얼굴(모델)이 필요해요'],
            ['svc-macro', 'megaphone', '매크로 인플루언서', '브랜드의 화제성과 노출이 필요해요'],
            ['svc-micro', 'users', '마이크로 인플루언서', '일상 속에서 자연스럽게 퍼지게 하고 싶어요'],
            ['svc-nano', 'box', '나노·체험단', '제품을 써본 실제 후기가 많이 필요해요']] },
          { title: '방문 프로모션', href: '/market/service-visit', items: [
            ['svc-domestic', 'store', '국내 인플루언서 방문', '동네·상권 손님에게 우리 매장을 알리고 싶어요'],
            ['svc-inbound', 'plane', '해외 인플루언서 한국 방문', '한국에 오는 외국인 손님을 매장으로 부르고 싶어요'],
            ['svc-overseas', 'globe', '해외 현지 매장 방문', '해외 매장·입점처를 현지 손님에게 알리고 싶어요']] },
          { title: '팝업 및 행사 운영', href: '/market/service-event', items: [
            ['svc-popup', 'bag', '브랜드 팝업스토어', '팝업으로 브랜드를 직접 경험하게 하고 싶어요'],
            ['svc-launch', 'rocket', '런칭·쇼케이스', '신제품 런칭을 크게 알리고 싶어요'],
            ['svc-festival', 'booth', '축제·페스티벌 부스', '행사 현장에서 고객을 직접 만나고 싶어요']] }
        ] },
        { key: 'how', label: 'How We Work', href: '/market/#how-we-work', spy: 'how-we-work' },
        { key: 'case', label: 'Case', href: '/market/#case', spy: 'case' }
      ],
      /* 언어: KR 이 기준. 번역 언어는 prefix(주소 앞에 붙는 경로) + pages(번역된 페이지, '*'=전부)
         또는 map(「한국어 주소 → 번역 주소」)으로 지정. 그 페이지 번역이 없는 언어는 목록에 안 보인다 (FR-COM-006) */
      langs: [{ code: 'KR', label: '한국어 · KR' },
              { code: 'EN', label: 'English · EN', prefix: '/en', pages: '*' },
              { code: 'JA', label: '日本語 · JA', prefix: '/ja', pages: '*' },
              { code: 'ID', label: 'Bahasa Indonesia · ID', prefix: '/id', pages: '*' }],
      siblings: [{ label: 'HOMI PRODUCTION', href: '/production/', newTab: true }],
      cta: { label: '무료 상담 받기', href: '/market/contact' },
      /* 상단 띠 배너 (FR-MKT-026) — 관리자 화면이 생기기 전까지 여기서 문구·링크·노출·표지 이미지를 바꾼다.
         cover: 실제 리포트 표지 이미지 주소(비우면 기본 「글로벌 지도형」 표지) */
      banner: { show: true, small: 'HOMI TREND REPORT 2026', big: ['2026 글로벌 마케팅 트렌드 리포트', '나라별 전략을 먼저 확인하세요'],
                href: '/market/trend-report.html', cover: '' }
    },
    factory: {
      name: 'HOMI', sub: 'FACTORY', home: '/', logo: '/assets/logo-symbol.png',
      menu: [
        { key: 'home', label: 'Home', href: '/' },
        { key: 'about', label: 'About us', href: '/about' },
        { key: 'business', label: 'Business', href: '/service-marketing' },
        { key: 'contact', label: 'Contact', href: '/contact' }
      ],
      langs: [{ code: 'KR', label: '한국어 · KR' }, { code: 'ID', label: 'Bahasa · ID', map: { '/': '/id/' } }],
      siblings: [{ label: 'HOMI PRODUCTION', href: '/production/', newTab: true }]
    },
    production: {
      name: 'HOMI', sub: 'PRODUCTION', home: '/production/', logo: '/assets/logo-symbol.png',
      menu: [
        { key: 'visual', label: 'VISUAL WORKS', href: '/production/' },
        { key: 'commercial', label: 'COMMERCIAL WORKS', href: '/production/commercial-works' },
        { key: 'studio', label: 'STUDIO', href: '/production/studio' },
        { key: 'contact', label: 'CONTACT', href: '/production/contact' }
      ],
      langs: [{ code: 'KR', label: '한국어 · KR' }],
      siblings: [{ label: 'HOMI FACTORY', href: '/' }],
      cta: { label: '문의하기', href: '/production/contact' }
    }
  };
  var C = SITES[site] || SITES.market;

  /* ── 언어: 지금 페이지의 각 언어 버전 주소 계산 (FR-COM-006) ── */
  function norm(p) { p = p.replace(/\.html$/, '').replace(/\/index$/, '/'); return p.length > 1 ? p.replace(/\/$/, '') || '/' : p; }
  var here = norm(location.pathname), base = here, baseHref = location.pathname, lang = C.langs[0];
  C.langs.forEach(function (l) {
    if (l.prefix && location.pathname.indexOf(l.prefix + '/') === 0) {
      lang = l; baseHref = location.pathname.slice(l.prefix.length); base = norm(baseHref);
    }
    if (!l.map) return;
    Object.keys(l.map).forEach(function (k) { if (norm(l.map[k]) === here) { base = norm(k); baseHref = k; lang = l; } });
  });
  var hash = /^#[\w-]+$/.test(location.hash) ? location.hash : '';
  var langs = C.langs.map(function (l) {
    if (l.prefix) return (l.pages === '*' || (l.pages || []).map(norm).indexOf(base) > -1) ? { l: l, href: l.prefix + baseHref + hash } : null;
    if (!l.map) return { l: l, href: baseHref + hash };
    var hit = Object.keys(l.map).filter(function (k) { return norm(k) === base; })[0];
    return hit ? { l: l, href: l.map[hit] + hash } : null;
  }).filter(Boolean);   /* 이 페이지 번역이 없는 언어는 목록에서 뺀다 */
  function langLinks() {
    return langs.map(function (x) {
      var cur = x.l === lang;
      return '<a href="' + x.href + '" hreflang="' + x.l.code.toLowerCase() + '"' + (cur ? ' aria-current="true"' : '') + '>' + esc(x.l.label) + '</a>';
    });
  }

  /* 헤더 문구 번역 (번역 페이지에서 메뉴·버튼 글자) */
  var I18N = {"EN":{"2026 글로벌 마케팅 트렌드 리포트":"2026 Global Marketing Trend Report","나라별 전략을 먼저 확인하세요":"See country-by-country strategies first","트렌드 리포트":"Trend Report","서비스":"Services","인플루언서 마케팅":"Influencer Marketing","방문 프로모션":"Visit Promotion","팝업 및 행사 운영":"Pop-ups & Events","메가 인플루언서·셀럽":"Mega Influencers & Celebrities","브랜드의 얼굴(모델)이 필요해요":"We need a face (model) for our brand","매크로 인플루언서":"Macro Influencers","브랜드의 화제성과 노출이 필요해요":"We need buzz and reach for our brand","마이크로 인플루언서":"Micro Influencers","일상 속에서 자연스럽게 퍼지게 하고 싶어요":"We want it to spread naturally in everyday life","나노·체험단":"Nano & Product Testers","제품을 써본 실제 후기가 많이 필요해요":"We need lots of real reviews from people who’ve used the product","국내 인플루언서 방문":"Korean influencer visits","동네·상권 손님에게 우리 매장을 알리고 싶어요":"We want to reach customers in our neighborhood and local trade area","해외 인플루언서 한국 방문":"Foreign influencers visiting Korea","한국에 오는 외국인 손님을 매장으로 부르고 싶어요":"We want to bring international visitors in Korea to our store","해외 현지 매장 방문":"Overseas local store visits","해외 매장·입점처를 현지 손님에게 알리고 싶어요":"We want local customers to discover our overseas stores and retailers","브랜드 팝업스토어":"Brand pop-up stores","팝업으로 브랜드를 직접 경험하게 하고 싶어요":"We want people to experience our brand firsthand through a pop-up","런칭·쇼케이스":"Launches · Showcases","신제품 런칭을 크게 알리고 싶어요":"We want to make a big splash with our new product launch","축제·페스티벌 부스":"Festival booths","행사 현장에서 고객을 직접 만나고 싶어요":"We want to meet customers in person at events","무료 상담 받기":"Free Consultation","메뉴 열기":"Open menu","메뉴 닫기":"Close menu","언어 선택, 현재":"Select language, current","언어":"Language","주 메뉴":"Main menu","모바일 메뉴":"Mobile menu","새 탭":"new tab"},"JA":{"2026 글로벌 마케팅 트렌드 리포트":"2026 グローバルマーケティング・トレンドレポート","나라별 전략을 먼저 확인하세요":"国別の戦略をまずチェック","트렌드 리포트":"トレンドレポート","서비스":"サービス","인플루언서 마케팅":"インフルエンサーマーケティング","방문 프로모션":"来店プロモーション","팝업 및 행사 운영":"ポップアップ・イベント運営","메가 인플루언서·셀럽":"メガインフルエンサー・セレブ","브랜드의 얼굴(모델)이 필요해요":"ブランドの顔（モデル）が欲しい","매크로 인플루언서":"マクロインフルエンサー","브랜드의 화제성과 노출이 필요해요":"ブランドの話題性と露出が欲しい","마이크로 인플루언서":"マイクロインフルエンサー","일상 속에서 자연스럽게 퍼지게 하고 싶어요":"日常の中で自然に広めたい","나노·체험단":"ナノ・体験レビュアー","제품을 써본 실제 후기가 많이 필요해요":"商品を実際に使ったレビューをたくさん集めたい","국내 인플루언서 방문":"韓国インフルエンサーの来店","동네·상권 손님에게 우리 매장을 알리고 싶어요":"地元・商圏のお客様に自社の店舗を知ってほしい","해외 인플루언서 한국 방문":"海外インフルエンサーの韓国来店","한국에 오는 외국인 손님을 매장으로 부르고 싶어요":"韓国を訪れる海外のお客様を店舗に呼びたい","해외 현지 매장 방문":"海外現地店舗への来店","해외 매장·입점처를 현지 손님에게 알리고 싶어요":"海外の店舗・出店先を現地のお客様に知ってほしい","브랜드 팝업스토어":"ブランドポップアップストア","팝업으로 브랜드를 직접 경험하게 하고 싶어요":"ポップアップでブランドを直接体験してほしい","런칭·쇼케이스":"ローンチ・ショーケース","신제품 런칭을 크게 알리고 싶어요":"新商品のローンチを大々的に告知したい","축제·페스티벌 부스":"お祭り・フェスティバルブース","행사 현장에서 고객을 직접 만나고 싶어요":"イベント会場でお客様に直接会いたい","무료 상담 받기":"無料相談はこちら","메뉴 열기":"メニューを開く","메뉴 닫기":"メニューを閉じる","언어 선택, 현재":"言語を選択、現在","언어":"言語","주 메뉴":"メインメニュー","모바일 메뉴":"モバイルメニュー","새 탭":"新しいタブ"},"ID":{"2026 글로벌 마케팅 트렌드 리포트":"Laporan Tren Pemasaran Global 2026","나라별 전략을 먼저 확인하세요":"Lihat dulu strategi untuk tiap negara","트렌드 리포트":"Laporan Tren","서비스":"Layanan","인플루언서 마케팅":"Pemasaran Influencer","방문 프로모션":"Promosi Kunjungan","팝업 및 행사 운영":"Pop-up & Event","메가 인플루언서·셀럽":"Mega Influencer & Selebriti","브랜드의 얼굴(모델)이 필요해요":"Saya butuh wajah (model) untuk brand","매크로 인플루언서":"Influencer Makro","브랜드의 화제성과 노출이 필요해요":"Saya butuh gaung dan eksposur untuk brand","마이크로 인플루언서":"Influencer Mikro","일상 속에서 자연스럽게 퍼지게 하고 싶어요":"Saya ingin brand menyebar alami dalam keseharian","나노·체험단":"Nano & Pengulas Produk","제품을 써본 실제 후기가 많이 필요해요":"Saya butuh banyak review nyata dari pemakai produk","국내 인플루언서 방문":"Kunjungan influencer Korea","동네·상권 손님에게 우리 매장을 알리고 싶어요":"Saya ingin memperkenalkan toko ke pelanggan di sekitar","해외 인플루언서 한국 방문":"Kunjungan influencer luar negeri ke Korea","한국에 오는 외국인 손님을 매장으로 부르고 싶어요":"Saya ingin mengajak wisatawan asing di Korea datang ke toko","해외 현지 매장 방문":"Kunjungan ke toko di luar negeri","해외 매장·입점처를 현지 손님에게 알리고 싶어요":"Saya ingin memperkenalkan toko & mitra ritel luar negeri ke pelanggan lokal","브랜드 팝업스토어":"Pop-up store brand","팝업으로 브랜드를 직접 경험하게 하고 싶어요":"Saya ingin pelanggan merasakan brand secara langsung lewat pop-up","런칭·쇼케이스":"Launching · Showcase","신제품 런칭을 크게 알리고 싶어요":"Saya ingin peluncuran produk baru diketahui secara luas","축제·페스티벌 부스":"Booth festival & pameran","행사 현장에서 고객을 직접 만나고 싶어요":"Saya ingin bertemu pelanggan langsung di lokasi acara","무료 상담 받기":"Konsultasi Gratis","메뉴 열기":"Buka menu","메뉴 닫기":"Tutup menu","언어 선택, 현재":"Pilih bahasa, saat ini","언어":"Bahasa","주 메뉴":"Menu utama","모바일 메뉴":"Menu mobile","새 탭":"tab baru"}};
  function T(s) { var d = I18N[lang.code]; return (d && d[s]) || s; }
  function L(h) { return (lang.prefix && h.indexOf(C.home) === 0) ? lang.prefix + h : h; }   /* 같은 사이트 링크는 지금 언어로 */
  document.documentElement.setAttribute('data-lang', lang.code.toLowerCase());

  function esc(s) { return String(T(s)).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  function megaCols(m) {
    return m.map(function (col) {
      return '<div class="hh-col"><a class="hh-col-title" href="' + L(col.href) + '">' + esc(col.title) + '</a>' +
        col.items.map(function (it) {
          return '<a class="hh-mi" href="' + L(col.href) + '#' + it[0] + '"><span class="hh-ic">' + svg(it[1]) + '</span>' +
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
    return '<li><a class="hh-link" data-key="' + it.key + '" href="' + L(it.href) + '">' + esc(it.label) + '</a></li>';
  }).join('');

  var langHtml = '<div class="hh-lang"><button type="button" class="hh-lang-btn" aria-haspopup="true" aria-expanded="false" aria-label="' + esc('언어 선택, 현재') + ' ' + lang.code + '">' + GLOBE +
    '<span>' + lang.code + '</span><span class="hh-caret" aria-hidden="true">▾</span></button>' +
    '<ul class="hh-lang-menu">' + langLinks().map(function (a) { return '<li>' + a + '</li>'; }).join('') + '</ul></div>';
  var sibHtml = C.siblings.map(function (s) { return '<a class="hh-sib" href="' + s.href + '"' + (s.newTab ? ' target="_blank" rel="noopener"' : '') + '>' + esc(s.label) +
      ' <span aria-hidden="true">↗</span>' + (s.newTab ? '<span class="hh-sr">(' + esc('새 탭') + ')</span>' : '') + '</a>'; }).join('');
  var ctaHtml = C.cta ? '<a class="hh-cta" href="' + L(C.cta.href) + '">' + esc(C.cta.label) + '</a>' : '';

  var panel = C.menu.map(function (it) {
    if (it.mega) {
      return '<button type="button" class="hh-pacc" data-key="' + it.key + '" aria-expanded="false"><span class="hh-ptxt">' + esc(it.label) + '</span><span class="hh-caret" aria-hidden="true">▾</span></button>' +
        '<div class="hh-psub">' + megaCols(it.mega) + '</div>';
    }
    return '<a class="hh-plink" data-key="' + it.key + '" href="' + L(it.href) + '"><span>' + esc(it.label) + '</span></a>';
  }).join('') + '<div class="hh-pfoot"><div class="hh-plang" aria-label="' + esc('언어') + '">' +
    langLinks().join('') +
    '</div>' + sibHtml + ctaHtml + '</div>';

  slot.innerHTML =
    '<div class="hh" data-site="' + site + '">' +
      '<div class="hh-in">' +
        '<div class="hh-left"><a class="hh-logo" href="' + L(C.home) + '" aria-label="' + C.name + ' ' + C.sub + ' Home">' +
          '<img src="' + C.logo + '" alt="" width="26" height="28"><span class="hh-logo-text">' + C.name + ' <span>' + C.sub + '</span></span></a></div>' +
        '<nav class="hh-center" aria-label="' + esc('주 메뉴') + '"><ul class="hh-menu">' + center + '</ul></nav>' +
        '<div class="hh-right">' + langHtml + sibHtml + ctaHtml +
          '<button type="button" class="hh-burger" aria-label="' + esc('메뉴 열기') + '" aria-expanded="false" aria-controls="hh-panel"><span></span></button></div>' +
      '</div>' +
      '<nav class="hh-panel" id="hh-panel" aria-label="' + esc('모바일 메뉴') + '">' + panel + '</nav>' +
    '</div>';

  /* ── 상단 띠 배너 (FR-MKT-026): 모든 페이지 헤더 위 검정 띠 — 기본값은 위 banner 설정, 관리자 저장값(/market/data/site.json)이 있으면 그걸로 ── */
  var BN = C.banner, ban = null;
  var LC = lang.code === 'KR' ? 'ko' : lang.code.toLowerCase();
  function drawBanner(B) {
    if (B.show === false) { ban.hidden = true; return; }
    ban.hidden = false;
    var COVER = '<svg viewBox="0 0 48 64" aria-hidden="true"><rect width="48" height="64" rx="3" fill="#8B3DFF"/>' +
      '<g fill="none" stroke="#fff" stroke-opacity=".6" stroke-width=".8"><circle cx="24" cy="25" r="13"/><ellipse cx="24" cy="25" rx="6" ry="13"/><path d="M11 25h26M13 18.5h22M13 31.5h22"/></g>' +
      '<circle cx="29.5" cy="20" r="1.9" fill="#FFC53D"/><circle cx="17.5" cy="28" r="1.6" fill="#FFC53D"/><circle cx="31" cy="31" r="1.6" fill="#FFC53D"/>' +
      '<text x="5" y="47" textLength="38" lengthAdjust="spacingAndGlyphs" font-family="Arial,Helvetica,sans-serif" font-weight="800" font-size="4.4" fill="#fff">GLOBAL MARKETING</text>' +
      '<text x="5" y="56" textLength="38" lengthAdjust="spacingAndGlyphs" font-family="Arial,Helvetica,sans-serif" font-weight="900" font-size="7" fill="#FFC53D">TREND 2026</text></svg>';
    var big = B.big || ['', ''];
    function tx(i) { return big.raw ? esc0(big.raw[i] || '') : esc(big[i] || ''); }
    ban.innerHTML = '<a class="tb-link" href="' + esc0(L(B.href || C.banner.href)) + '">' +
      '<span class="tb-cover">' + (B.cover ? '<img src="' + esc0(B.cover) + '" alt="" width="48" height="64">' : COVER) + '</span>' +
      '<span class="tb-txt"><span class="tb-small"><span class="tb-star" aria-hidden="true">✦</span> ' + esc0(B.small || '') + '</span>' +
      '<span class="tb-big">' + tx(0) + '<span class="tb-bar" aria-hidden="true"> | </span><span class="tb-sub">' + tx(1) + '</span></span></span>' +
      '<span class="tb-arrow" aria-hidden="true">›</span></a>';
  }
  function esc0(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  if (BN) {
    ban = document.querySelector('.trend-banner');
    var banOld = ban && getComputedStyle(ban).position === 'fixed' ? ban.getBoundingClientRect().height : 0;
    if (!ban) { ban = document.createElement('div'); ban.className = 'trend-banner'; body.insertBefore(ban, body.firstChild); }
    ban.classList.add('tb');
    drawBanner(BN);
    /* 배너 높이가 바뀐 만큼 본문을 내려 기존 여백을 그대로 유지 */
    var banNew = ban.hidden ? 0 : ban.getBoundingClientRect().height, banDelta = Math.round(banNew - banOld);
    document.documentElement.style.setProperty('--tb-d', banDelta + 'px');
    if (banDelta && body.getAttribute('data-tb') !== 'nocomp') body.style.paddingTop = (parseFloat(getComputedStyle(body).paddingTop) || 0) + banDelta + 'px';
    /* 관리자 저장값 반영 (FR-MKT-027) — 이 언어 칸이 비어 있으면 기본 번역 유지 */
    try {
      fetch('/market' + '/data/site.json', { cache: 'no-store' }).then(function (r) { return r.ok ? r.json() : null; }).then(function (d) {
        if (!d || !d.banner) return;
        var S = d.banner, B = { show: S.show, small: S.small || BN.small, href: S.href || BN.href, cover: S.cover || '' };
        var bg = S.big && S.big[LC];
        if (bg && (bg[0] || bg[1])) B.big = { raw: bg }; else B.big = BN.big;
        var h0 = ban.getBoundingClientRect().height;
        drawBanner(B);
        var dh = Math.round((ban.hidden ? 0 : ban.getBoundingClientRect().height) - h0);
        if (dh && body.getAttribute('data-tb') !== 'nocomp') body.style.paddingTop = (parseFloat(getComputedStyle(body).paddingTop) || 0) + dh + 'px';
        if (typeof place === 'function') place();
      }).catch(function () {});
    } catch (e) {}
  }

  var hh = slot.firstChild;
  var fixed = body.getAttribute('data-header') === 'fixed';

  /* ── 위치: 고정 배너가 있으면 그 바로 아래 ── */
  function place() {
    var top = 0;
    var ban = document.querySelector('.trend-banner,.renewal-banner');
    if (ban && getComputedStyle(ban).position === 'fixed') top = Math.max(0, Math.round(ban.getBoundingClientRect().bottom));
    hh.style.top = top + 'px';
    document.documentElement.style.setProperty('--hh-ban', top + 'px');   /* 고정 배너 높이 — 페이지별 상단 여백 계산용 */
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
    function spy() {
      /* 헤더가 본문보다 먼저 그려지므로 구간은 매번 찾는다 */
      var spyEls = spies.map(function (m) { return { key: m.key, el: document.getElementById(m.spy) }; }).filter(function (s) { return s.el; });
      var line = (parseInt(getComputedStyle(document.documentElement).getPropertyValue('--hh-offset'), 10) || 0) + window.innerHeight * 0.3;
      var cur = 'home';
      /* 구간이 겹쳐 쌓이는 화면(카드 스크롤)에서도 맞게: 그 높이에 실제로 보이는 구간 기준 */
      var hit = document.elementFromPoint(window.innerWidth / 2, Math.min(line, window.innerHeight - 1));
      spyEls.forEach(function (s) { if (hit && s.el.contains(hit)) cur = s.key; });
      setCurrent(cur);
    }
    window.addEventListener('scroll', spy, { passive: true });   /* 계산이 가벼워 매 스크롤마다 바로 판정 */
    window.addEventListener('hashchange', spy);
    window.addEventListener('load', spy);
    document.addEventListener('DOMContentLoaded', spy);
  }

  /* ── 드롭다운: 마우스 올림 · 클릭 · 키보드 · Esc (FR-COM-004) ── */
  function dropdown(wrap, trigger) {
    var t, hold = false, byHover = false;
    function set(o) { wrap.classList.toggle('open', o); trigger.setAttribute('aria-expanded', o ? 'true' : 'false'); }
    if (window.matchMedia('(hover:hover)').matches) {
      wrap.addEventListener('mouseenter', function () { clearTimeout(t); if (!hold && !wrap.classList.contains('open')) { byHover = true; set(true); } });
      wrap.addEventListener('mouseleave', function () { hold = false; byHover = false; t = setTimeout(function () { set(false); }, 140); });
    }
    /* 하위 메뉴를 누르면 닫고 해당 페이지(카드)로 이동 — 같은 페이지 안 이동 때 메뉴가 카드를 가리지 않게 */
    wrap.addEventListener('click', function (e) { if (e.target.closest('a')) { hold = true; set(false); } });
    /* 마우스로 이미 펼쳐진 상태에서 누르면 닫지 않고 그대로 둔다 */
    trigger.addEventListener('click', function (e) { e.preventDefault(); hold = false; if (byHover) { byHover = false; set(true); return; } set(!wrap.classList.contains('open')); });
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
    burger.setAttribute('aria-label', T(o ? '메뉴 닫기' : '메뉴 열기'));
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
