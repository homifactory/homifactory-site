/* HOMI PRODUCTION — 작품 목록·팝업·대표 영상·푸터 (FR-PRD-004·008·009·011)
   작품 데이터: /production/works.json (1단계 — 관리자 화면은 2단계에서 같은 형식으로 교체) */
(function () {
  'use strict';
  var body = document.body, page = body.getAttribute('data-page');

  /* ── 헤더 로고를 흰색으로 (공통 헤더는 그대로 두고 여기서만) ── */
  var logo = document.querySelector('.hh[data-site="production"] .hh-logo img');
  if (logo) logo.src = '/assets/logo-symbol-white.png';

  /* ── 푸터 (FR-PRD-011) ── */
  var foot = document.getElementById('p-foot');
  if (foot) foot.innerHTML =
    '<div class="p-wrap"><div class="l"><b>HOMI PRODUCTION</b> I 호미 프로덕션 · 스튜디오 서울 강남구 논현로150길 17 지하 2층<br>' +
    '<span class="sup">고객 지원 평일 10:00 ~ 22:00 (주말·공휴일 상담 가능) · 이메일 <a href="mailto:support@homifactory.com">support@homifactory.com</a> · 전화 <a href="tel:010-4026-2695">010-4026-2695</a></span><br>' +
    '(주) 호미팩토리 | 사업자번호 581-87-03832 | 통신판매 번호 제2026-서울강남-05160호 | 주소 서울특별시 강남구 논현로142길 11, 4층 (논현동)<br>' +
    '©2026 HOMI FACTORY Co., Ltd. All rights reserved · <a href="/production/terms">이용약관</a> · <a class="pv" href="/production/privacy">개인정보처리방침</a></div>' +
    '<div class="r"><a href="/" target="_blank" rel="noopener">HOMI FACTORY ↗</a><a href="/market/" target="_blank" rel="noopener">HOMI MARKET ↗</a>' +
    '<div class="of">HOMI PRODUCTION OF HOMI FACTORY</div></div></div>';

  var listEl = document.getElementById('p-grid');
  if (!listEl) return;

  /* ── 분류 (Q-24 안 그대로) ── */
  var CATS = {
    visual: [['mv', '뮤직비디오'], ['film', '아티스트 필름'], ['live', '라이브·퍼포먼스']],
    commercial: [['ad', '광고·브랜드 필름'], ['series', '웹예능·시리즈'], ['short', '숏폼·SNS 콘텐츠']]
  };
  var SECTION = { visual: 'VISUAL WORKS', commercial: 'COMMERCIAL WORKS' };
  var section = page === 'commercial' ? 'commercial' : 'visual';
  var FIRST = section === 'commercial' ? 15 : 12;   /* 처음 보이는 개수 → 그 뒤 [더보기] */
  var catName = {}; CATS.visual.concat(CATS.commercial).forEach(function (c) { catName[c[0]] = c[1]; });

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }

  /* ── 영상 링크 해석: 유튜브·비메오 ── */
  function parse(url) {
    url = String(url || '');
    var m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/))([\w-]{11})/);
    if (m) return { kind: 'yt', id: m[1] };
    m = url.match(/vimeo\.com\/(?:video\/)?(\d+)(?:\/(\w+))?/);
    if (m) return { kind: 'vm', id: m[1], h: m[2] || '' };
    return null;
  }
  function embed(v, opt) {   /* opt: { muted, loop, controls } */
    if (!v) return '';
    if (v.kind === 'yt') {
      var q = 'autoplay=1&playsinline=1&rel=0&modestbranding=1&enablejsapi=1&origin=' + encodeURIComponent(location.origin) +
        (opt.muted ? '&mute=1' : '') + (opt.loop ? '&loop=1&playlist=' + v.id : '') + (opt.controls === false ? '&controls=0' : '');
      return 'https://www.youtube-nocookie.com/embed/' + v.id + '?' + q;
    }
    return 'https://player.vimeo.com/video/' + v.id + '?autoplay=1&playsinline=1&dnt=1' + (v.h ? '&h=' + v.h : '') +
      (opt.muted ? '&muted=1' : '') + (opt.loop ? '&loop=1' : '') + (opt.controls === false ? '&controls=0' : '');
  }
  function thumbOf(w) {
    if (w.thumb) return w.thumb;
    if (w._v && w._v.kind === 'yt') return 'https://i.ytimg.com/vi/' + w._v.id + '/hqdefault.jpg';
    return w._vmThumb || '';
  }
  function fetchVimeoThumbs(items) {   /* 비메오 썸네일은 oEmbed 로 받아 온다 */
    return Promise.all(items.filter(function (w) { return w._v && w._v.kind === 'vm' && !w.thumb; }).map(function (w) {
      return fetch('https://vimeo.com/api/oembed.json?width=1280&url=' + encodeURIComponent(w.url))
        .then(function (r) { return r.json(); }).then(function (j) { w._vmThumb = j.thumbnail_url || ''; }).catch(function () {});
    }));
  }
  function metaLine(w) {
    var who = w.showClient === false ? '' : (w.client || '');
    return [who, catName[w.category] || ''].filter(Boolean).join(' · ');
  }

  var all = [], list = [], featuredId = null, filter = 'all', shown = FIRST;

  /* 작품 데이터: 관리자 화면(Supabase prd_works)이 기준. 연결이 안 되거나 표가 아직 없으면 works.json 으로 대신 (FR-PRD-007) */
  var SB = 'https://bcngbtwzuqtwtxaebftf.supabase.co', SBK = 'sb_publishable_4f1Mbi136Y8iuHSk-xub8A_43uK3Wiy';
  function fromDb() {
    if (window.PRD_DB === false) return Promise.reject();
    return fetch(SB + '/rest/v1/prd_works?select=*&hidden=eq.false&order=sort_order.asc,published_on.desc.nullslast', { headers: { apikey: SBK, Authorization: 'Bearer ' + SBK } })
      .then(function (r) { if (!r.ok) throw 0; return r.json(); })
      .then(function (rs) {
        if (!rs.length) throw 0;   /* 아직 한 건도 없으면 파일 쪽을 본다 */
        var f = rs.filter(function (r) { return r.is_featured; })[0];
        return { featured: f ? f.slug : null, items: rs.map(function (r) { return { id: r.slug, section: r.section, category: r.category, title: r.title,
          client: r.client, showClient: r.show_client, date: r.published_on, url: r.url, roles: r.roles || [], desc: r.description, thumb: r.thumb_url, order: r.sort_order }; }) };
      });
  }
  function fromFile() { return fetch('/production/works.json', { cache: 'no-cache' }).then(function (r) { return r.json(); }); }
  fromDb().catch(fromFile).then(function (data) {
    featuredId = data.featured || null;
    all = (data.items || []).filter(function (w) { return !w.hidden && w.id && parse(w.url); });
    all.forEach(function (w, i) { w._v = parse(w.url); w._i = i; });
    /* 기본 순서 = 관리자 순서(order), 없으면 최신 공개일순 */
    all.sort(function (a, b) {
      var ao = a.order == null ? Infinity : a.order, bo = b.order == null ? Infinity : b.order;
      if (ao !== bo) return ao - bo;
      return String(b.date || '').localeCompare(String(a.date || '')) || a._i - b._i;
    });
    return fetchVimeoThumbs(all);
  }).catch(function () { all = []; }).then(function () {
    list = all.filter(function (w) { return w.section === section; });
    renderFilter(); renderGrid();
    if (section === 'visual') renderFeatured();
    openFromHash();
  });

  /* ── 분류 칩 ── */
  function renderFilter() {
    var box = document.getElementById('p-filter'); if (!box) return;
    var opts = [['all', '전체']].concat(CATS[section]);
    box.innerHTML = opts.map(function (o) {
      return '<button type="button" data-cat="' + o[0] + '" aria-pressed="' + (o[0] === filter) + '">' + esc(o[1]) + '</button>';
    }).join('');
    box.addEventListener('click', function (e) {
      var b = e.target.closest('button[data-cat]'); if (!b) return;
      filter = b.getAttribute('data-cat'); shown = FIRST;
      box.querySelectorAll('button').forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
      renderGrid();
    });
  }
  function visible() { return list.filter(function (w) { return filter === 'all' || w.category === filter; }); }

  /* ── 3열 그리드 + 더보기 ── */
  function renderGrid() {
    var v = visible(), more = document.getElementById('p-more');
    if (!list.length) {
      listEl.outerHTML = '<div class="p-empty" id="p-grid"><strong>작품을 준비하고 있습니다</strong>곧 ' + SECTION[section] + '를 이곳에서 보실 수 있어요.</div>';
      listEl = document.getElementById('p-grid'); if (more) more.hidden = true; return;
    }
    if (!v.length) {
      listEl.innerHTML = '<li class="p-empty" style="grid-column:1/-1"><strong>이 분류의 작품은 준비 중입니다</strong>다른 분류를 골라 보세요.</li>';
      if (more) more.hidden = true; return;
    }
    listEl.innerHTML = v.slice(0, shown).map(function (w) {
      return '<li><button type="button" class="p-card" data-id="' + esc(w.id) + '" aria-label="' + esc(w.title) + ' 영상 보기">' +
        '<div class="p-thumb"><img src="' + esc(thumbOf(w)) + '" alt="" loading="lazy" width="480" height="270" onerror="this.style.visibility=\'hidden\'">' +
        '<span class="p-play" aria-hidden="true"><i></i>영상 보기</span></div>' +
        '<h3>' + esc(w.title) + '</h3><p class="p-meta">' + esc(metaLine(w)) + '</p></button></li>';
    }).join('');
    if (more) more.hidden = v.length <= shown;
  }
  listEl.addEventListener('click', function (e) {
    var c = e.target.closest('.p-card'); if (c) openModal(c.getAttribute('data-id'), c);
  });
  var moreBtn = document.querySelector('#p-more button');
  if (moreBtn) moreBtn.addEventListener('click', function () {
    var first = shown; shown += FIRST; renderGrid();
    var next = listEl.querySelectorAll('.p-card')[first]; if (next) next.focus();
  });

  /* ── 대표 영상 (FR-PRD-009): 소리 없이 자동 재생 → 누르면 소리 켜고 처음부터 ── */
  function renderFeatured() {
    var box = document.getElementById('p-feature'); if (!box) return;
    var w = all.filter(function (x) { return x.id === featuredId && x.section === 'visual'; })[0];
    box.hidden = false;
    if (!w) {   /* 대표 작품이 아직 없어도 자리는 그대로 보여 준다 (FR-PRD-009) */
      box.querySelector('.p-feature-box').innerHTML = '<div class="p-photo" style="position:absolute;inset:0"><span class="p-ph">대표 작품 영상<br>준비 중</span></div>';
      box.querySelector('.p-feature-cap').innerHTML = '<h2>대표 작품</h2><p>관리자가 지정한 대표 작품 영상이 이곳에서 소리 없이 재생됩니다.</p>';
      return;
    }
    var frame = box.querySelector('.p-feature-box'), cap = box.querySelector('.p-feature-cap');
    var saveData = navigator.connection && navigator.connection.saveData;
    var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    frame.innerHTML = '<img class="p-feature-poster" src="' + esc(thumbOf(w)) + '" alt="">' +
      ((saveData || reduce) ? '' : '<iframe title="' + esc(w.title) + ' (소리 없이 재생 중)" src="' + embed(w._v, { muted: 1, loop: 1, controls: false }) +
        '" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" tabindex="-1"></iframe>') +
      '<button type="button" class="p-feature-hit" aria-label="' + esc(w.title) + ' 소리 켜고 처음부터 재생"><span class="p-sound">🔊 소리 켜고 보기</span></button>';
    var roles = (w.roles || []).join(' · ');
    cap.innerHTML = '<h2>' + esc(w.title) + '</h2><p>' + esc([metaLine(w), roles].filter(Boolean).join(' · ')) + '</p>';
    frame.querySelector('.p-feature-hit').addEventListener('click', function () {
      var old = frame.querySelector('iframe'); if (old) old.remove();
      frame.querySelector('.p-feature-poster').remove();
      this.remove();
      frame.insertAdjacentHTML('beforeend', '<iframe title="' + esc(w.title) + '" src="' + embed(w._v, { muted: 0 }) +
        '" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe>');
    });
  }

  /* ── 팝업 (FR-PRD-008) ── */
  var modal, lastFocus, curId;
  function build() {
    modal = document.createElement('div');
    modal.className = 'p-modal'; modal.setAttribute('role', 'dialog'); modal.setAttribute('aria-modal', 'true'); modal.setAttribute('aria-labelledby', 'p-m-title');
    modal.innerHTML = '<button type="button" class="p-x" aria-label="닫기">✕</button><div class="p-modal-in">' +
      '<div class="p-modal-main"><div class="p-player" id="p-m-player"></div><div class="p-info" id="p-m-info"></div></div>' +
      '<div class="p-strip"><button type="button" class="p-nav" data-d="-1" aria-label="이전 작품">‹</button>' +
      '<div class="p-strip-list" id="p-m-strip"></div><button type="button" class="p-nav" data-d="1" aria-label="다음 작품">›</button></div></div>';
    document.body.appendChild(modal);
    modal.querySelector('.p-x').addEventListener('click', closeModal);
    modal.addEventListener('click', function (e) {
      if (e.target === modal || e.target.classList.contains('p-modal-in')) closeModal();
      var n = e.target.closest('.p-nav'); if (n) step(+n.getAttribute('data-d'));
      var t = e.target.closest('[data-strip]'); if (t) show(t.getAttribute('data-strip'));
    });
    document.addEventListener('keydown', function (e) {
      if (!modal.classList.contains('open')) return;
      if (e.key === 'Escape') closeModal();
      else if (e.key === 'ArrowLeft') step(-1);
      else if (e.key === 'ArrowRight') step(1);
      else if (e.key === 'Tab') {   /* 포커스를 팝업 안에 가둠 */
        var f = [].slice.call(modal.querySelectorAll('button,a[href],iframe')).filter(function (x) { return x.offsetParent !== null; });
        if (!f.length) return;
        if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
        else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
      }
    });
  }
  function pool() { var v = visible(); return v.length ? v : list; }
  function step(d) {
    var p = pool(), i = p.map(function (w) { return w.id; }).indexOf(curId);
    if (i < 0) return; show(p[(i + d + p.length) % p.length].id);
  }
  function show(id) {
    var w = all.filter(function (x) { return x.id === id; })[0]; if (!w) return;
    curId = id;
    document.getElementById('p-m-player').innerHTML = '<iframe title="' + esc(w.title) + '" src="' + embed(w._v, { muted: 0 }) +
      '" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe>';
    var who = w.showClient === false ? '' : (w.client || '');
    document.getElementById('p-m-info').innerHTML =
      '<p class="p-eyebrow">' + esc(SECTION[w.section] + ' · ' + (catName[w.category] || '')) + '</p>' +
      '<h2 id="p-m-title">' + esc(w.title) + '</h2>' +
      '<p class="p-meta">' + esc([who, (w.date || '').replace(/-/g, '.')].filter(Boolean).join(' · ')) + '</p>' +
      (w.desc ? '<p class="p-desc">' + esc(w.desc) + '</p>' : '') +
      ((w.roles || []).length ? '<div class="p-roles" aria-label="호미가 한 일">' + w.roles.map(function (r) { return '<span>' + esc(r) + '</span>'; }).join('') + '</div>' : '') +
      '<button type="button" class="p-share">이 작품 주소 복사</button>';
    var p = pool();
    document.getElementById('p-m-strip').innerHTML = p.map(function (x) {
      return '<button type="button" data-strip="' + esc(x.id) + '" aria-label="' + esc(x.title) + '"' + (x.id === id ? ' aria-current="true"' : '') +
        '><img src="' + esc(thumbOf(x)) + '" alt="" loading="lazy"></button>';
    }).join('');
    var cur = modal.querySelector('[data-strip][aria-current]'); if (cur) cur.scrollIntoView({ block: 'nearest', inline: 'center' });
    modal.querySelector('.p-share').addEventListener('click', function () {
      var btn = this, url = location.origin + location.pathname + '#work=' + encodeURIComponent(id);
      (navigator.clipboard ? navigator.clipboard.writeText(url) : Promise.reject()).then(function () { btn.textContent = '주소를 복사했어요'; },
        function () { btn.textContent = url; });
    });
    if (location.hash !== '#work=' + id) history.replaceState(null, '', '#work=' + encodeURIComponent(id));
  }
  function openModal(id, from) {
    if (!modal) build();
    lastFocus = from || document.activeElement;
    modal.classList.add('open'); document.documentElement.classList.add('p-lock');
    show(id); modal.querySelector('.p-x').focus();
  }
  function closeModal() {
    modal.classList.remove('open'); document.documentElement.classList.remove('p-lock');
    document.getElementById('p-m-player').innerHTML = '';   /* 소리 멈춤 */
    history.replaceState(null, '', location.pathname + location.search);
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }
  /* 작품마다 공유용 주소: /production/#work=작품ID */
  function openFromHash() {
    var m = location.hash.match(/^#work=(.+)$/); if (!m) return;
    var id = decodeURIComponent(m[1]);
    if (list.some(function (w) { return w.id === id; })) openModal(id);
  }
  window.addEventListener('hashchange', openFromHash);
})();
