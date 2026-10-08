/* HOMI 관리자 (FR-COM-017~023 · 화면설계서 v0.99993 p.30~33)
   - 위: 사이트 선택 전체 / 공통 / FACTORY / MARKET / PRODUCTION  · 왼쪽: 메뉴 10개 (계정의 메뉴 권한에 없는 메뉴는 안 보임)
   - 데이터: Supabase(작품 관리와 같은 프로젝트) — com_members · com_inquiries · com_creators · com_settings · com_audit · prd_works
   - 페이지 편집: GitHub 저장소 파일을 그대로 고쳐 게시(저장 키 = GitHub 토큰, Contents 읽기·쓰기) → Vercel 자동 배포
   - 로컬 점검: localhost + ?mock=1 이면 메모리 데이터·로컬 파일로 화면만 확인 */
(function () {
  'use strict';
  var SB_URL = 'https://bcngbtwzuqtwtxaebftf.supabase.co';
  var SB_KEY = 'sb_publishable_4f1Mbi136Y8iuHSk-xub8A_43uK3Wiy';
  var REPO = 'homifactory/homifactory-site', BR = 'main';
  var XLSX_SRC = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
  var TABS = [['all', '전체'], ['common', '공통'], ['factory', 'FACTORY'], ['market', 'MARKET'], ['production', 'PRODUCTION']];
  var SN = { factory: 'FACTORY', market: 'MARKET', production: 'PRODUCTION', common: '공통', all: '전체' };
  var MENU = [
    ['inbox', '문의함'], ['pages', '페이지 편집'], ['creators', '크리에이터 DB'], ['works', '작품 관리 (PRODUCTION)', 'production'],
    ['trend', '트렌드 리포트 (MARKET)', 'market'], ['logos', '고객사 로고 · 사례 (MARKET)', 'market'], ['settings', '사이트 설정'],
    ['members', '계정 · 권한'], ['privacy', '개인정보 관리'], ['log', '변경 기록']
  ];
  var ROLE = { owner: '최고관리자', editor: '담당자', viewer: '보기 전용' };
  var ST_INQ = [['new', '신규'], ['contacted', '연락함'], ['in_progress', '진행 중'], ['done', '완료'], ['hold', '보류'], ['spam', '스팸']];
  var ST_CR = [['approved', '승인 풀'], ['reviewing', '검토 중'], ['new', '신규'], ['hold', '보류']];
  var TYPES = [['all', '전체 유형'], ['consult', '상담 신청서'], ['project', '프로젝트 문의'], ['production', '제작 문의'], ['rental', '대관 문의'], ['creator', '크리에이터 지원'], ['chat', '실시간 상담']];
  var TYPE_NAME = {}; TYPES.forEach(function (t) { TYPE_NAME[t[0]] = t[1]; });

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return [].slice.call((r || document).querySelectorAll(s)); };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var app = $('#app');
  var S = { me: null, site: 'all', view: 'inbox', setupNeeded: false, members: [] };
  try { var saved = JSON.parse(localStorage.getItem('hm_admin_pos2') || '{}'); if (saved.site) { S.site = saved.site; S.view = saved.view || 'inbox'; } } catch (e) {}

  function msg(t, err) { var m = $('#msg'); m.textContent = t; m.className = 'msg' + (err ? ' err' : ''); m.hidden = false; clearTimeout(msg.t); msg.t = setTimeout(function () { m.hidden = true; }, err ? 6500 : 2600); }
  function fail(pre) { return function (er) { console.warn(er); msg((pre || '실패') + ': ' + (er && er.message || er), true); }; }
  var p2 = function (n) { return ('0' + n).slice(-2); };
  function fmt(d) { if (!d) return ''; var x = new Date(d); return p2(x.getMonth() + 1) + '.' + p2(x.getDate()) + ' ' + p2(x.getHours()) + ':' + p2(x.getMinutes()); }
  function fmtY(d) { if (!d) return ''; var x = new Date(d); return x.getFullYear() + '.' + p2(x.getMonth() + 1) + '.' + p2(x.getDate()); }
  function today(add) { var t = new Date(); t.setDate(t.getDate() + (add || 0)); return t.toISOString().slice(0, 10); }
  function nameOf(list, v) { var t = list.filter(function (x) { return x[0] === v; })[0]; return t ? t[1] : v; }
  function pill(list, v) { return '<span class="pill ' + esc(v) + '">' + esc(nameOf(list, v)) + '</span>'; }
  function bdg(site) { return '<span class="bdg ' + esc(site) + '">' + esc(SN[site] || site) + '</span>'; }
  function opts(list, cur, first) { return (first ? '<option value="">' + esc(first) + '</option>' : '') + list.map(function (o) { var v = Array.isArray(o) ? o[0] : o, t = Array.isArray(o) ? o[1] : o; return '<option value="' + esc(v) + '"' + (String(v) === String(cur) ? ' selected' : '') + '>' + esc(t) + '</option>'; }).join(''); }
  function arr(v) { return Array.isArray(v) ? v : (v ? String(v).split(/\s*[,/·|;\n]\s*/).filter(Boolean) : []); }
  function who() { return S.me.name || S.me.email; }
  function loadScript(src) { return new Promise(function (ok, no) { if (loadScript[src]) return ok(); var s = document.createElement('script'); s.src = src; s.onload = function () { loadScript[src] = 1; ok(); }; s.onerror = function () { no(new Error('불러오기 실패: ' + src)); }; document.head.appendChild(s); }); }
  function xlsxOut(rows, cols, name) {
    var data = rows.map(function (r) { var o = {}; cols.forEach(function (c) { var v = typeof c[0] === 'function' ? c[0](r) : r[c[0]]; o[c[1]] = Array.isArray(v) ? v.join(', ') : (v && typeof v === 'object' ? JSON.stringify(v) : (v == null ? '' : v)); }); return o; });
    return loadScript(XLSX_SRC).then(function () {
      var ws = window.XLSX.utils.json_to_sheet(data, { header: cols.map(function (c) { return c[1]; }) }), wb = window.XLSX.utils.book_new();
      window.XLSX.utils.book_append_sheet(wb, ws, 'data'); window.XLSX.writeFile(wb, name);
    });
  }
  function head(title, sub, fr, crumb) {
    return '<div class="ph"><h1>' + title + '</h1>' + (crumb ? '<span class="crumb">' + crumb + '</span>' : '') + (sub ? '<span class="sub">' + sub + '</span>' : '') + (fr ? '<span class="fr">' + fr + '</span>' : '') + '</div>' +
      (S.note ? '<div class="notice">' + S.note + '</div>' : '');
  }

  /* ───────── 데이터 연결 ───────── */
  var mock = /^(127\.0\.0\.1|localhost)$/.test(location.hostname) && /[?&]mock=1/.test(location.search);
  var api = mock ? mockApi() : sbApi();

  function sbApi() {
    var sb = window.supabase.createClient(SB_URL, SB_KEY, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } });
    function ok(r) { if (r.error) throw r.error; return r.data; }
    var redirect = location.origin + '/site-admin/';
    return {
      session: function () { return sb.auth.getSession().then(function (r) { return r.data.session; }); },
      onAuth: function (fn) { sb.auth.onAuthStateChange(function () { fn(); }); },
      signInPw: function (e, p) { return sb.auth.signInWithPassword({ email: e, password: p }).then(ok); },
      signInLink: function (e) { return sb.auth.signInWithOtp({ email: e, options: { shouldCreateUser: false, emailRedirectTo: redirect } }).then(ok); },
      signOut: function () { return sb.auth.signOut(); },
      me: function () { return sb.rpc('com_me').then(ok).then(function (d) { return Array.isArray(d) ? d[0] : d; }); },
      inquiries: function () { return sb.from('com_inquiries').select('*').order('created_at', { ascending: false }).limit(1000).then(ok); },
      updInquiry: function (id, p) { return sb.from('com_inquiries').update(p).eq('id', id).then(ok); },
      delInquiry: function (id) { return sb.from('com_inquiries').delete().eq('id', id).then(ok); },
      creators: function () { return sb.from('com_creators').select('*').order('created_at', { ascending: false }).limit(5000).then(ok); },
      updCreator: function (id, p) { return sb.from('com_creators').update(p).eq('id', id).then(ok); },
      updCreators: function (ids, p) { return sb.from('com_creators').update(p).in('id', ids).then(ok); },
      upsertCreators: function (rows) { return sb.from('com_creators').upsert(rows, { onConflict: 'channel_key', defaultToNull: false }).then(ok); },
      delCreator: function (id) { return sb.from('com_creators').delete().eq('id', id).then(ok); },
      members: function () { return sb.from('com_members').select('*').order('created_at').then(ok); },
      saveMember: function (m) { return sb.from('com_members').upsert(m).then(ok); },
      delMember: function (e) { return sb.from('com_members').delete().eq('email', e).then(ok); },
      invite: function (e) { return sb.auth.signInWithOtp({ email: e, options: { shouldCreateUser: true, emailRedirectTo: redirect } }).then(ok); },
      purge: function () { return sb.rpc('com_purge_expired').then(ok); },
      settings: function () { return sb.from('com_settings').select('*').then(ok); },
      saveSetting: function (k, v) { return sb.from('com_settings').upsert({ key: k, value: v }).then(ok); },
      audit: function (action, site, target, detail) { return sb.from('com_audit').insert({ actor: S.me.email, action: action, site: site || null, target: target || null, detail: detail || null }).then(function (r) { if (r.error) console.warn('audit', r.error); }); },
      auditList: function () { return sb.from('com_audit').select('*').order('at', { ascending: false }).limit(300).then(ok); },
      works: function () { return sb.from('prd_works').select('*').order('sort_order').order('published_on', { ascending: false, nullsFirst: false }).then(ok); },
      saveWork: function (row) { var q = row.id ? sb.from('prd_works').update(row).eq('id', row.id) : sb.from('prd_works').insert(row); return q.select().single().then(ok); },
      delWork: function (id) { return sb.from('prd_works').delete().eq('id', id).then(ok); },
      clearFeatured: function (ex) { var q = sb.from('prd_works').update({ is_featured: false }).eq('is_featured', true); if (ex) q = q.neq('id', ex); return q.then(ok); },
      orderWorks: function (pairs) { return Promise.all(pairs.map(function (p) { return sb.from('prd_works').update({ sort_order: p[1] }).eq('id', p[0]).then(ok); })); },
      uploadThumb: function (file) {
        var path = Date.now() + '-' + file.name.replace(/[^\w.\-]/g, '_');
        return sb.storage.from('prd-thumbs').upload(path, file, { upsert: false, contentType: file.type }).then(ok).then(function () { return sb.storage.from('prd-thumbs').getPublicUrl(path).data.publicUrl; });
      }
    };
  }

  function mockApi() {
    var now = Date.now(), d = function (h) { return new Date(now - h * 3600e3).toISOString(); };
    var inq = [
      { id: 'i1', site: 'market', kind: 'inquiry', name: '김브랜드', phone: '010-1111-2222', email: 'brand@ex.com', company: '모이스처랩', summary: '저자극 선크림 신제품', data: { '방향': '한국→세계', '진출 국가·시장': '일본, 인도네시아', '지금 가장 큰 고민': '어디서부터 시작할지', '이루고 싶은 목표': '6개월 안에 현지 판매', '시기': '11월', '예산': '3천만 원대' }, lang: 'KR', page: '/market/contact', status: 'new', history: [], retain_until: '2027-10-08', created_at: d(2) },
      { id: 'i2', site: 'production', kind: 'rental', name: '박감독', phone: '010-5555-6666', email: 'pd@ex.com', company: '스튜디오B', summary: '호리존 대관', data: { '희망 일정': '10/20 오후', '문의 내용': '4시간 촬영' }, lang: 'KR', page: '/production/contact', status: 'contacted', assignee: '배수빈', history: [{ at: d(20), by: '배수빈', what: '연락함' }], retain_until: '2027-10-07', created_at: d(26) },
      { id: 'i3', site: 'factory', kind: 'project', name: '이매니저', phone: '010-3333-4444', email: 'ent@ex.com', company: 'OO레이블', summary: '컴백 프로모션', data: { '문의 유형': 'Marketing', '프로젝트 내용': '11월 컴백 SNS 바이럴' }, lang: 'KR', page: '/contact', status: 'in_progress', assignee: '윤호성', history: [], retain_until: '2027-10-07', created_at: d(30) },
      { id: 'i4', site: 'production', kind: 'production', name: '최PD', phone: '010-1212-3434', email: 'mv@ex.com', company: '아티스트C', summary: '뮤직비디오 제작', data: { '예산': '협의', '희망 일정': '12월' }, lang: 'KR', page: '/production/contact', status: 'in_progress', assignee: '배수빈', history: [], retain_until: '2027-10-07', created_at: d(38) },
      { id: 'i5', site: 'market', kind: 'inquiry', name: '정대표', phone: '010-9999-0000', email: 'ceo@ex.com', company: '푸드컴퍼니', summary: '방문 프로모션', data: {}, lang: 'EN', page: '/en/market/contact', status: 'done', assignee: '고객지원', history: [], retain_until: '2027-10-04', created_at: d(60) },
      { id: 'i6', site: 'factory', kind: 'project', name: '한실장', phone: '010-4545-6767', email: 'han@ex.com', company: 'D엔터', summary: '팬미팅 기획', data: {}, lang: 'KR', page: '/contact', status: 'hold', assignee: '윤호성', history: [], retain_until: '2026-10-30', created_at: d(110) },
      { id: 'i7', site: 'market', kind: 'chat', name: '고객', phone: '', email: 'chat@ex.com', company: '', summary: '[실시간 상담] 인플루언서 마케팅', data: { '대화': '안녕하세요, 일본 시딩 문의드려요' }, lang: 'KR', page: '/market', status: 'new', history: [], retain_until: '2027-10-08', created_at: d(5) }
    ];
    var cr = [
      { id: 'c1', handle: '데일리뷰티', channel_url: 'https://instagram.com/dailybeauty', channels: 'https://tiktok.com/@dailybeauty', platforms: ['인스타그램', '틱톡'], followers: '1만~10만', country: '대한민국', categories: ['뷰티', '푸드'], campaign_types: ['시딩'], intro: '직장인 뷰티 루틴', name: '최크리', phone: '010-7777-8888', email: 'cr@ex.com', status: 'approved', tags: ['스킨케어', '20대'], rating: 4, campaigns: [{ name: '선크림 시딩', month: '2026.09', result: '조회 12만', state: '참여' }, { name: '립 런칭', month: '2026.10', result: '', state: '참여' }], contact_log: '10.04 라인으로 제안 → 수락', source: 'site', retain_until: '2028-10-01', created_at: d(4) },
      { id: 'c2', handle: 'tokyo_mina', channel_url: 'https://tiktok.com/@tokyo_mina', platforms: ['틱톡'], followers: '10만~100만', country: '일본', categories: ['뷰티'], campaign_types: [], intro: '', name: 'Mina', phone: '', email: 'mina@ex.jp', status: 'approved', tags: [], rating: 5, campaigns: [{ name: '선크림 시딩', month: '2026.09', result: '', state: '참여' }], source: 'import', retain_until: '2026-11-01', created_at: d(300) },
      { id: 'c3', handle: 'jkt.style', channel_url: 'https://tiktok.com/@jktstyle', platforms: ['틱톡', '인스타그램'], followers: '1만~10만', country: '인도네시아', categories: ['패션'], status: 'reviewing', tags: [], campaigns: [], retain_until: '2028-10-05', created_at: d(9) },
      { id: 'c4', handle: '타이베이먹방', channel_url: 'https://instagram.com/tpe_food', platforms: ['인스타그램'], followers: '1천~1만', country: '대만', categories: ['푸드'], status: 'new', tags: [], campaigns: [], retain_until: '2028-10-06', created_at: d(30) },
      { id: 'c5', handle: '라이프로그', channel_url: 'https://youtube.com/@lifelog', platforms: ['유튜브'], followers: '100만 이상', country: '대한민국', categories: ['라이프스타일'], status: 'approved', tags: [], campaigns: [{ name: 'A', month: '2026.05', state: '참여' }, { name: 'B', month: '2026.07', state: '참여' }, { name: 'C', month: '2026.09', state: '참여' }], retain_until: '2028-01-01', created_at: d(400) },
      { id: 'c6', handle: 'manila.glow', channel_url: 'https://facebook.com/manilaglow', platforms: ['페이스북', '틱톡'], followers: '1만~10만', country: '필리핀', categories: ['뷰티'], status: 'hold', tags: [], campaigns: [], delete_requested: true, retain_until: '2028-02-01', created_at: d(200) }
    ];
    cr.forEach(function (c) { c.campaign_types = c.campaign_types || []; c.tags = c.tags || []; });
    var mem = [{ email: 'hosung@homifactory.com', name: '윤호성', role: 'owner', sites: ['factory', 'market', 'production'], menus: null }, { email: 'soobin1027@homifactory.com', name: '배수빈', role: 'owner', sites: ['factory', 'market', 'production'], menus: null }, { email: 'support@homifactory.com', name: '고객지원', role: 'editor', sites: ['market'], menus: ['inbox', 'creators'] }];
    var set = [{ key: 'contact', value: { email: 'support@homifactory.com', phone: '010-4026-2695', hours: '평일 10:00~22:00', kakao: '' } }, { key: 'notify', value: { to: 'support@homifactory.com', cc: 'soobin1027@homifactory.com,hosung@homifactory.com' } }];
    var aud = [{ id: 1, at: d(1), actor: 'hosung@homifactory.com', site: 'market', action: 'view', target: 'inquiry:i1' }];
    var works = [
      { id: 'w1', section: 'visual', category: 'mv', title: 'Night Drive', client: '아티스트A', show_client: true, published_on: '2026-08-01', url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', roles: ['기획', '촬영', '편집'], description: '', thumb_url: null, sort_order: 0, is_featured: true, hidden: false },
      { id: 'w2', section: 'visual', category: 'film', title: 'Blue Hour', client: '아티스트B', show_client: true, published_on: '2026-06-01', url: 'https://vimeo.com/76979871', roles: ['촬영'], description: '', sort_order: 1, is_featured: false, hidden: false },
      { id: 'w3', section: 'commercial', category: 'series', title: '편의점 탐방', client: '브랜드C', show_client: false, published_on: '2026-05-01', url: 'https://youtu.be/9bZkp7q19f0', roles: ['기획'], sort_order: 0, is_featured: false, hidden: true }
    ];
    var P = function (v) { return Promise.resolve(JSON.parse(JSON.stringify(v))); };
    var upd = function (a, id, p) { a.forEach(function (r) { if (r.id === id) Object.assign(r, p); }); return P(null); };
    var n = 10;
    return {
      session: function () { return P({ user: { email: 'hosung@homifactory.com' } }); }, onAuth: function () {},
      signInPw: function () { return P(null); }, signInLink: function () { return P(null); }, signOut: function () { return P(null); },
      me: function () { return P(mem[0]); },
      inquiries: function () { return P(inq); }, updInquiry: function (id, p) { return upd(inq, id, p); }, delInquiry: function (id) { inq = inq.filter(function (r) { return r.id !== id; }); return P(null); },
      creators: function () { return P(cr); }, updCreator: function (id, p) { return upd(cr, id, p); },
      updCreators: function (ids, p) { cr.forEach(function (r) { if (ids.indexOf(r.id) > -1) Object.assign(r, JSON.parse(JSON.stringify(p))); }); return P(null); },
      upsertCreators: function (rows) { rows.forEach(function (r) { var f = cr.filter(function (x) { return x.channel_url === r.channel_url; })[0]; if (f) Object.assign(f, r); else cr.push(Object.assign({ id: 'c' + (++n), status: 'new', tags: [], campaigns: [], campaign_types: [], platforms: [], categories: [], created_at: new Date().toISOString(), retain_until: today(730) }, r)); }); return P(null); },
      delCreator: function (id) { cr = cr.filter(function (r) { return r.id !== id; }); return P(null); },
      members: function () { return P(mem); }, saveMember: function (m) { var f = mem.filter(function (x) { return x.email === m.email; })[0]; if (f) Object.assign(f, m); else mem.push(m); return P(null); },
      delMember: function (e) { mem = mem.filter(function (x) { return x.email !== e; }); return P(null); }, invite: function () { return P(null); },
      purge: function () { return P({ inquiries: 0, creators: 0 }); },
      settings: function () { return P(set); }, saveSetting: function (k, v) { var f = set.filter(function (x) { return x.key === k; })[0]; if (f) f.value = v; else set.push({ key: k, value: v }); return P(null); },
      audit: function (a, s, t, dt) { aud.unshift({ id: ++n, at: new Date().toISOString(), actor: S.me.email, site: s, action: a, target: t, detail: dt }); return P(null); },
      auditList: function () { return P(aud); },
      works: function () { return P(works.slice().sort(function (a, b) { return a.sort_order - b.sort_order; })); },
      saveWork: function (row) { if (!row.id) { row = Object.assign({ id: 'w' + (++n) }, row); works.push(row); } else upd(works, row.id, row); return P(works.filter(function (w) { return w.id === row.id; })[0]); },
      delWork: function (id) { works = works.filter(function (w) { return w.id !== id; }); return P(null); },
      clearFeatured: function (ex) { works.forEach(function (w) { if (w.id !== ex) w.is_featured = false; }); return P(null); },
      orderWorks: function (pairs) { pairs.forEach(function (p) { upd(works, p[0], { sort_order: p[1] }); }); return P(null); },
      uploadThumb: function (f) { return P(URL.createObjectURL(f)); }
    };
  }

  /* ───────── 로그인 ───────── */
  function loginView(note) {
    app.innerHTML = '<div class="login"><h1>HOMI 관리자</h1><p>HOMI FACTORY · MARKET · PRODUCTION을 한 곳에서 관리합니다. 등록된 담당자 이메일로만 들어올 수 있어요.</p>' +
      (note ? '<div class="notice">' + note + '</div>' : '') +
      '<form id="lf"><input type="email" id="le" placeholder="이메일" autocomplete="email" required><input type="password" id="lp" placeholder="비밀번호 (없으면 비워 두고 [이메일 링크])" autocomplete="current-password">' +
      '<div class="row"><button class="btn k" type="submit">로그인</button><button class="btn" type="button" id="ll">이메일 링크 받기</button></div></form></div>';
    $('#lf').onsubmit = function (e) { e.preventDefault(); var em = $('#le').value.trim(), pw = $('#lp').value; if (!pw) return link(); api.signInPw(em, pw).then(boot).catch(fail('로그인 실패')); };
    function link() { var em = $('#le').value.trim(); if (!em) return msg('이메일을 넣어 주세요', true); api.signInLink(em).then(function () { msg('메일함에서 로그인 링크를 눌러 주세요'); }).catch(fail('보내지 못했어요')); }
    $('#ll').onclick = link;
    var lo = $('#lo2'); if (lo) lo.onclick = function () { api.signOut().then(boot); };
  }

  function boot() {
    api.session().then(function (ses) {
      if (!ses) return loginView();
      return api.me().then(function (me) {
        if (!me || !me.email) return loginView('이 이메일(' + esc(ses.user.email) + ')은 관리자 계정 목록에 없어요. 최고관리자에게 「계정 · 권한」에서 추가해 달라고 요청해 주세요. <button class="btn sm" id="lo2" type="button">로그아웃</button>');
        S.me = me; S.note = ''; api.members().then(function (m) { S.members = m; }).catch(function () {}); shell();
      }).catch(function (er) {
        console.warn(er);
        S.setupNeeded = true; S.me = { email: ses.user.email, role: 'owner', sites: ['factory', 'market', 'production'], name: '', menus: null };
        S.note = '데이터베이스 설정이 아직 안 됐어요(Supabase에 com_ 표 없음). 페이지 편집 · 작품 관리 · 고객사 로고는 지금도 쓸 수 있고, 문의함 · 크리에이터 DB · 계정은 설정 SQL을 한 번 실행하면 열립니다.';
        shell();
      });
    });
  }

  /* ───────── 틀 ───────── */
  function canSite(site) { var me = S.me; return site === 'all' || site === 'common' || me.role === 'owner' || (me.sites || []).indexOf(site) > -1; }
  function canMenu(key) {
    var me = S.me; if (me.role === 'owner') return true;
    if (key === 'members') return false;
    if (me.menus && me.menus.indexOf(key) < 0) return false;
    var m = MENU.filter(function (x) { return x[0] === key; })[0];
    return !m[2] || canSite(m[2]);
  }
  function canWrite(site, key) { var me = S.me; if (me.role === 'owner') return true; if (me.role !== 'editor') return false; if (key && !canMenu(key)) return false; return !site || site === 'common' || site === 'all' || (me.sites || []).indexOf(site) > -1; }
  function pos() { try { localStorage.setItem('hm_admin_pos2', JSON.stringify({ site: S.site, view: S.view })); } catch (e) {} }

  function shell() {
    var tabs = TABS.filter(function (t) { return canSite(t[0]); });
    if (!canSite(S.site)) S.site = 'all';
    var menu = MENU.filter(function (m) { return canMenu(m[0]); });
    if (!menu.some(function (m) { return m[0] === S.view; })) S.view = menu[0][0];
    var forced = MENU.filter(function (m) { return m[0] === S.view; })[0][2]; if (forced) S.site = forced;
    app.innerHTML = '<header class="top"><span class="brand">HOMI 관리자</span><nav class="sites" aria-label="사이트 선택">' +
      tabs.map(function (t) { return '<button type="button" data-site="' + t[0] + '" aria-pressed="' + (t[0] === S.site) + '">' + t[1] + '</button>'; }).join('') +
      '</nav><div class="who"><button type="button" id="whob" aria-haspopup="true">' + esc(S.me.name || S.me.email) + ' · ' + esc(ROLE[S.me.role] || S.me.role) + ' ▾</button>' +
      '<div class="menu" id="whom" hidden><p>' + esc(S.me.email) + '<br>' + (S.me.role === 'owner' ? '모든 사이트 · 모든 메뉴' : esc((S.me.sites || []).map(function (s) { return SN[s]; }).join(' · '))) + '</p><button type="button" id="lo">로그아웃</button></div></div></header>' +
      '<div class="wrap"><nav class="nav" aria-label="메뉴">' + menu.map(function (m) { return '<button type="button" data-view="' + m[0] + '" aria-current="' + (m[0] === S.view) + '">' + m[1] + '</button>'; }).join('') +
      '<p class="hint">위 사이트 선택에 따라 메뉴 내용이 바뀝니다. 권한이 없는 메뉴는 보이지 않습니다.</p></nav><main id="main"></main></div>';
    $$('.sites button').forEach(function (b) { b.onclick = function () { S.site = b.dataset.site; var f = MENU.filter(function (m) { return m[0] === S.view; })[0][2]; if (f && f !== S.site) S.view = S.site === 'production' ? 'works' : 'inbox'; pos(); shell(); }; });
    $$('.nav button').forEach(function (b) { b.onclick = function () { S.view = b.dataset.view; pos(); shell(); }; });
    $('#whob').onclick = function (e) { e.stopPropagation(); $('#whom').hidden = !$('#whom').hidden; };
    document.onclick = function () { var m = $('#whom'); if (m) m.hidden = true; };
    $('#lo').onclick = function () { api.signOut().then(function () { location.reload(); }); };
    render();
  }
  function render() {
    var m = $('#main');
    var V = { inbox: viewInbox, pages: viewPages, creators: viewCreators, works: viewWorks, trend: viewTrend, logos: viewLogos, settings: viewSettings, members: viewMembers, privacy: viewPrivacy, log: viewLog }[S.view];
    var db = ['inbox', 'creators', 'members', 'privacy'];
    if (S.setupNeeded && db.indexOf(S.view) > -1) { m.innerHTML = head(nameOf(MENU, S.view)) + '<div class="card empty">데이터베이스 설정(SQL) 후 열립니다.</div>'; return; }
    m.innerHTML = ''; V(m);
  }

  /* ───────── 문의함 (FR-COM-019 · p.30) ───────── */
  function typeOf(r) {
    if (r._cr) return 'creator';
    if (r.kind === 'chat') return 'chat';
    if (r.kind === 'rental') return 'rental';
    if (r.kind === 'production') return 'production';
    if (r.kind === 'project') return 'project';
    return r.site === 'market' ? 'consult' : r.site === 'factory' ? 'project' : 'production';
  }
  var viewed = {};
  function viewInbox(m) {
    var siteF = (S.site === 'all' || S.site === 'common') ? '' : S.site;
    m.innerHTML = head('문의함', '세 사이트의 상담 신청 · 문의 · 크리에이터 지원이 한곳에 쌓입니다', 'FR-COM-019 · 접수 알림 support@homifactory.com') +
      '<div class="stats" id="ist"></div>' +
      '<div class="row" style="margin-bottom:14px">' + TYPES.map(function (t) { return '<button type="button" class="chip" data-ty="' + t[0] + '" aria-pressed="' + (t[0] === 'all') + '">' + t[1] + '</button>'; }).join('') +
      '<span class="sp"></span><select class="chip" id="fst" aria-label="상태">' + opts(ST_INQ, '', '상태: 전체') + '</select><select class="chip" id="fas" aria-label="담당"><option value="">담당: 전체</option></select>' +
      '<button type="button" class="chip" id="fx">⬇ 엑셀 내보내기</button></div>' +
      '<div class="split"><div class="card tablewrap" id="ilist"><div class="empty">불러오는 중…</div></div><aside class="card side" id="ipanel"><div class="empty">왼쪽에서 문의를 고르세요</div></aside></div>' +
      '<p class="foot">개인정보가 보이는 화면 — 열람 · 다운로드는 기록이 남고, 보유 기간이 지나면 자동 파기(FR-COM-021)</p>';
    var ty = 'all', rows = [], selId = null;
    var crP = canMenu('creators') ? api.creators().catch(function () { return []; }) : Promise.resolve([]);
    Promise.all([api.inquiries(), crP]).then(function (rs) {
      rows = rs[0].concat(rs[1].map(function (c) { return Object.assign({}, c, { _cr: true, site: 'market', kind: 'creator' }); }))
        .sort(function (a, b) { return a.created_at < b.created_at ? 1 : -1; });
      var names = {}; rows.forEach(function (r) { if (r.assignee) names[r.assignee] = 1; }); S.members.forEach(function (x) { if (x.name) names[x.name] = 1; });
      $('#fas').insertAdjacentHTML('beforeend', Object.keys(names).map(function (n) { return '<option>' + esc(n) + '</option>'; }).join('') + '<option value="-">담당 없음</option>');
      draw();
    }).catch(function (er) { $('#ilist').innerHTML = '<div class="empty">불러오지 못했어요: ' + esc(er.message || er) + '</div>'; });
    function base() { return rows.filter(function (r) { return !siteF || r.site === siteF; }); }
    function list() {
      var st = $('#fst').value, as = $('#fas').value;
      return base().filter(function (r) { return (ty === 'all' || typeOf(r) === ty) && (!st || r.status === st || (r._cr && st === 'new' && r.status === 'new')) && (!as || (as === '-' ? !r.assignee : r.assignee === as)); });
    }
    function stats() {
      var b = base(), wk = Date.now() - 7 * 864e5, mo = new Date(); mo = new Date(mo.getFullYear(), mo.getMonth(), 1).getTime();
      var c = function (f) { return b.filter(f).length; };
      $('#ist').innerHTML = [['새 문의', c(function (r) { return r.status === 'new' && new Date(r.created_at) > wk; }), '최근 7일 · 아직 안 연 것'], ['연락 대기', c(function (r) { return r.status === 'new'; }), '신규 상태 전체'],
        ['진행 중', c(function (r) { return ['contacted', 'in_progress', 'reviewing'].indexOf(r.status) > -1; }), '연락함 · 진행 중'], ['이번 달 접수', c(function (r) { return new Date(r.created_at) >= mo; }), (new Date().getMonth() + 1) + '월']]
        .map(function (s) { return '<div class="stat"><span>' + s[0] + '</span><b>' + s[1] + '</b><small>' + s[2] + '</small></div>'; }).join('');
    }
    function draw() {
      stats();
      var rs = list();
      $('#ilist').innerHTML = rs.length ? '<table><thead><tr><th>받은 시각</th><th>사이트</th><th>유형</th><th>보낸 사람</th><th>담당</th><th>상태</th></tr></thead><tbody>' + rs.map(function (r) {
        var sender = r._cr ? esc(r.handle) + ' · ' + esc((r.platforms || [])[0] || '') : esc(r.name || '—') + (r.company ? ' · ' + esc(r.company) : '');
        return '<tr class="click' + (r.id === selId ? ' sel' : '') + '" data-id="' + esc(r.id) + '"><td style="white-space:nowrap;font-family:var(--fe)">' + fmt(r.created_at) + '</td><td>' + bdg(r.site) + '</td><td><b>' + esc(TYPE_NAME[typeOf(r)]) + '</b></td><td>' + sender + '</td><td>' + esc(r.assignee || '—') + '</td><td>' + pill(r._cr ? ST_CR : ST_INQ, r.status) + '</td></tr>';
      }).join('') + '</tbody></table>' : '<div class="empty">문의가 없어요.</div>';
      $$('#ilist tr.click').forEach(function (tr) { tr.onclick = function () { open(tr.dataset.id); }; });
      if (!selId && rs[0] && window.innerWidth > 1280) open(rs[0].id, true);
    }
    function open(id, auto) {
      selId = id; $$('#ilist tr.click').forEach(function (tr) { tr.classList.toggle('sel', tr.dataset.id === id); });
      var r = rows.filter(function (x) { return x.id === id; })[0]; if (!r) return;
      if (!auto && !viewed[id]) { viewed[id] = 1; api.audit('view', r.site, (r._cr ? 'creator:' : 'inquiry:') + id); }
      var p = $('#ipanel');
      if (r._cr) {
        p.innerHTML = '<h2>' + bdg('market') + '크리에이터 지원</h2><label class="lbl">보낸 내용</label><div class="box">' +
          [['활동명', r.handle], ['채널', r.channel_url], ['플랫폼', (r.platforms || []).join(', ')], ['팔로워', r.followers], ['나라', r.country], ['카테고리', (r.categories || []).join(', ')], ['자기소개', r.intro], ['이름', r.name], ['연락처', r.phone], ['이메일', r.email]]
            .filter(function (x) { return x[1]; }).map(function (x) { return '<b>' + esc(x[0]) + '</b> ' + esc(x[1]); }).join('\n') + '</div>' +
          '<label class="lbl">상태</label><select id="pst"' + (canWrite('market', 'creators') ? '' : ' disabled') + '>' + opts(ST_CR, r.status) + '</select>' +
          '<p class="hist">처리 기록 · ' + fmt(r.created_at) + ' 접수 → 알림 메일 발송' + (r.updated_at && r.updated_at !== r.created_at ? ' → ' + fmt(r.updated_at) + ' 수정' : '') + '</p>' +
          '<div class="acts"><button class="btn" type="button" id="pcr">크리에이터 DB에서 열기</button><span class="sp"></span>' + (canWrite('market', 'creators') ? '<button class="btn k" type="button" id="psv">저장</button>' : '') + '</div>';
        $('#pcr').onclick = function () { S.openCreator = r.id; S.view = 'creators'; S.site = 'market'; pos(); shell(); };
        var sv = $('#psv'); if (sv) sv.onclick = function () { var st = $('#pst').value; api.updCreator(r.id, { status: st }).then(function () { r.status = st; msg('저장했어요'); draw(); open(r.id); }).catch(fail('저장 실패')); };
        return;
      }
      var w = canWrite(r.site, 'inbox'), d = r.data || {}, hist = r.history || [];
      var people = {}; S.members.forEach(function (x) { if (x.name) people[x.name] = 1; }); if (r.assignee) people[r.assignee] = 1;
      p.innerHTML = '<h2>' + bdg(r.site) + esc(TYPE_NAME[typeOf(r)]) + '</h2><p class="help" style="margin:4px 0 0">' + fmtY(r.created_at) + ' ' + fmt(r.created_at).slice(6) + ' · ' + esc(r.lang || '') + ' · ' + esc(r.page || '') + '</p>' +
        '<label class="lbl">보낸 내용</label><div class="box">' + (r.summary ? '<b>' + esc(r.summary) + '</b>\n' : '') +
        Object.keys(d).map(function (k) { return esc(k) + ' · ' + esc(d[k]); }).join('\n') +
        '\n\n<b>' + esc(r.name || '') + '</b>' + (r.company ? ' · ' + esc(r.company) : '') + (r.phone ? '\n<a href="tel:' + esc(r.phone) + '">' + esc(r.phone) + '</a>' : '') + (r.email ? '\n<a href="mailto:' + esc(r.email) + '">' + esc(r.email) + '</a>' : '') + '</div>' +
        '<div class="two"><div><label class="lbl">담당자</label><select id="pas"' + (w ? '' : ' disabled') + '>' + opts(Object.keys(people), r.assignee || '', '—') + '</select></div>' +
        '<div><label class="lbl">상태</label><select id="pst"' + (w ? '' : ' disabled') + '>' + opts(ST_INQ, r.status) + '</select></div></div>' +
        '<label class="lbl">내부 메모</label><textarea id="pmm" placeholder="통화 내용, 다음 할 일"' + (w ? '' : ' disabled') + '>' + esc(r.memo || '') + '</textarea>' +
        '<p class="hist">처리 기록 · ' + fmt(r.created_at) + ' 접수 → 알림 메일 발송' + hist.map(function (h) { return ' → ' + fmt(h.at) + ' ' + esc(h.what) + (h.by ? '(' + esc(h.by) + ')' : ''); }).join('') + '</p>' +
        '<p class="help">보유 기한 ' + esc(r.retain_until || '') + ' (완료 처리일로부터 1년)</p>' +
        '<div class="acts"><a class="btn" id="prp" href="mailto:' + esc(r.email || '') + '?subject=' + encodeURIComponent('[HOMI ' + (SN[r.site] || '') + '] ' + (r.summary || '문의') + ' 답변드립니다') + '">이메일 답장</a>' +
        (w ? '<button class="btn d sm" type="button" id="pdl">삭제</button>' : '') + '<span class="sp"></span>' + (w ? '<button class="btn k" type="button" id="psv">저장</button>' : '') + '</div>';
      if (!w) return;
      $('#psv').onclick = function () {
        var np = { status: $('#pst').value, assignee: $('#pas').value || null, memo: $('#pmm').value.trim() || null }, h = hist.slice();
        if (np.status !== r.status) h.push({ at: new Date().toISOString(), by: who(), what: nameOf(ST_INQ, np.status) });
        if ((np.assignee || '') !== (r.assignee || '')) h.push({ at: new Date().toISOString(), by: who(), what: '담당 ' + (np.assignee || '없음') });
        np.history = h;
        if (np.status === 'done' && r.status !== 'done') np.retain_until = today(365);
        api.updInquiry(r.id, np).then(function () { Object.assign(r, np); api.audit('update', r.site, 'inquiry:' + r.id, { status: np.status }); msg('저장했어요'); draw(); open(r.id); }).catch(fail('저장 실패'));
      };
      $('#pdl').onclick = function () {
        if (!confirm('이 문의를 지울까요? 되돌릴 수 없어요.')) return;
        api.delInquiry(r.id).then(function () { api.audit('delete', r.site, 'inquiry:' + r.id); rows = rows.filter(function (x) { return x.id !== r.id; }); selId = null; $('#ipanel').innerHTML = '<div class="empty">지웠어요</div>'; draw(); }).catch(fail('삭제 실패'));
      };
    }
    $$('[data-ty]').forEach(function (b) { b.onclick = function () { ty = b.dataset.ty; $$('[data-ty]').forEach(function (x) { x.setAttribute('aria-pressed', x === b); }); draw(); }; });
    $('#fst').onchange = draw; $('#fas').onchange = draw;
    $('#fx').onclick = function () {
      var rs = list();
      xlsxOut(rs, [['created_at', '받은 시각'], ['site', '사이트'], [function (r) { return TYPE_NAME[typeOf(r)]; }, '유형'], [function (r) { return r.name || r.handle; }, '이름'], ['company', '회사'], ['phone', '연락처'], ['email', '이메일'], ['summary', '요약'], [function (r) { return r._cr ? r.channel_url : r.data; }, '내용'], ['assignee', '담당'], ['status', '상태'], ['memo', '메모']], 'HOMI_문의함_' + today() + '.xlsx')
        .then(function () { api.audit('export', siteF || 'all', 'inbox', { rows: rs.length }); msg(rs.length + '건을 내려받았어요 (기록 남음)'); }).catch(fail('내보내기 실패'));
    };
  }

  /* ───────── 크리에이터 DB (FR-COM-023 · p.32) ───────── */
  var CR_FIELDS = [['handle', '활동명*', ['활동명', '이름(활동명)', '닉네임', 'handle', 'name (handle)', '크리에이터']], ['channel_url', '채널 링크*', ['채널', '채널 링크', '채널링크', 'url', '링크', '계정', '주소', 'sns']],
    ['platforms', '플랫폼', ['플랫폼', 'platform']], ['followers', '팔로워 규모', ['팔로워', 'followers', '규모']], ['country', '국가', ['국가', '나라', 'country', '활동 국가']],
    ['categories', '카테고리', ['카테고리', '분야', 'category']], ['campaign_types', '캠페인 유형', ['캠페인 유형', '희망 캠페인', 'campaign']], ['name', '이름', ['성함', '실명', '이름']],
    ['phone', '연락처', ['연락처', '전화', '휴대폰', 'phone']], ['email', '이메일', ['이메일', 'email', '메일']], ['intro', '자기소개', ['자기소개', '소개', 'intro']], ['tags', '태그', ['태그', 'tag']], ['contact_log', '메모', ['메모', '비고', 'memo']]];
  function viewCreators(m) {
    var w = canWrite('market', 'creators');
    m.innerHTML = head('크리에이터 DB', '크리에이터 지원 페이지로 들어온 지원서가 쌓이는 곳', 'FR-COM-023 · 기존 구글 폼 DB 옮기기 Q-74') +
      '<div class="row" style="margin-bottom:14px"><input type="search" id="cq" placeholder="이름 · 링크 검색" style="width:220px">' +
      [['country', '국가'], ['platforms', '플랫폼'], ['followers', '팔로워 규모'], ['categories', '카테고리'], ['campaign_types', '캠페인 유형'], ['status', '상태']].map(function (f) { return '<select class="chip" data-f="' + f[0] + '" aria-label="' + f[1] + '"><option value="">' + f[1] + '</option></select>'; }).join('') +
      '<span class="sp"></span>' + (w ? '<button type="button" class="chip" id="cimp">⬆ 시트 가져오기</button>' : '') + '<button type="button" class="chip" id="cx">⬇ 엑셀</button></div>' +
      '<div class="selbar" id="csel"></div>' +
      '<div class="split cr"><div class="card tablewrap" id="clist"><div class="empty">불러오는 중…</div></div><aside class="card side" id="cpanel"><div class="empty">왼쪽에서 크리에이터를 고르세요</div></aside></div>' +
      '<p class="foot">같은 채널 링크로 다시 지원하면 새로 쌓지 않고 고침 · 보유 기간(2년) 지나면 30일 전 알림 후 파기 · 크리에이터 DB 담당 권한만 열람</p>';
    var rows = [], sel = {}, cur = null;
    function load(keep) {
      return api.creators().then(function (r) {
        rows = r; fill(); draw();
        var id = keep || S.openCreator; S.openCreator = null;
        if (id) open(id); else if (!cur && rows[0] && window.innerWidth > 1280) open(rows[0].id, true);
      }).catch(function (er) { $('#clist').innerHTML = '<div class="empty">불러오지 못했어요: ' + esc(er.message || er) + '</div>'; });
    }
    function fill() {
      $$('[data-f]').forEach(function (s) {
        var k = s.dataset.f, v = s.value, set = {};
        if (k === 'status') { s.innerHTML = opts(ST_CR, v, '상태'); return; }
        rows.forEach(function (r) { arr(r[k]).forEach(function (x) { set[x] = 1; }); });
        s.innerHTML = opts(Object.keys(set).sort(), v, s.getAttribute('aria-label'));
      });
    }
    function list() {
      var q = $('#cq').value.trim().toLowerCase(), f = {};
      $$('[data-f]').forEach(function (s) { if (s.value) f[s.dataset.f] = s.value; });
      return rows.filter(function (r) {
        if (q && [r.handle, r.channel_url, r.channels, r.name].join(' ').toLowerCase().indexOf(q) < 0) return false;
        return Object.keys(f).every(function (k) { return k === 'status' ? r.status === f[k] : arr(r[k]).indexOf(f[k]) > -1; });
      });
    }
    var joined = function (r) { return (r.campaigns || []).filter(function (c) { return c.state === '참여'; }).length; };
    function draw() {
      var rs = list();
      $('#clist').innerHTML = rs.length ? '<table><thead><tr><th style="width:40px"><input type="checkbox" class="ck" id="call" aria-label="모두 선택"></th><th>이름</th><th>국가</th><th>플랫폼</th><th>규모</th><th>카테고리</th><th>상태</th><th>참여</th></tr></thead><tbody>' + rs.map(function (r) {
        var j = joined(r);
        return '<tr class="click' + (cur && cur.id === r.id ? ' sel' : '') + '" data-id="' + esc(r.id) + '"><td><input type="checkbox" class="ck" data-ck="' + esc(r.id) + '"' + (sel[r.id] ? ' checked' : '') + ' aria-label="선택"></td><td><b>' + esc(r.handle) + '</b>' + (r.delete_requested ? ' <span class="pill hold">삭제 요청</span>' : '') + '</td><td>' + esc(r.country || '') + '</td><td>' + esc((r.platforms || []).join(' · ')) + '</td><td style="white-space:nowrap">' + esc(r.followers || '') + '</td><td>' + esc((r.categories || []).join(' · ')) + '</td><td>' + pill(ST_CR, r.status) + '</td><td>' + (j ? j + '건' : '—') + '</td></tr>';
      }).join('') + '</tbody></table>' : '<div class="empty">조건에 맞는 크리에이터가 없어요.</div>';
      $$('#clist tr.click').forEach(function (tr) { tr.onclick = function (e) { if (e.target.classList.contains('ck')) return; open(tr.dataset.id); }; });
      $$('[data-ck]').forEach(function (c) { c.onchange = function () { if (c.checked) sel[c.dataset.ck] = 1; else delete sel[c.dataset.ck]; bar(); }; });
      var all = $('#call'); if (all) all.onchange = function () { rs.forEach(function (r) { if (all.checked) sel[r.id] = 1; else delete sel[r.id]; }); draw(); };
      bar();
    }
    function ids() { return Object.keys(sel).filter(function (id) { return rows.some(function (r) { return r.id === id; }); }); }
    function bar() {
      var n = ids().length, b = $('#csel');
      b.innerHTML = '<b>' + n + '명 선택</b><span class="t">선택한 크리에이터를 캠페인 후보로 묶어 한 번에 연락 · 내보내기</span>' +
        (w ? '<input type="text" id="cbn" placeholder="캠페인명" style="width:140px"><button class="btn p" type="button" id="cbg"' + (n ? '' : ' disabled') + '>캠페인 후보로 묶기</button>' +
          '<select id="cbs" aria-label="바꿀 상태">' + opts(ST_CR, '', '상태 바꾸기') + '</select>' : '') +
        '<button class="btn" type="button" id="cbm"' + (n ? '' : ' disabled') + '>메일 주소 복사</button><button class="btn" type="button" id="cbx"' + (n ? '' : ' disabled') + '>선택 엑셀</button>';
      var pick = function () { var s = ids(); return rows.filter(function (r) { return s.indexOf(r.id) > -1; }); };
      if (w) {
        $('#cbg').onclick = function () {
          var name = $('#cbn').value.trim(); if (!name) { $('#cbn').focus(); return msg('캠페인명을 넣어 주세요', true); }
          var t = new Date(), month = t.getFullYear() + '.' + p2(t.getMonth() + 1), list = pick();
          Promise.all(list.map(function (r) { var c = (r.campaigns || []).slice(); if (!c.some(function (x) { return x.name === name; })) c.push({ name: name, month: month, result: '', state: '후보' }); return api.updCreator(r.id, { campaigns: c }); }))
            .then(function () { api.audit('campaign', 'market', name, { count: list.length }); msg(list.length + '명을 「' + name + '」 후보로 묶었어요'); load(cur && cur.id); }).catch(fail('묶기 실패'));
        };
        $('#cbs').onchange = function () {
          var st = $('#cbs').value, s = ids(); if (!st || !s.length) return;
          api.updCreators(s, { status: st }).then(function () { msg(s.length + '명 상태를 「' + nameOf(ST_CR, st) + '」(으)로 바꿨어요'); load(cur && cur.id); }).catch(fail('바꾸기 실패'));
        };
      }
      $('#cbm').onclick = function () { var t = pick().map(function (r) { return r.email; }).filter(Boolean).join(', '); (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(function () { api.audit('export', 'market', 'creators:emails', { count: ids().length }); msg('메일 주소를 복사했어요'); }).catch(function () { prompt('복사해 주세요', t); }); };
      $('#cbx').onclick = function () { exp(pick()); };
    }
    function exp(list) {
      xlsxOut(list, [['handle', '활동명'], ['channel_url', '채널'], ['channels', '다른 채널'], ['platforms', '플랫폼'], ['followers', '팔로워 규모'], ['country', '국가'], ['categories', '카테고리'], ['campaign_types', '캠페인 유형'], ['status', '상태'], ['tags', '태그'], ['rating', '평가'], [function (r) { return (r.campaigns || []).map(function (c) { return c.name + '(' + c.month + ' ' + c.state + ')'; }).join(', '); }, '참여 이력'], ['name', '이름'], ['phone', '연락처'], ['email', '이메일'], ['intro', '자기소개'], ['contact_log', '연락 기록'], ['created_at', '지원일'], ['retain_until', '보유 기한']], 'HOMI_크리에이터DB_' + today() + '.xlsx')
        .then(function () { api.audit('export', 'market', 'creators', { rows: list.length }); msg(list.length + '명을 내려받았어요 (기록 남음)'); }).catch(fail('내보내기 실패'));
    }
    function open(id, auto) {
      var r = rows.filter(function (x) { return x.id === id; })[0]; if (!r) return; cur = r;
      $$('#clist tr.click').forEach(function (tr) { tr.classList.toggle('sel', tr.dataset.id === id); });
      if (!auto && !viewed['c' + id]) { viewed['c' + id] = 1; api.audit('view', 'market', 'creator:' + id); }
      var camps = JSON.parse(JSON.stringify(r.campaigns || [])), rating = r.rating || 0, dis = w ? '' : ' disabled';
      var p = $('#cpanel');
      p.innerHTML = '<h2>' + esc(r.handle) + (r.country ? ' · ' + esc(r.country) : '') + '</h2><p class="help" style="margin-top:2px">' + esc((r.platforms || []).join(' · ')) + ' · ' + esc(r.followers || '') + ' · ' + esc((r.categories || []).join(' · ')) + (r.source === 'import' ? ' · 시트에서 가져옴' : '') + '</p>' +
        (r.delete_requested ? '<div class="notice" style="margin:12px 0 0">본인이 삭제를 요청했어요 — 「삭제 요청 처리」로 지워 주세요 (10일 안)</div>' : '') +
        '<label class="lbl">채널</label><div class="box" style="padding:9px 12px"><a href="' + esc(r.channel_url) + '" target="_blank" rel="noopener">' + esc(r.channel_url) + ' ↗</a></div>' +
        '<textarea id="pch" placeholder="다른 채널 링크 (줄마다 하나)" style="margin-top:6px;min-height:44px"' + dis + '>' + esc(r.channels || '') + '</textarea>' +
        '<div class="two"><div><label class="lbl">상태</label><select id="pst"' + dis + '>' + opts(ST_CR, r.status) + '</select></div><div><label class="lbl">캠페인 유형</label><input type="text" id="pct" value="' + esc((r.campaign_types || []).join(', ')) + '" placeholder="시딩, 방문, 팝업"' + dis + '></div></div>' +
        '<label class="lbl">태그 · 평가</label><div class="row" style="flex-wrap:nowrap"><input type="text" id="ptg" value="' + esc((r.tags || []).map(function (t) { return '#' + t; }).join(' ')) + '" placeholder="#스킨케어 #20대"' + dis + '><span class="stars" id="prt"></span></div>' +
        '<label class="lbl">참여 이력 <small>— 후보로 묶이면 여기 쌓이고, 실제 참여하면 「참여」로</small></label><div id="pcp"></div>' + (w ? '<button class="btn sm" type="button" id="pca">+ 이력 추가</button>' : '') +
        '<label class="lbl">연락 기록 · 메모</label><textarea id="plog" placeholder="10.04 라인으로 제안 → 수락"' + dis + '>' + esc(r.contact_log || r.memo || '') + '</textarea>' +
        '<label class="lbl">지원 정보</label><dl class="kv2"><dt>이름</dt><dd>' + esc(r.name || '') + '</dd><dt>연락처</dt><dd>' + esc(r.phone || '') + '</dd><dt>이메일</dt><dd>' + (r.email ? '<a href="mailto:' + esc(r.email) + '">' + esc(r.email) + '</a>' : '') + '</dd><dt>자기소개</dt><dd>' + esc(r.intro || '') + '</dd><dt>지원일</dt><dd>' + fmtY(r.created_at) + '</dd><dt>보유 기한</dt><dd>' + esc(r.retain_until || '') + '</dd></dl>' +
        '<div class="acts">' + (w ? '<button class="btn" type="button" id="pdl">삭제 요청 처리</button><span class="sp"></span><button class="btn k" type="button" id="psv">저장</button>' : '') + '</div>';
      function stars() { $('#prt').innerHTML = [1, 2, 3, 4, 5].map(function (i) { return '<button type="button" data-s="' + i + '" class="' + (i <= rating ? 'on' : '') + '" aria-label="' + i + '점"' + dis + '>' + (i <= rating ? '★' : '☆') + '</button>'; }).join(''); $$('#prt button').forEach(function (b) { b.onclick = function () { rating = +b.dataset.s === rating ? 0 : +b.dataset.s; stars(); }; }); }
      function campDraw() {
        $('#pcp').innerHTML = camps.length ? camps.map(function (c, i) { return '<div class="camp"><input type="text" data-c="name" data-i="' + i + '" value="' + esc(c.name) + '" placeholder="캠페인명"' + dis + '><input type="text" data-c="month" data-i="' + i + '" value="' + esc(c.month || '') + '" placeholder="2026.10"' + dis + '><select data-c="state" data-i="' + i + '"' + dis + '>' + opts(['후보', '참여'], c.state) + '</select>' + (w ? '<button type="button" data-rm="' + i + '" aria-label="지우기">×</button>' : '<span></span>') + '<input type="text" data-c="result" data-i="' + i + '" value="' + esc(c.result || '') + '" placeholder="결과 메모" style="grid-column:1/-1"' + dis + '></div>'; }).join('') : '<p class="help" style="margin:0 0 6px">아직 없어요</p>';
        $$('#pcp [data-c]').forEach(function (x) { x.oninput = x.onchange = function () { camps[+x.dataset.i][x.dataset.c] = x.value; }; });
        $$('#pcp [data-rm]').forEach(function (x) { x.onclick = function () { camps.splice(+x.dataset.rm, 1); campDraw(); }; });
      }
      stars(); campDraw();
      if (!w) return;
      $('#pca').onclick = function () { var t = new Date(); camps.push({ name: '', month: t.getFullYear() + '.' + p2(t.getMonth() + 1), result: '', state: '후보' }); campDraw(); };
      $('#psv').onclick = function () {
        var np = { status: $('#pst').value, channels: $('#pch').value.trim() || null, campaign_types: arr($('#pct').value), tags: $('#ptg').value.split(/[\s,]+/).map(function (t) { return t.replace(/^#/, ''); }).filter(Boolean),
          rating: rating || null, campaigns: camps.filter(function (c) { return c.name; }), contact_log: $('#plog').value.trim() || null };
        api.updCreator(r.id, np).then(function () { Object.assign(r, np); api.audit('update', 'market', 'creator:' + r.id); msg('저장했어요'); draw(); open(r.id, true); }).catch(fail('저장 실패'));
      };
      $('#pdl').onclick = function () {
        if (!confirm('「' + r.handle + '」의 정보를 모두 지울까요? (본인 삭제 요청 처리 · 되돌릴 수 없어요)')) return;
        api.delCreator(r.id).then(function () { api.audit('delete', 'market', 'creator:' + r.id, { handle: r.handle, reason: r.delete_requested ? '본인 요청' : '관리자' }); msg('지웠어요'); cur = null; $('#cpanel').innerHTML = '<div class="empty">지웠어요</div>'; load(); }).catch(fail('삭제 실패'));
      };
    }
    $('#cq').oninput = draw; $$('[data-f]').forEach(function (s) { s.onchange = draw; });
    $('#cx').onclick = function () { exp(list()); };
    var ib = $('#cimp'); if (ib) ib.onclick = importSheet;
    function importSheet() {
      var md = document.createElement('div'); md.className = 'modal';
      md.innerHTML = '<div class="card"><h2>시트 가져오기</h2><p class="help" style="margin:0 0 12px">기존 구글 폼 응답 시트를 [파일 → 다운로드 → .xlsx 또는 .csv]로 받아 올려 주세요. 첫 줄은 질문(열 이름)이어야 해요. 같은 채널 링크는 새로 쌓지 않고 고칩니다.</p>' +
        '<input type="file" id="imf" accept=".xlsx,.xls,.csv"><div id="imm"></div><div class="row" style="margin-top:18px"><span class="sp"></span><button class="btn" type="button" id="imc">닫기</button><button class="btn k" type="button" id="imgo" disabled>가져오기</button></div></div>';
      document.body.appendChild(md);
      var data = [], hdr = [];
      $('#imc', md).onclick = function () { md.remove(); };
      $('#imf', md).onchange = function () {
        var f = this.files[0]; if (!f) return;
        loadScript(XLSX_SRC).then(function () { return f.arrayBuffer(); }).then(function (buf) {
          var wb = window.XLSX.read(buf, { type: 'array' }), ws = wb.Sheets[wb.SheetNames[0]];
          data = window.XLSX.utils.sheet_to_json(ws, { defval: '', raw: false }); hdr = data.length ? Object.keys(data[0]) : [];
          var guess = function (syn) { var h = hdr.filter(function (x) { var l = x.toLowerCase(); return syn.some(function (s) { return l.indexOf(s.toLowerCase()) > -1; }); }); return h[0] || ''; };
          var used = {};
          $('#imm', md).innerHTML = '<p class="help">' + data.length + '줄을 읽었어요. 각 항목에 맞는 열을 골라 주세요.</p><div class="map">' + CR_FIELDS.map(function (fd) {
            var g = guess(fd[2]); if (used[g]) g = ''; if (g) used[g] = 1;
            return '<label for="mp_' + fd[0] + '"><b>' + fd[1] + '</b></label><select id="mp_' + fd[0] + '" data-mp="' + fd[0] + '">' + opts(hdr, g, '— 없음 —') + '</select>';
          }).join('') + '</div>';
          $('#imgo', md).disabled = !data.length;
        }).catch(fail('읽기 실패'));
      };
      $('#imgo', md).onclick = function () {
        var mp = {}; $$('[data-mp]', md).forEach(function (s) { if (s.value) mp[s.dataset.mp] = s.value; });
        if (!mp.handle || !mp.channel_url) return msg('활동명과 채널 링크 열은 꼭 골라 주세요', true);
        var seen = {}, out = [];
        data.forEach(function (row) {
          var o = { source: 'import' };
          Object.keys(mp).forEach(function (k) {
            var v = String(row[mp[k]] || '').trim(); if (!v) return;
            o[k] = ['platforms', 'categories', 'campaign_types', 'tags'].indexOf(k) > -1 ? arr(v).map(function (t) { return t.replace(/^#/, ''); }) : v.slice(0, 2000);
          });
          if (!o.handle || !o.channel_url) return;
          var key = o.channel_url.toLowerCase().replace(/^\s*(https?:\/\/)?(www\.)?/, '').replace(/[\/?#\s]+$/, '');
          if (seen[key]) Object.assign(out[seen[key] - 1], o); else { out.push(o); seen[key] = out.length; }
        });
        var btn = this; btn.disabled = true; var done = 0, chain = Promise.resolve();
        for (var i = 0; i < out.length; i += 200) (function (part) { chain = chain.then(function () { return api.upsertCreators(part); }).then(function () { done += part.length; btn.textContent = done + '/' + out.length; }); })(out.slice(i, i + 200));
        chain.then(function () { api.audit('import', 'market', 'creators', { rows: out.length }); msg(out.length + '명을 가져왔어요 (같은 채널은 고침)'); md.remove(); load(); })
          .catch(function (er) { btn.disabled = false; btn.textContent = '가져오기'; fail('가져오기 실패')(er); });
      };
    }
    load();
  }

  /* ───────── 작품 관리 (FR-PRD-007 · p.33) ───────── */
  var CATS = { visual: [['mv', '뮤직비디오'], ['film', '아티스트 필름'], ['live', '라이브·퍼포먼스']], commercial: [['ad', '광고·브랜드 필름'], ['series', '웹예능·시리즈'], ['short', '숏폼·SNS 콘텐츠']] };
  var CAT_NAME = {}; CATS.visual.concat(CATS.commercial).forEach(function (c) { CAT_NAME[c[0]] = c[1]; });
  var WROLES = ['기획', '촬영', '편집', '색보정', '모션그래픽', '음향'];
  function vparse(url) {
    url = String(url || '');
    var x = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/))([\w-]{11})/); if (x) return { kind: 'yt', id: x[1] };
    x = url.match(/vimeo\.com\/(?:video\/)?(\d+)/); return x ? { kind: 'vm', id: x[1] } : null;
  }
  function autoThumb(url) {
    var v = vparse(url); if (!v) return Promise.resolve('');
    if (v.kind === 'yt') return Promise.resolve('https://i.ytimg.com/vi/' + v.id + '/hqdefault.jpg');
    return fetch('https://vimeo.com/api/oembed.json?width=640&url=' + encodeURIComponent(url)).then(function (r) { return r.json(); }).then(function (j) { return j.thumbnail_url || ''; }).catch(function () { return ''; });
  }
  var thumbCache = {};
  function viewWorks(m) {
    var w = canWrite('production', 'works');
    m.innerHTML = head('작품 관리', '', '관리자 · FR-PRD-007 · 개발자 없이 추가 · 수정 · 삭제 · 숨김 · 순서', 'PRODUCTION') +
      '<div class="wk"><div class="card wl"><div class="wh"><div class="row" id="wfl">' + [['all', '전체'], ['visual', 'VISUAL'], ['commercial', 'COMMERCIAL']].map(function (f) { return '<button type="button" class="chip" data-wf="' + f[0] + '" aria-pressed="' + (f[0] === 'all') + '">' + f[1] + '</button>'; }).join('') + '</div><span class="sp"></span>' + (w ? '<button class="btn k" type="button" id="wadd">+ 작품 추가</button>' : '') + '</div>' +
      '<div id="wlist"><div class="empty">불러오는 중…</div></div><p class="foot" style="padding:4px 18px 18px">⠿ 끌어서 순서 변경 → 사이트 목록 순서에 그대로 반영 · ★ = Home 맨 위 대표 영상(1개만, VISUAL)</p></div>' +
      '<div class="card wf" id="wform"><div class="empty">왼쪽에서 작품을 고르거나 「+ 작품 추가」를 누르세요</div></div></div>';
    var rows = [], filt = 'all', cur = null;
    function load(keep) { return api.works().then(function (r) { rows = r; draw(); var k = keep && rows.filter(function (x) { return x.id === keep; })[0]; if (k) edit(k); else if (!cur && rows[0]) edit(rows[0]); }).catch(function (er) { $('#wlist').innerHTML = '<div class="empty">불러오지 못했어요: ' + esc(er.message || er) + '<br>작품 관리 권한(prd_admins 또는 계정 · 권한의 PRODUCTION 수정)이 있는지 확인해 주세요.</div>'; }); }
    function sorted() { return rows.filter(function (r) { return filt === 'all' || r.section === filt; }).sort(function (a, b) { return (a.section === b.section ? 0 : a.section === 'visual' ? -1 : 1) || a.sort_order - b.sort_order; }); }
    function thumbOf(r, el) {
      if (r.thumb_url) { el.style.backgroundImage = 'url("' + r.thumb_url + '")'; return; }
      var k = r.url; if (thumbCache[k] != null) { if (thumbCache[k]) el.style.backgroundImage = 'url("' + thumbCache[k] + '")'; return; }
      autoThumb(k).then(function (t) { thumbCache[k] = t; if (t) el.style.backgroundImage = 'url("' + t + '")'; });
    }
    function draw() {
      var rs = sorted();
      $('#wlist').innerHTML = rs.length ? rs.map(function (r) {
        return '<div class="wrow" draggable="' + w + '" data-id="' + esc(r.id) + '" aria-current="' + !!(cur && cur.id === r.id) + '"><span class="h">⠿</span><span class="th"></span><span><b>' + esc(r.title) + (r.is_featured ? ' ★ 대표' : '') + '</b><small>' + (r.section === 'visual' ? 'VISUAL' : 'COMMERCIAL') + ' · ' + esc(CAT_NAME[r.category] || '') + '</small></span><span class="st' + (r.hidden ? ' off' : '') + '">' + (r.hidden ? '숨김' : '공개') + '</span></div>';
      }).join('') : '<div class="empty">작품이 없어요.</div>';
      $$('#wlist .wrow').forEach(function (el) {
        var r = rows.filter(function (x) { return x.id === el.dataset.id; })[0]; thumbOf(r, $('.th', el));
        el.onclick = function () { edit(r); };
        if (!w) return;
        el.ondragstart = function (e) { e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', r.id); el.classList.add('drag'); };
        el.ondragend = function () { el.classList.remove('drag'); };
        el.ondragover = function (e) { e.preventDefault(); el.classList.add('over'); };
        el.ondragleave = function () { el.classList.remove('over'); };
        el.ondrop = function (e) {
          e.preventDefault(); el.classList.remove('over');
          var from = rows.filter(function (x) { return x.id === e.dataTransfer.getData('text/plain'); })[0]; if (!from || from.id === r.id) return;
          if (from.section !== r.section) return msg('VISUAL과 COMMERCIAL은 따로 정렬돼요 — 같은 구분 안에서 옮겨 주세요', true);
          var sec = rows.filter(function (x) { return x.section === r.section; }).sort(function (a, b) { return a.sort_order - b.sort_order; });
          sec.splice(sec.indexOf(from), 1); sec.splice(sec.indexOf(r), 0, from);
          var pairs = sec.map(function (x, i) { return [x.id, i]; });
          api.orderWorks(pairs).then(function () { pairs.forEach(function (p) { rows.forEach(function (x) { if (x.id === p[0]) x.sort_order = p[1]; }); }); draw(); api.audit('order', 'production', 'works'); msg('순서를 저장했어요. 사이트 순서도 그대로 바뀝니다.'); }).catch(fail('순서 저장 실패'));
        };
      });
    }
    function edit(r) {
      cur = r; $$('#wlist .wrow').forEach(function (el) { el.setAttribute('aria-current', !!(r && el.dataset.id === r.id)); });
      var d = Object.assign({ section: 'visual', category: 'mv', show_client: true, roles: [], hidden: false, is_featured: false }, r || {});
      var dis = w ? '' : ' disabled';
      $('#wform').innerHTML = '<h2>' + (r ? '작품 수정' : '작품 추가') + '</h2>' +
        '<label class="lbl">영상 링크 *</label><input type="url" id="wu" value="' + esc(d.url || '') + '" placeholder="https://www.youtube.com/watch?v=…"' + dis + '><p class="help" id="wue">유튜브 · 비메오 링크만 — 영상 파일은 사이트에 직접 올리지 않음. 썸네일은 링크에서 자동으로 가져옴</p>' +
        '<label class="lbl">구분 *</label><div class="tg" id="wsec">' + [['visual', 'VISUAL WORKS'], ['commercial', 'COMMERCIAL WORKS']].map(function (s) { return '<button type="button" data-v="' + s[0] + '" aria-pressed="' + (d.section === s[0]) + '"' + dis + '>' + s[1] + '</button>'; }).join('') + '</div>' +
        '<label class="lbl">분류 *</label><div class="tg" id="wcat"></div><p class="help">구분에 따라 분류가 바뀜 — COMMERCIAL은 광고·브랜드 필름 / 웹예능·시리즈 / 숏폼·SNS 콘텐츠 (Q-24)</p>' +
        '<div class="row" style="align-items:flex-start;flex-wrap:nowrap"><div style="flex:1"><label class="lbl">제목 *</label><input type="text" id="wt" value="' + esc(d.title || '') + '" placeholder="작품 제목"' + dis + '></div><div style="width:200px"><label class="lbl">공개 날짜</label><input type="date" id="wd" value="' + esc(d.published_on || '') + '"' + dis + '></div></div>' +
        '<label class="lbl">아티스트 · 고객사명</label><div class="row" style="flex-wrap:nowrap"><input type="text" id="wc" value="' + esc(d.client || '') + '" placeholder="이름"' + dis + '><label class="sw"><input type="checkbox" id="wsc"' + (d.show_client !== false ? ' checked' : '') + dis + '> 사이트에 이름 표시</label></div>' +
        '<label class="lbl">호미가 한 일</label><div class="tg" id="wro">' + WROLES.map(function (x) { return '<button type="button" data-v="' + x + '" aria-pressed="' + ((d.roles || []).indexOf(x) > -1) + '"' + dis + '>' + x + '</button>'; }).join('') + '</div><p class="help">여러 개 선택 · 팝업의 「호미가 한 일」에 표시</p>' +
        '<label class="lbl">설명</label><textarea id="wds" placeholder="어떤 작품인지 2~3줄"' + dis + '>' + esc(d.description || '') + '</textarea>' +
        '<label class="lbl">썸네일 <small id="wts"></small></label><div class="row"><span class="wthumb" id="wth"></span>' + (w ? '<button class="btn sm" type="button" id="wtc">자동으로 되돌리기</button>' : '') + '</div>' +
        (w ? '<div class="row" style="margin-top:22px"><label class="btn">썸네일 직접 올리기(선택)<input type="file" id="wtf" accept="image/*" hidden></label><button class="btn" type="button" id="wfe" aria-pressed="' + !!d.is_featured + '">' + (d.is_featured ? '★ 대표 영상 (해제)' : '★ 대표 영상으로 지정') + '</button>' +
          '<button class="btn" type="button" id="whd">' + (d.hidden ? '숨김 해제' : '숨김') + '</button>' + (r ? '<button class="btn d sm" type="button" id="wdl">삭제</button>' : '') + '<span class="sp"></span><button class="btn k" type="button" id="wsv">저장</button></div>' : '');
      var thumb = d.thumb_url || '';
      function cats() { $('#wcat').innerHTML = CATS[d.section].map(function (c) { return '<button type="button" data-v="' + c[0] + '" aria-pressed="' + (d.category === c[0]) + '"' + dis + '>' + c[1] + '</button>'; }).join(''); $$('#wcat button').forEach(function (b) { b.onclick = function () { d.category = b.dataset.v; cats(); }; }); }
      function prev() {
        var u = $('#wu').value.trim(); $('#wue').style.color = u && !vparse(u) ? 'var(--bad)' : '';
        (thumb ? Promise.resolve(thumb) : autoThumb(u)).then(function (t) { $('#wth').style.backgroundImage = t ? 'url("' + t + '")' : ''; $('#wts').textContent = thumb ? '— 직접 올린 썸네일' : (t ? '— 영상에서 자동' : ''); });
      }
      cats(); prev();
      $('#wu').oninput = prev;
      $$('#wsec button').forEach(function (b) { b.onclick = function () { d.section = b.dataset.v; d.category = CATS[d.section][0][0]; $$('#wsec button').forEach(function (x) { x.setAttribute('aria-pressed', x === b); }); cats(); }; });
      $$('#wro button').forEach(function (b) { b.onclick = function () { b.setAttribute('aria-pressed', b.getAttribute('aria-pressed') !== 'true'); }; });
      if (!w) return;
      $('#wtc').onclick = function () { thumb = ''; prev(); };
      $('#wtf').onchange = function () { var f = this.files[0]; if (!f) return; if (f.size > 5 * 1024 * 1024) return msg('5MB 이하 이미지만 올릴 수 있어요', true); msg('썸네일 올리는 중…'); api.uploadThumb(f).then(function (u) { thumb = u; prev(); msg('올렸어요 — 저장을 눌러 주세요'); }).catch(fail('업로드 실패')); };
      $('#wfe').onclick = function () { d.is_featured = !d.is_featured; this.textContent = d.is_featured ? '★ 대표 영상 (해제)' : '★ 대표 영상으로 지정'; this.setAttribute('aria-pressed', d.is_featured); };
      $('#whd').onclick = function () { d.hidden = !d.hidden; this.textContent = d.hidden ? '숨김 해제' : '숨김'; msg(d.hidden ? '저장하면 사이트에서 숨겨져요' : '저장하면 사이트에 보여요'); };
      var dl = $('#wdl'); if (dl) dl.onclick = function () { if (!confirm('「' + d.title + '」을 지울까요? 되돌릴 수 없어요.')) return; api.delWork(r.id).then(function () { api.audit('delete', 'production', 'work:' + r.id, { title: d.title }); msg('지웠어요'); cur = null; $('#wform').innerHTML = '<div class="empty">지웠어요</div>'; load(); }).catch(fail('삭제 실패')); };
      $('#wsv').onclick = function () {
        var row = { url: $('#wu').value.trim(), section: d.section, category: d.category, title: $('#wt').value.trim(), published_on: $('#wd').value || null, client: $('#wc').value.trim() || null, show_client: $('#wsc').checked,
          roles: $$('#wro button').filter(function (b) { return b.getAttribute('aria-pressed') === 'true'; }).map(function (b) { return b.dataset.v; }), description: $('#wds').value.trim() || null, thumb_url: thumb || null, is_featured: !!d.is_featured, hidden: !!d.hidden };
        if (!vparse(row.url)) { $('#wu').focus(); return msg('유튜브 또는 비메오 주소를 넣어 주세요', true); }
        if (!row.title) { $('#wt').focus(); return msg('제목을 넣어 주세요', true); }
        if (row.is_featured && row.section !== 'visual') return msg('대표 영상은 VISUAL WORKS 작품만 지정할 수 있어요', true);
        if (r) row.id = r.id; else row.sort_order = rows.filter(function (x) { return x.section === row.section; }).reduce(function (mx, x) { return Math.max(mx, x.sort_order + 1); }, 0);
        var b = this; b.disabled = true;
        (row.is_featured ? api.clearFeatured(row.id) : Promise.resolve()).then(function () { return api.saveWork(row); })
          .then(function (saved) { api.audit(r ? 'update' : 'create', 'production', 'work:' + (saved && saved.id), { title: row.title }); msg('저장했어요. 사이트에 바로 반영됩니다.'); return load(saved && saved.id); })
          .catch(fail('저장 실패')).then(function () { b.disabled = false; });
      };
    }
    $$('[data-wf]').forEach(function (b) { b.onclick = function () { filt = b.dataset.wf; $$('[data-wf]').forEach(function (x) { x.setAttribute('aria-pressed', x === b); }); draw(); }; });
    var add = $('#wadd'); if (add) add.onclick = function () { edit(null); };
    load();
  }

  /* ───────── 고객사 로고 · 사례 (MARKET Home 설정) ───────── */
  function viewLogos(m) {
    m.innerHTML = head('고객사 로고 · 사례', '고객사 로고 · 띠 배너 · 고객 사례 · Home 사진 · 영상. 저장하면 1~2분 뒤 4개 언어에 반영 (<a href="/market-admin/" target="_blank" rel="noopener">새 창 ↗</a>)', '', 'MARKET') +
      '<iframe class="embed" src="/market-admin/" title="고객사 로고 · 사례"></iframe>';
  }
  function viewTrend(m) { viewPages(m, { only: 'trend' }); }

  /* ───────── 사이트 설정 ───────── */
  function viewSettings(m) {
    var w = canWrite('common', 'settings');
    m.innerHTML = head('사이트 설정', '세 사이트가 함께 쓰는 연락처 · 알림 받는 곳 · 페이지 저장 키') +
      '<div class="card pad" id="sbox" style="margin-bottom:16px"><div class="empty">불러오는 중…</div></div>' +
      '<div class="card pad"><h2 style="font-size:16px;font-weight:900">페이지 저장 키 (GitHub)</h2><p class="help" style="margin:4px 0 10px">「페이지 편집」 · 「트렌드 리포트」 · 「고객사 로고」에서 게시할 때 씁니다. 이 브라우저에만 기억됩니다. 만드는 곳: GitHub → Settings → Developer settings → Fine-grained token (저장소 homifactory-site · Contents 읽기 · 쓰기)</p>' +
      '<div class="row" style="flex-wrap:nowrap"><input type="password" id="gt" placeholder="github_pat_…"><button class="btn k" id="gts" type="button">기억</button><span id="gst" class="help" style="margin:0;white-space:nowrap"></span></div></div>';
    $('#gt').value = tok(); $('#gst').textContent = tok() ? '기억됨' : '';
    $('#gts').onclick = function () { try { localStorage.setItem('hm_gh_token', $('#gt').value.trim()); } catch (e) {} $('#gst').textContent = $('#gt').value.trim() ? '기억됨' : ''; msg('저장 키를 기억했어요'); };
    if (S.setupNeeded) { $('#sbox').innerHTML = '<div class="empty">연락처 · 알림 설정은 데이터베이스 설정(SQL) 후 열립니다.</div>'; return; }
    api.settings().then(function (rows) {
      var g = function (k) { var r = rows.filter(function (x) { return x.key === k; })[0]; return (r && r.value) || {}; };
      var c = g('contact'), n = g('notify'), dis = w ? '' : ' disabled';
      var f = function (id, l, v, ph) { return '<div><label class="lbl">' + l + '</label><input type="text" id="' + id + '" value="' + esc(v || '') + '" placeholder="' + (ph || '') + '"' + dis + '></div>'; };
      $('#sbox').innerHTML = '<h2 style="font-size:16px;font-weight:900">연락처 · 알림</h2><div class="two">' + f('s_em', '대표 이메일', c.email) + f('s_ph', '대표 전화', c.phone) + f('s_hr', '운영시간', c.hours) + f('s_kk', '카카오톡 채널 주소', c.kakao, 'https://pf.kakao.com/…') + f('s_to', '문의 알림 받는 메일', n.to) + f('s_cc', '함께 받는 메일 (쉼표로 구분)', n.cc) + '</div>' +
        '<p class="help" style="margin:12px 0">사이트 화면의 연락처 글자는 「페이지 편집」 › 헤더 · 띠 배너 · 푸터에서 바꿉니다. 여기 값은 알림 메일 · 상담 창이 함께 씁니다.</p>' + (w ? '<button class="btn k" id="s_sv" type="button">저장</button>' : '');
      if (!w) return;
      $('#s_sv').onclick = function () {
        Promise.all([api.saveSetting('contact', { email: $('#s_em').value.trim(), phone: $('#s_ph').value.trim(), hours: $('#s_hr').value.trim(), kakao: $('#s_kk').value.trim() }), api.saveSetting('notify', { to: $('#s_to').value.trim(), cc: $('#s_cc').value.trim() })])
          .then(function () { api.audit('settings', 'common', 'contact/notify'); msg('저장했어요'); }).catch(fail('저장 실패'));
      };
    }).catch(function (er) { $('#sbox').innerHTML = '<div class="empty">불러오지 못했어요: ' + esc(er.message || er) + '</div>'; });
  }

  /* ───────── 계정 · 권한 (FR-COM-020) ───────── */
  function viewMembers(m) {
    var MK = MENU.map(function (x) { return [x[0], x[1].replace(/ \(.*\)$/, '')]; }).filter(function (x) { return x[0] !== 'members'; });
    m.innerHTML = head('계정 · 권한', '여기 있는 이메일만 관리자에 들어올 수 있어요. 사이트와 메뉴를 고르면 그것만 보입니다', 'FR-COM-020') +
      '<div class="card tablewrap" id="mlist" style="margin-bottom:16px"><div class="empty">불러오는 중…</div></div>' +
      '<div class="card pad"><h2 style="font-size:16px;font-weight:900">담당자 추가 · 수정</h2><div class="row" style="flex-wrap:nowrap;margin-top:12px"><input type="email" id="me_e" placeholder="이메일"><input type="text" id="me_n" placeholder="이름" style="max-width:180px"><select id="me_r" style="max-width:180px">' + opts(Object.keys(ROLE).map(function (k) { return [k, ROLE[k]]; }), 'editor') + '</select></div>' +
      '<label class="lbl">사이트</label><div>' + ['factory', 'market', 'production'].map(function (s) { return '<label class="chk"><input type="checkbox" class="me_s" value="' + s + '" checked> ' + SN[s] + '</label>'; }).join('') + '</div>' +
      '<label class="lbl">메뉴 <small>— 모두 체크 = 전체 메뉴 · 최고관리자는 항상 전체</small></label><div>' + MK.map(function (x) { return '<label class="chk"><input type="checkbox" class="me_m" value="' + x[0] + '" checked> ' + esc(x[1]) + '</label>'; }).join('') + '</div>' +
      '<div class="row" style="margin-top:14px"><button class="btn k" id="me_sv" type="button">저장</button><label class="chk" style="margin:0"><input type="checkbox" id="me_inv" checked> 저장하면서 로그인 링크(초대 메일) 보내기</label></div>' +
      '<p class="help">최고관리자 = 모든 사이트 · 메뉴 · 계정 관리 / 담당자 = 고른 사이트 · 메뉴 읽기 · 수정 / 보기 전용 = 읽기만</p></div>';
    var load = function () {
      api.members().then(function (rows) {
        S.members = rows;
        $('#mlist').innerHTML = '<table><thead><tr><th>이메일</th><th>이름</th><th>권한</th><th>사이트</th><th>메뉴</th><th></th></tr></thead><tbody>' + rows.map(function (r) {
          return '<tr><td>' + esc(r.email) + '</td><td>' + esc(r.name || '') + '</td><td><b>' + esc(ROLE[r.role] || r.role) + '</b></td><td>' + (r.role === 'owner' ? '전체' : esc((r.sites || []).map(function (s) { return SN[s]; }).join(', '))) + '</td>' +
            '<td>' + (r.role === 'owner' || !r.menus ? '전체' : esc(r.menus.map(function (k) { return nameOf(MK, k); }).join(', '))) + '</td>' +
            '<td style="white-space:nowrap"><button class="btn sm" type="button" data-ed="' + esc(r.email) + '">수정</button> ' + (r.email === S.me.email ? '' : '<button class="btn d sm" type="button" data-rm="' + esc(r.email) + '">빼기</button>') + '</td></tr>';
        }).join('') + '</tbody></table>';
        $$('[data-ed]').forEach(function (b) { b.onclick = function () { var r = rows.filter(function (x) { return x.email === b.dataset.ed; })[0]; $('#me_e').value = r.email; $('#me_n').value = r.name || ''; $('#me_r').value = r.role; $$('.me_s').forEach(function (c) { c.checked = (r.sites || []).indexOf(c.value) > -1; }); $$('.me_m').forEach(function (c) { c.checked = !r.menus || r.menus.indexOf(c.value) > -1; }); $('#me_inv').checked = false; $('#me_e').focus(); }; });
        $$('[data-rm]').forEach(function (b) { b.onclick = function () { if (!confirm(b.dataset.rm + ' 계정을 관리자에서 뺄까요?')) return; api.delMember(b.dataset.rm).then(function () { api.audit('member_remove', 'common', b.dataset.rm); msg('뺐어요'); load(); }).catch(fail('실패')); }; });
      }).catch(function (er) { $('#mlist').innerHTML = '<div class="empty">불러오지 못했어요: ' + esc(er.message || er) + '</div>'; });
    };
    $('#me_sv').onclick = function () {
      var e = $('#me_e').value.trim().toLowerCase(); if (!/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(e)) return msg('이메일을 확인해 주세요', true);
      var menus = $$('.me_m').filter(function (c) { return c.checked; }).map(function (c) { return c.value; });
      var mem = { email: e, name: $('#me_n').value.trim() || null, role: $('#me_r').value, sites: $$('.me_s').filter(function (c) { return c.checked; }).map(function (c) { return c.value; }), menus: menus.length === $$('.me_m').length ? null : menus };
      api.saveMember(mem).then(function () { api.audit('member_save', 'common', e, { role: mem.role, sites: mem.sites, menus: mem.menus }); return $('#me_inv').checked ? api.invite(e).then(function () { msg('저장하고 로그인 링크를 보냈어요'); }) : msg('저장했어요'); })
        .then(function () { $('#me_e').value = ''; $('#me_n').value = ''; load(); }).catch(fail('실패'));
    };
    load();
  }

  /* ───────── 개인정보 관리 (FR-COM-021·022) ───────── */
  function viewPrivacy(m) {
    var w = canWrite('common', 'privacy');
    m.innerHTML = head('개인정보 관리', '처리방침(<a href="/market/privacy" target="_blank" rel="noopener">전문 ↗</a>)의 보유 기간을 지키고, 본인 요청(열람 · 정정 · 삭제)을 처리하는 곳', 'FR-COM-021 · 자동 파기 매일 04:00') +
      '<div class="stats" id="pst"></div>' +
      '<div class="split"><div>' +
      '<div class="card pad" style="margin-bottom:16px"><h2 style="font-size:16px;font-weight:900;margin-bottom:6px">30일 안에 파기 예정</h2><p class="help" style="margin:0 0 8px">보유 기간이 끝나기 30일 전부터 여기 보입니다. 계속 함께할 크리에이터는 연장하세요(본인 동의 후).</p><div id="psoon"><div class="empty">확인하는 중…</div></div></div>' +
      '<div class="card pad"><h2 style="font-size:16px;font-weight:900;margin-bottom:6px">본인 요청 처리 (열람 · 정정 · 삭제)</h2><div class="row" style="flex-wrap:nowrap"><input type="search" id="pq" placeholder="요청한 분의 이메일 · 전화번호 · 이름 · 채널"><button class="btn k" id="pf" type="button">찾기</button></div><div id="pres" style="margin-top:12px"></div>' +
      '<p class="help">요청을 받은 날부터 10일 안에 처리합니다(처리방침 제8조). 본인 확인 후 처리해 주세요.</p></div></div>' +
      '<aside class="card side" style="min-height:0"><h2>보유 기간</h2><table style="margin-top:8px"><tbody><tr><td>상담 신청서 · 프로젝트 · 제작 · 대관 문의</td><td><b>완료 후 1년</b></td></tr><tr><td>실시간 채팅 상담</td><td><b>종료 후 1년</b></td></tr><tr><td>크리에이터 지원</td><td><b>접수 후 2년</b></td></tr></tbody></table>' +
      '<h2 style="margin-top:22px">기간이 지난 정보 지우기</h2><p class="help" id="pexp">확인하는 중…</p>' + (w ? '<button class="btn d" id="ppg" type="button" style="margin-top:10px;align-self:flex-start">지금 파기</button>' : '') +
      '<p class="help" style="margin-top:10px">매일 04:00(한국시간) 자동으로도 지웁니다. 완료 · 보류 · 스팸 문의와 기한이 지난 크리에이터, 본인 삭제 요청분이 대상. 메일함 · 구글 시트 사본은 따로 지워 주세요.</p></aside></div>';
    var inq = [], cr = [];
    function load() {
      Promise.all([api.inquiries(), api.creators()]).then(function (rs) {
        inq = rs[0]; cr = rs[1]; var t = today(), t30 = today(30);
        var expI = inq.filter(function (r) { return r.retain_until < t && ['done', 'hold', 'spam'].indexOf(r.status) > -1; }), expC = cr.filter(function (r) { return r.retain_until < t || r.delete_requested; });
        var soon = inq.filter(function (r) { return r.retain_until >= t && r.retain_until <= t30; }).map(function (r) { return { k: 'i', r: r }; }).concat(cr.filter(function (r) { return r.retain_until >= t && r.retain_until <= t30; }).map(function (r) { return { k: 'c', r: r }; }));
        $('#pst').innerHTML = [['보관 중 문의', inq.length, '세 사이트'], ['보관 중 크리에이터', cr.length, 'MARKET'], ['30일 안 파기', soon.length, '아래 목록'], ['삭제 요청', cr.filter(function (r) { return r.delete_requested; }).length, '10일 안 처리']].map(function (s) { return '<div class="stat"><span>' + s[0] + '</span><b>' + s[1] + '</b><small>' + s[2] + '</small></div>'; }).join('');
        $('#pexp').textContent = '지금 지울 대상: 문의 ' + expI.length + '건 · 크리에이터 ' + expC.length + '명'; var pb = $('#ppg'); if (pb) pb.disabled = !(expI.length + expC.length);
        $('#psoon').innerHTML = soon.length ? '<table><thead><tr><th>구분</th><th>이름</th><th>파기 예정일</th><th></th></tr></thead><tbody>' + soon.map(function (x) {
          return '<tr><td>' + (x.k === 'i' ? bdg(x.r.site) : bdg('market') + ' 크리에이터') + '</td><td>' + esc(x.k === 'i' ? x.r.name : x.r.handle) + '</td><td>' + esc(x.r.retain_until) + '</td><td>' + (w && x.k === 'c' ? '<button class="btn sm" type="button" data-ext="' + esc(x.r.id) + '">1년 연장</button>' : '') + '</td></tr>';
        }).join('') + '</tbody></table>' : '<div class="empty" style="padding:16px">30일 안에 파기될 정보가 없어요.</div>';
        $$('[data-ext]').forEach(function (b) { b.onclick = function () { var r = cr.filter(function (x) { return x.id === b.dataset.ext; })[0], d = new Date(r.retain_until); d.setFullYear(d.getFullYear() + 1); var v = d.toISOString().slice(0, 10); api.updCreator(r.id, { retain_until: v }).then(function () { api.audit('extend', 'market', 'creator:' + r.id, { until: v }); msg('보유 기한을 ' + v + '까지 늘렸어요'); load(); }).catch(fail('실패')); }; });
      }).catch(function (er) { $('#psoon').innerHTML = '<div class="empty">불러오지 못했어요: ' + esc(er.message || er) + '</div>'; });
    }
    var pb = $('#ppg'); if (pb) pb.onclick = function () { if (!confirm('보관 기한이 지난 정보를 지울까요? 되돌릴 수 없어요.')) return; api.purge().then(function (r) { msg('지웠어요 — 문의 ' + r.inquiries + '건 · 크리에이터 ' + r.creators + '명'); load(); }).catch(fail('실패')); };
    $('#pf').onclick = function () {
      var q = $('#pq').value.trim().toLowerCase(); if (q.length < 3) return msg('3글자 이상 넣어 주세요', true);
      var hit = function (r) { return [r.email, r.phone, r.name, r.handle, r.channel_url].join(' ').toLowerCase().indexOf(q) > -1; };
      var rows = inq.filter(hit).map(function (x) { return { k: 'i', r: x }; }).concat(cr.filter(hit).map(function (x) { return { k: 'c', r: x }; }));
      api.audit('search', 'common', 'privacy', { q: q.slice(0, 3) + '…', hits: rows.length });
      $('#pres').innerHTML = rows.length ? '<table><tbody>' + rows.map(function (x) { var r = x.r; return '<tr><td>' + (x.k === 'i' ? bdg(r.site) + ' 문의' : bdg('market') + ' 크리에이터') + '</td><td>' + esc(r.name || '') + (r.handle ? ' (' + esc(r.handle) + ')' : '') + '</td><td>' + esc((r.email || '') + ' ' + (r.phone || '')) + '</td><td>' + fmtY(r.created_at) + '</td><td style="white-space:nowrap"><button class="btn sm" type="button" data-dl="' + x.k + ':' + esc(r.id) + '">열람용 받기</button> ' + (w ? '<button class="btn d sm" type="button" data-rm="' + x.k + ':' + esc(r.id) + '">지우기</button>' : '') + '</td></tr>'; }).join('') + '</tbody></table>' : '<div class="empty">찾은 정보가 없어요.</div>';
      var find = function (v) { var k = v.split(':')[0], id = v.slice(2); return { k: k, r: (k === 'i' ? inq : cr).filter(function (x) { return x.id === id; })[0] }; };
      $$('#pres [data-dl]').forEach(function (b) { b.onclick = function () { var x = find(b.dataset.dl), r = Object.assign({}, x.r); delete r._cr; var a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify(r, null, 2)], { type: 'application/json' })); a.download = 'HOMI_개인정보열람_' + today() + '.json'; a.click(); api.audit('export', x.k === 'i' ? r.site : 'market', (x.k === 'i' ? 'inquiry:' : 'creator:') + r.id, { reason: '본인 열람 요청' }); }; });
      $$('#pres [data-rm]').forEach(function (b) { b.onclick = function () { var x = find(b.dataset.rm); if (!confirm('이 정보를 지울까요? 되돌릴 수 없어요.')) return; (x.k === 'i' ? api.delInquiry(x.r.id) : api.delCreator(x.r.id)).then(function () { api.audit('delete', x.k === 'i' ? x.r.site : 'market', (x.k === 'i' ? 'inquiry:' : 'creator:') + x.r.id, { reason: '본인 삭제 요청' }); msg('지웠어요'); load(); b.closest('tr').remove(); }).catch(fail('실패')); }; });
    };
    load();
  }

  /* ───────── 변경 기록 (FR-COM-021) ───────── */
  var ACT = { view: '열람', export: '다운로드', update: '수정', delete: '삭제', create: '추가', publish: '페이지 게시', import: '시트 가져오기', campaign: '캠페인 후보 묶기', order: '순서 변경', settings: '설정 저장', member_save: '계정 저장', member_remove: '계정 빼기', purge: '자동·수동 파기', extend: '보유 연장', search: '개인정보 검색' };
  function viewLog(m) {
    var siteF = (S.site === 'all' || S.site === 'common') ? '' : S.site;
    m.innerHTML = head('변경 기록', '누가 언제 무엇을 보고 · 바꾸고 · 내려받았는지 (개인정보 열람 · 다운로드 포함)', 'FR-COM-021') +
      '<div class="row" style="margin-bottom:14px"><select class="chip" id="lga">' + opts(Object.keys(ACT).map(function (k) { return [k, ACT[k]]; }), '', '모든 동작') + '</select><input type="search" id="lgq" placeholder="사람 · 대상 검색" style="width:240px"></div>' +
      '<div class="card tablewrap" id="lgl" style="margin-bottom:16px"><div class="empty">불러오는 중…</div></div>' +
      '<div class="card pad"><h2 style="font-size:16px;font-weight:900;margin-bottom:8px">페이지 게시 기록 (GitHub)</h2><div id="lgg"><div class="empty">불러오는 중…</div></div></div>';
    var rows = [];
    (S.setupNeeded ? Promise.resolve([]) : api.auditList()).then(function (r) { rows = r; draw(); }).catch(function (er) { $('#lgl').innerHTML = '<div class="empty">불러오지 못했어요: ' + esc(er.message || er) + '</div>'; });
    function draw() {
      var a = $('#lga').value, q = $('#lgq').value.trim().toLowerCase();
      var rs = rows.filter(function (r) { return (!siteF || r.site === siteF) && (!a || r.action === a) && (!q || [r.actor, r.target, JSON.stringify(r.detail || '')].join(' ').toLowerCase().indexOf(q) > -1); });
      $('#lgl').innerHTML = rs.length ? '<table><thead><tr><th>시각</th><th>사람</th><th>사이트</th><th>동작</th><th>대상</th><th>내용</th></tr></thead><tbody>' + rs.map(function (r) {
        return '<tr><td style="white-space:nowrap">' + fmtY(r.at) + ' ' + fmt(r.at).slice(6) + '</td><td>' + esc(r.actor) + '</td><td>' + (r.site && SN[r.site] && r.site !== 'common' ? bdg(r.site) : esc(SN[r.site] || r.site || '')) + '</td><td><b>' + esc(ACT[r.action] || r.action) + '</b></td><td><code style="font-size:12px">' + esc(r.target || '') + '</code></td><td style="font-size:12px;color:var(--mut)">' + esc(r.detail ? JSON.stringify(r.detail) : '') + '</td></tr>';
      }).join('') + '</tbody></table>' : '<div class="empty">' + (S.setupNeeded ? '데이터베이스 설정(SQL) 후 기록이 쌓입니다.' : '기록이 없어요.') + '</div>';
    }
    $('#lga').onchange = draw; $('#lgq').oninput = draw;
    gh('/commits?sha=' + BR + '&per_page=100').then(function (r) { if (!r.ok) throw new Error('GitHub ' + r.status); return r.json(); }).then(function (cs) {
      cs = cs.filter(function (c) { var t = c.commit.message; return /^admin:/.test(t) && (!siteF || t.indexOf(siteF) > -1); });
      $('#lgg').innerHTML = cs.length ? '<table><tbody>' + cs.slice(0, 50).map(function (c) { return '<tr><td style="white-space:nowrap">' + fmtY(c.commit.author.date) + ' ' + fmt(c.commit.author.date).slice(6) + '</td><td>' + esc(c.commit.message.split('\n')[0].replace(/^admin:\s*/, '')) + '</td><td><a href="' + esc(c.html_url) + '" target="_blank" rel="noopener">보기 ↗</a></td></tr>'; }).join('') + '</tbody></table>' : '<div class="empty" style="padding:16px">관리자에서 게시한 기록이 아직 없어요.</div>';
    }).catch(function (er) { $('#lgg').innerHTML = '<div class="empty" style="padding:16px">불러오지 못했어요 (' + esc(er.message || er) + ')</div>'; });
  }

  /* ───────── 페이지 편집 (FR-COM-018 · p.31) ─────────
     저장소 HTML을 그대로 읽어 <section> 단위로 나누고, 글자 · 링크 · 사진 · 영상 · 순서 · 숨김을 그 자리만 바꿔 게시 */
  function tok() { try { return localStorage.getItem('hm_gh_token') || ''; } catch (e) { return ''; } }
  function gh(path, opt) {
    opt = opt || {}; opt.headers = Object.assign({ Accept: 'application/vnd.github+json' }, opt.headers || {}); var t = tok(); if (t) opt.headers.Authorization = 'Bearer ' + t;
    return fetch('https://api.github.com/repos/' + REPO + path, opt);
  }
  function b64dec(b) { var bin = atob(b.replace(/\n/g, '')); var u = new Uint8Array(bin.length); for (var i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i); return new TextDecoder().decode(u); }
  function b64enc(s) { var u = new TextEncoder().encode(s), bin = ''; for (var i = 0; i < u.length; i += 0x8000) bin += String.fromCharCode.apply(null, u.subarray(i, i + 0x8000)); return btoa(bin); }
  function fileB64(f) { return new Promise(function (ok, no) { var r = new FileReader(); r.onload = function () { ok(String(r.result).split(',')[1]); }; r.onerror = no; r.readAsDataURL(f); }); }
  /* 파일 읽기: 실서비스는 GitHub(최신 원본 + sha), 로컬 점검은 같은 서버 파일 */
  function readFile(path) {
    if (mock) return fetch('/' + path, { cache: 'no-store' }).then(function (r) { if (!r.ok) throw new Error('파일 없음 ' + path); return r.text(); }).then(function (t) { return { path: path, sha: 'mock', html: t }; });
    return gh('/contents/' + encodeURI(path) + '?ref=' + BR).then(function (r) {
      if (r.status === 404) throw new Error('없는 파일 ' + path);
      if (!r.ok) throw new Error('파일을 못 불러왔어요 (' + r.status + (r.status === 403 ? ' — 잠시 뒤 또는 저장 키를 넣고 다시' : '') + ')');
      return r.json();
    }).then(function (j) {
      if (j.content) return { path: path, sha: j.sha, html: b64dec(j.content) };
      return fetch(j.download_url, { cache: 'no-store' }).then(function (r) { return r.text(); }).then(function (t) { return { path: path, sha: j.sha, html: t }; });
    });
  }
  function writeFile(path, html, sha, message) {
    if (mock) { (window.__puts = window.__puts || []).push({ path: path, html: html, message: message }); return Promise.resolve({ content: { sha: 'mock' } }); }
    return gh('/contents/' + encodeURI(path), { method: 'PUT', body: JSON.stringify({ message: message, content: b64enc(html), sha: sha, branch: BR }) }).then(function (r) {
      if (r.status === 409) throw new Error('그사이 다른 곳에서 ' + path + ' 이(가) 바뀌었어요 — 페이지를 다시 열어 고쳐 주세요');
      if (r.status === 401 || r.status === 403) throw new Error('저장 키가 맞지 않거나 쓰기 권한이 없어요 (' + r.status + ')');
      if (!r.ok) throw new Error('게시 실패 ' + path + ' (' + r.status + ')'); return r.json();
    });
  }
  function uploadAsset(site, f) {
    var ext = (f.name.match(/\.(png|jpe?g|webp|gif|svg|mp4|webm|mov)$/i) || ['', 'jpg'])[1].toLowerCase(), path = 'assets/uploads/' + site + '/' + Date.now() + '-' + Math.random().toString(36).slice(2, 6) + '.' + ext;
    if (mock) return Promise.resolve('/' + path);
    var tries = 0;
    var put = function () { return fileB64(f).then(function (c) { return gh('/contents/' + path, { method: 'PUT', body: JSON.stringify({ message: 'admin: ' + site + ' 사진·영상 업로드', content: c, branch: BR }) }); }).then(function (r) { if ((r.status === 409 || r.status === 422) && ++tries < 4) return new Promise(function (ok) { setTimeout(ok, 1500 * tries); }).then(put); if (!r.ok) throw new Error('업로드 실패 (' + r.status + ')'); return '/' + path; }); };
    return put();
  }
  function lastPublished(path) {
    if (mock) return Promise.resolve(null);
    return gh('/commits?path=' + encodeURIComponent(path) + '&sha=' + BR + '&per_page=1').then(function (r) { return r.ok ? r.json() : []; }).then(function (j) { return j[0] ? j[0].commit.author.date : null; }).catch(function () { return null; });
  }

  /* 페이지 목록 */
  var LANGS = [['', '한국어'], ['en', 'English'], ['ja', '日本語'], ['id', 'Bahasa']];
  var MK_PAGES = [['Home', 'index'], ['서비스 › 인플루언서 마케팅', 'service-influencer'], ['서비스 › 방문 프로모션', 'service-visit'], ['서비스 › 팝업 및 행사 운영', 'service-event'], ['상담 신청서', 'contact'], ['크리에이터 지원', 'creator'],
    ['트렌드 리포트', 'trend-report'], ['About', 'about'], ['Global', 'global'], ['How We Work', 'how-we-work'], ['고객 사례', 'case'], ['헤더 · 띠 배너 · 푸터', '#chrome'], ['실시간 상담 창 문구', '#chat'], ['개인정보 처리방침 · 이용약관', 'privacy', 'terms']];
  var TREND_PAGES = [['트렌드 리포트 목록', 'trend-report'], ['트렌드 리포트 상세', 'trend-report-detail']];
  var HOME_LABEL = { hero: '① 히어로', 'how-we-work': '③-1 우리가 일하는 방식', 'team-result': '③-2 숫자로 보는 호미', partner: '⑤ 전담 매니저', directions: '⑦ 방향별 플랜', 'network-section': '⑧ Global Network', 'case': '⑨ 고객 사례', 'mkt-shorts': '⑨-1 숏폼 영상', faq: '⑩ 자주 묻는 질문', 'final-cta': '⑪ 마지막 한 마디' };
  var treeCache = null;
  function repoTree() {
    if (treeCache) return Promise.resolve(treeCache);
    if (mock) return Promise.resolve(treeCache = ['index.html', 'about.html', 'contact.html', 'privacy.html', 'production/index.html', 'production/works.html', 'production/contact.html']);
    return gh('/git/trees/' + BR + '?recursive=1').then(function (r) { if (!r.ok) throw new Error('목록을 못 불러왔어요 (' + r.status + ')'); return r.json(); }).then(function (j) { return (treeCache = j.tree.filter(function (t) { return t.type === 'blob' && /\.html$/.test(t.path); }).map(function (t) { return t.path; })); });
  }
  function nice(p) { var b = p.replace(/^.*\//, '').replace(/\.html$/, ''); return b === 'index' ? 'Home' : b.replace(/[-_]/g, ' ').replace(/\b\w/g, function (c) { return c.toUpperCase(); }); }
  function pageGroups(site, only) {
    var mk = function (list) { return list.map(function (x) { return { site: 'market', label: x[0], files: x.slice(1).map(function (f) { return f[0] === '#' ? f : 'market/' + f + '.html'; }) }; }); };
    if (only === 'trend') return Promise.resolve([{ g: 'MARKET 트렌드 리포트', pages: mk(TREND_PAGES) }]);
    var want = site === 'all' ? ['factory', 'market', 'production', 'common'] : [site];
    return repoTree().catch(function (er) { msg(er.message, true); return []; }).then(function (tree) {
      var out = [];
      want.forEach(function (s) {
        if (s === 'market') out.push({ g: 'MARKET 페이지', pages: mk(MK_PAGES) });
        if (s === 'factory') out.push({ g: 'FACTORY 페이지', pages: tree.filter(function (p) { return /^[^/]+\.html$/.test(p) && !/^(404|admin|google)/.test(p); }).sort(function (a, b) { return a === 'index.html' ? -1 : b === 'index.html' ? 1 : a < b ? -1 : 1; }).map(function (p) { return { site: 'factory', label: nice(p), files: [p] }; }) });
        if (s === 'production') out.push({ g: 'PRODUCTION 페이지', pages: tree.filter(function (p) { return /^production\/[^/]+\.html$/.test(p) && !/admin/.test(p); }).sort(function (a, b) { return /index\.html$/.test(a) ? -1 : /index\.html$/.test(b) ? 1 : a < b ? -1 : 1; }).map(function (p) { return { site: 'production', label: nice(p), files: [p] }; }) });
        if (s === 'common') out.push({ g: '공통', pages: [{ site: 'common', label: '헤더 메뉴 (세 사이트 공통)', files: ['#header'] }].concat(tree.filter(function (p) { return /(^|\/)(privacy|terms)\.html$/.test(p) && !/^(en|ja|id)\//.test(p); }).map(function (p) { return { site: 'common', label: (p.indexOf('/') > -1 ? p.split('/')[0].toUpperCase() + ' · ' : 'FACTORY · ') + (/privacy/.test(p) ? '개인정보 처리방침' : '이용약관'), files: [p] }; })) });
      });
      return out;
    });
  }
  function langPath(path, lang) { return lang && /^market\//.test(path) ? lang + '/' + path : path; }

  /* HTML 분석 */
  var VOID = /^(area|base|br|col|embed|hr|img|input|link|meta|param|source|track|wbr)$/i;
  function blocks(html) {
    var bodyAt = html.search(/<body\b/i); if (bodyAt < 0) bodyAt = 0;
    var hEnd = html.indexOf('</header>', bodyAt); var start = hEnd > -1 ? hEnd + 9 : html.indexOf('>', bodyAt) + 1;
    var fAt = html.search(/<footer\b/i); var end = fAt > start ? fAt : html.search(/<\/body>/i);
    var re = /<(\/?)section\b[^>]*>/gi, depth = 0, out = [], open = -1, mm;
    re.lastIndex = start;
    while ((mm = re.exec(html)) && mm.index < end) {
      if (!mm[1]) { if (depth === 0) open = mm.index; depth++; }
      else { depth--; if (depth === 0 && open > -1) { out.push({ s: open, e: mm.index + mm[0].length }); open = -1; } }
    }
    if (!out.length) { var mainS = html.indexOf('<main', start); out.push(mainS > -1 && mainS < end ? { s: mainS, e: html.indexOf('</main>', mainS) + 7 } : { s: start, e: end }); out[0].whole = true; }
    out.forEach(function (b, i) {   /* 바로 앞 주석은 섹션에 붙여 함께 움직임 */
      var prevEnd = i ? out[i - 1].e : start, gap = html.slice(prevEnd, b.s), c = gap.lastIndexOf('<!--');
      if (c > -1 && !/\S/.test(gap.slice(gap.indexOf('-->', c) + 3))) { b.cs = prevEnd + c; b.comment = gap.slice(c + 4, gap.indexOf('-->', c)).trim(); } else b.cs = b.s;
      var tag = html.slice(b.s, html.indexOf('>', b.s) + 1);
      b.id = (tag.match(/\bid="([^"]+)"/) || [])[1] || ''; b.cls = (tag.match(/\bclass="([^"]+)"/) || [])[1] || '';
      b.hidden = /\sdata-admin-hidden\b/.test(tag);
    });
    return out;
  }
  function stripTags(s) { return s.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim(); }
  function secLabel(html, b, i, isHome) {
    if (b.whole) return '본문';
    if (isHome) { var k = HOME_LABEL[b.id] || HOME_LABEL[b.cls.split(' ')[0]]; if (k) return k; }
    if (b.comment) { var c = b.comment.split(/\s[·—(]\s?|\s\(/)[0].trim(); if (c && c.length < 40) return c; }
    var seg = html.slice(b.s, b.e), h = seg.match(/<h[1-3]\b[^>]*>([\s\S]*?)<\/h[1-3]>/i);
    var t = h ? stripTags(h[1]) : ''; if (t.length > 26) t = t.slice(0, 25) + '…';
    return (i + 1) + '. ' + (t || b.id || b.cls.split(' ')[0] || '섹션');
  }
  /* 섹션 안의 글자 · 링크 · 사진 · 영상 자리 (위치를 기억해 그 자리만 바꿈) */
  function fieldsOf(html, s, e) {
    var texts = [], links = [], media = [], stack = [], i = s, skip = /^<(script|style|noscript|svg|template)\b/i;
    while (i < e) {
      if (html.startsWith('<!--', i)) { var ce = html.indexOf('-->', i); i = ce < 0 ? e : ce + 3; continue; }
      if (html[i] === '<') {
        var sk = skip.exec(html.slice(i, i + 12));
        if (sk) { var close = html.toLowerCase().indexOf('</' + sk[1].toLowerCase(), i); i = close < 0 ? e : html.indexOf('>', close) + 1; continue; }
        var gt = html.indexOf('>', i), tag = html.slice(i, gt + 1), nm = (tag.match(/^<\/?([a-zA-Z0-9-]+)/) || [])[1] || '';
        if (tag[1] === '/') { for (var k = stack.length - 1; k >= 0; k--) if (stack[k].n === nm.toLowerCase()) { stack.length = k; break; } }
        else {
          var cls = (tag.match(/\sclass="([^"]*)"/) || [])[1] || '';
          if (!VOID.test(nm) && !/\/>$/.test(tag)) stack.push({ n: nm.toLowerCase(), c: cls });
          var attr = function (a) { var mm = new RegExp('\\s' + a + '="([^"]*)"').exec(tag); return mm ? { s: i + mm.index + mm[0].length - mm[1].length - 1, e: i + mm.index + mm[0].length - 1, v: mm[1] } : null; };
          var ln = nm.toLowerCase();
          if (ln === 'a') { var hr = attr('href'); if (hr && hr.v && !/^(#|javascript:)/.test(hr.v)) links.push(hr); }
          if (ln === 'img') { var sr = attr('src'); if (sr) media.push({ kind: 'img', src: sr, alt: attr('alt') }); }
          if (ln === 'video') { var vs = attr('src'), po = attr('poster'); if (vs) media.push({ kind: 'video', src: vs }); if (po) media.push({ kind: 'poster', src: po }); }
          if (ln === 'source') { var ss = attr('src'); if (ss && /\.(mp4|webm|mov)/i.test(ss.v)) media.push({ kind: 'video', src: ss }); }
          var st = attr('style'); if (st) { var bm = /url\((['"]?)([^'")]+)\1\)/.exec(st.v); if (bm && !/^data:/.test(bm[2])) { var bs = st.s + bm.index + 4 + bm[1].length; media.push({ kind: 'bg', src: { s: bs, e: bs + bm[2].length, v: bm[2] } }); } }
        }
        i = gt < 0 ? e : gt + 1; continue;
      }
      var lt = html.indexOf('<', i); if (lt < 0 || lt > e) lt = e;
      var t = html.slice(i, lt);
      if (t.trim() && !/^(\s|&nbsp;)*$/.test(t)) { var a = i + t.search(/\S/), b = i + t.replace(/\s+$/, '').length; texts.push({ s: a, e: b, v: html.slice(a, b), label: labelOf(stack) }); }
      i = lt;
    }
    return { texts: texts, links: links, media: media };
  }
  function labelOf(stack) {
    var names = stack.map(function (x) { return x.n; }), has = function (n) { return names.indexOf(n) > -1; };
    var hd = names.filter(function (n) { return /^h[1-6]$/.test(n); })[0];
    if (hd && (has('em') || has('strong') || has('b') || has('mark'))) return '강조 단어(보라)';
    if (hd === 'h1' || hd === 'h2') return '제목';
    if (hd) return '소제목';
    if (has('button') || has('a')) return '버튼 · 링크 글자';
    if (has('summary')) return '질문';
    if (has('li')) return '목록';
    if (has('label')) return '입력칸 이름';
    if (has('p') || has('blockquote')) return '설명';
    var top = stack[stack.length - 1]; if (top && /(num|stat|count|value)/i.test(top.c)) return '숫자';
    return '글자';
  }
  /* 스크립트 · JS 안의 문구(상담 창 · 헤더 메뉴): 따옴표 문자열 중 사람이 읽는 글 */
  function literals(src, s, e, lang) {
    var out = [], re = /(['"])((?:(?!\1)[^\\\n]|\\.)*)\1/g, m; re.lastIndex = s;
    while ((m = re.exec(src)) && m.index < e) {
      var v = m[2]; if (v.length < 2 || /[<>{}=]|^\s|https?:|^\/|\.(js|css|png|svg|jpg|html)$/.test(v)) continue;
      var human = lang ? (/[A-Za-z぀-ヿ一-鿿]/.test(v) && (/\s/.test(v) || /[぀-ヿ一-鿿]/.test(v)) && !/^[a-z]+([A-Z][a-z]*)+$/.test(v) && !/^[\w-]+$/.test(v)) : /[가-힣]/.test(v);
      if (!human) continue;
      if (src[m.index - 1] === '[' || /^\s*[:\]]/.test(src.slice(m.index + m[0].length, m.index + m[0].length + 3))) continue;   /* 객체 키 · 항목 이름은 건드리지 않음 */
      var key = (src.slice(Math.max(s, m.index - 30), m.index).match(/([\w$]+)\s*:\s*$/) || [])[1] || '';
      out.push({ s: m.index + 1, e: m.index + 1 + v.length, v: v, q: m[1], key: key });
    }
    return out;
  }
  function litEsc(v, q) { return v.replace(/\\/g, '\\\\').replace(new RegExp(q, 'g'), '\\' + q).replace(/\n/g, '\\n'); }
  function litUnesc(v) { return v.replace(/\\(.)/g, function (_, c) { return c === 'n' ? '\n' : c; }); }

  function viewPages(m, cfg) {
    cfg = cfg || {};
    var site = cfg.only === 'trend' ? 'market' : S.site;
    m.innerHTML = head(cfg.only === 'trend' ? '트렌드 리포트' : '페이지 편집', '', cfg.only === 'trend' ? 'FR-MKT · 트렌드 리포트 글자 · 사진 직접 수정' : 'FR-COM-018 · 글자 · 사진 · 영상 전부 직접 수정(Q-13 확정)', '<span id="crumb">' + esc(SN[site]) + '</span>') +
      (tok() || mock ? '' : '<div class="notice">게시하려면 페이지 저장 키(GitHub)가 필요해요 — 「사이트 설정」 아래에서 넣을 수 있어요. 키 없이도 보기 · 임시 저장은 됩니다.</div>') +
      '<div class="pe"><div class="card col"><div class="plist" id="plist"><div class="empty">불러오는 중…</div></div></div>' +
      '<div class="card col"><h3>섹션 — 끌어서 순서, 👁 숨김</h3><div class="secs" id="secs"><p class="help">왼쪽에서 페이지를 고르세요</p></div><p class="help" id="secnote"></p></div>' +
      '<div class="card ed" id="ed"><div class="empty">섹션을 고르면 글자 · 사진 · 영상 칸이 나옵니다</div></div></div>' +
      '<p class="foot">FACTORY · PRODUCTION도 같은 화면 — 위에서 사이트를 바꾸면 그 사이트 페이지 목록이 나옵니다. 화면 틀(배치 · 색 · 글꼴)은 개발에서 고정, 안의 글자 · 사진 · 영상 · 버튼 · 링크 · 순서 · 숨김은 모두 여기서.</p>';
    var P = null;   /* 지금 연 페이지 */
    pageGroups(site, cfg.only).then(function (groups) {
      var all = []; groups.forEach(function (g) { g.pages.forEach(function (p) { all.push(p); }); });
      $('#plist').innerHTML = groups.map(function (g) { return '<p class="grp">' + esc(g.g) + '</p>' + g.pages.map(function (p) { return '<button type="button" data-pi="' + all.indexOf(p) + '">' + esc(p.label) + '</button>'; }).join(''); }).join('');
      $$('#plist [data-pi]').forEach(function (b) { b.onclick = function () { if (P && dirty() && !confirm('게시하지 않은 수정이 있어요. 다른 페이지로 갈까요? (임시 저장하면 나중에 이어서 할 수 있어요)')) return; $$('#plist [data-pi]').forEach(function (x) { x.setAttribute('aria-current', x === b); }); openPage(all[+b.dataset.pi]); }; });
      var first = $('#plist [data-pi]'); if (first) first.click();
    });

    function dirty() { if (!P) return false; return Object.keys(P.files).some(function (k) { var f = P.files[k]; return Object.keys(f.edits).length || Object.keys(f.media).length; }) || P.orderChanged || P.hideChanged; }
    function openPage(pg, part, lang) {
      P = { pg: pg, lang: lang || '', files: {}, sec: 0, order: null, hide: {}, orderChanged: false, hideChanged: false, part: part || 0 };
      $('#crumb').textContent = SN[pg.site] + ' › ' + pg.label;
      $('#secs').innerHTML = '<div class="empty">불러오는 중…</div>'; $('#ed').innerHTML = '<div class="empty">불러오는 중…</div>';
      load().then(function () { restoreDraft(); drawSecs(); drawEd(); }).catch(function (er) { $('#secs').innerHTML = '<div class="empty">' + esc(er.message || er) + '</div>'; $('#ed').innerHTML = ''; });
    }
    function isFrag() { return P.pg.files[0][0] === '#'; }
    function curPath() { return langPath(P.pg.files[P.part] || P.pg.files[0], P.lang); }
    function multiLang() { return P.pg.site === 'market' && !isFrag() || (isFrag() && P.pg.files[0] !== '#header'); }
    function load() {
      if (isFrag()) return loadFrag();
      var path = curPath(); if (P.files[path]) return Promise.resolve(P.files[path]);
      return readFile(path).then(function (f) { f.edits = {}; f.media = {}; f.blocks = blocks(f.html); P.files[path] = f; if (!P.order) P.order = f.blocks.map(function (_, i) { return i; }); f.blocks.forEach(function (b, i) { if (P.hide[i] == null) P.hide[i] = b.hidden; }); lastPublished(path).then(function (d) { f.last = d; var l = $('#last'); if (l && curPath() === path) l.textContent = d ? '마지막 게시 ' + fmtY(d) : ''; }); return f; });
    }
    /* 공통 조각: 푸터(market 전 페이지) · 상담 창 문구(market 전 페이지) · 헤더 메뉴(shared/homi-header.js) */
    function loadFrag() {
      var kind = P.pg.files[0], key = kind + ':' + P.lang;
      if (P.files[key]) return Promise.resolve(P.files[key]);
      if (kind === '#header') return readFile('shared/homi-header.js').then(function (f) { f.kind = kind; f.edits = {}; f.media = {}; f.lits = literals(f.html, 0, f.html.length, ''); P.files[key] = f; return f; });
      var src = langPath('market/index.html', P.lang);
      return readFile(src).then(function (f) {
        f.kind = kind; f.edits = {}; f.media = {};
        if (kind === '#chrome') { var fs = f.html.search(/<footer\b/i), fe = f.html.indexOf('</footer>', fs) + 9; f.region = [fs, fe]; f.fields = fieldsOf(f.html, fs, fe); }
        else { var at = f.html.indexOf('kakaoUrl'), ss = f.html.lastIndexOf('<script', at), se = f.html.indexOf('</script>', at); f.region = [ss, se]; f.lits = literals(f.html, ss, se, P.lang); }
        P.files[key] = f; return f;
      });
    }
    function drawSecs() {
      var box = $('#secs');
      if (isFrag()) {
        var k = P.pg.files[0];
        box.innerHTML = '<div class="sec" aria-current="true"><span class="t">' + (k === '#chrome' ? '푸터 (MARKET 전 페이지)' : k === '#chat' ? '실시간 상담 창' : '헤더 메뉴 · 버튼') + '</span></div>';
        $('#secnote').innerHTML = k === '#chrome' ? '띠 배너는 「고객사 로고 · 사례」(Home 설정)에서, 헤더 메뉴 글자는 위 「공통」 › 헤더 메뉴에서 바꿉니다. 푸터는 바꾸면 같은 언어의 MARKET 페이지 전부에 함께 적용돼요.' : k === '#chat' ? '바꾸면 같은 언어의 MARKET 페이지 전부(상담 창이 있는 곳)에 함께 적용돼요.' : 'FACTORY · MARKET · PRODUCTION 위쪽 메뉴가 함께 바뀝니다.';
        return;
      }
      var f = P.files[curPath()];
      var isHome = /(^|\/)market\/index\.html$/.test(f.path);
      box.innerHTML = P.order.map(function (bi, i) {
        var b = f.blocks[bi]; if (!b) return '';
        if (b.whole) return '<div class="sec" data-b="' + bi + '" aria-current="true"><span class="t">본문 (섹션 구분 없는 페이지)</span></div>';
        return '<div class="sec' + (P.hide[bi] ? ' off' : '') + '" draggable="true" data-b="' + bi + '" aria-current="' + (bi === P.sec) + '"><span class="h">⠿</span><span class="t">' + esc(secLabel(f.html, b, i, isHome)) + '</span><button type="button" class="eye" data-eye="' + bi + '" title="' + (P.hide[bi] ? '다시 보이기' : '숨기기') + '" aria-label="' + (P.hide[bi] ? '다시 보이기' : '숨기기') + '">' + (P.hide[bi] ? '🚫' : '👁') + '</button></div>';
      }).join('');
      $('#secnote').innerHTML = (P.pg.files.length > 1 ? '<span class="row" style="margin-bottom:8px">' + P.pg.files.map(function (x, i) { return '<button type="button" class="chip" data-part="' + i + '" aria-pressed="' + (i === P.part) + '">' + (/privacy/.test(x) ? '개인정보 처리방침' : /terms/.test(x) ? '이용약관' : nice(x)) + '</button>'; }).join('') + '</span>' : '') +
        (P.pg.site === 'market' ? '순서 · 숨김은 4개 언어에 함께 적용돼요.' : '');
      $$('#secnote [data-part]').forEach(function (b) { b.onclick = function () { if (dirty() && !confirm('게시하지 않은 수정이 있어요. 바꿀까요?')) return; openPage(P.pg, +b.dataset.part, ''); }; });
      $$('#secs .sec').forEach(function (el) {
        var bi = +el.dataset.b;
        el.onclick = function (e) { if (e.target.dataset.eye != null) return; P.sec = bi; drawSecs(); drawEd(); };
        if (!$('.eye', el)) return;
        $('.eye', el).onclick = function () { if (!canWrite(P.pg.site, cfg.only === 'trend' ? 'trend' : 'pages')) return msg('수정 권한이 없어요', true); P.hide[bi] = !P.hide[bi]; P.hideChanged = true; drawSecs(); bar(); };
        el.ondragstart = function (e) { e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', String(bi)); el.classList.add('drag'); };
        el.ondragend = function () { el.classList.remove('drag'); };
        el.ondragover = function (e) { e.preventDefault(); el.classList.add('over'); };
        el.ondragleave = function () { el.classList.remove('over'); };
        el.ondrop = function (e) { e.preventDefault(); el.classList.remove('over'); var from = +e.dataTransfer.getData('text/plain'); if (from === bi) return; P.order.splice(P.order.indexOf(from), 1); P.order.splice(P.order.indexOf(bi), 0, from); P.orderChanged = true; drawSecs(); bar(); };
      });
    }
    function langTabs() { return multiLang() ? '<div class="langs">' + LANGS.map(function (l) { return '<button type="button" data-lang="' + l[0] + '" aria-pressed="' + (l[0] === P.lang) + '">' + l[1] + '</button>'; }).join('') + '</div>' : ''; }
    function drawEd() {
      var ed = $('#ed'), wr = canWrite(P.pg.site, cfg.only === 'trend' ? 'trend' : 'pages'), dis = wr ? '' : ' disabled';
      var key = isFrag() ? P.pg.files[0] + ':' + P.lang : curPath(), f = P.files[key];
      if (!f) { ed.innerHTML = '<div class="empty">불러오는 중…</div>'; return; }
      var title, body = '';
      if (isFrag() && f.lits) {
        title = P.pg.label;
        body = f.lits.length ? f.lits.map(function (l, i) { var v = f.edits[i] != null ? f.edits[i] : litUnesc(l.v); return '<div class="lit"><code>' + esc({ label: '메뉴 이름', title: '메뉴 제목', desc: '설명', summary: '문의함 요약', _subject: '알림 메일 제목' }[l.key] || l.key || '문구 ' + (i + 1)) + '</code><textarea data-lit="' + i + '" rows="' + Math.min(4, Math.ceil(v.length / 50) || 1) + '" class="' + (f.edits[i] != null ? 'chg' : '') + '"' + dis + '>' + esc(v) + '</textarea></div>'; }).join('') : '<p class="help">바꿀 수 있는 문구를 찾지 못했어요.</p>';
      } else {
        var flds;
        if (isFrag()) { title = '푸터'; flds = f.fields; }
        else {
          var b = f.blocks[P.sec] || f.blocks[0];
          title = secLabel(f.html, b, P.order.indexOf(P.sec), /(^|\/)market\/index\.html$/.test(f.path));
          flds = b.fields || (b.fields = fieldsOf(f.html, b.s, b.e));
        }
        var tx = flds.texts.map(function (t, i) {
          var v = f.edits['t' + t.s] != null ? f.edits['t' + t.s] : decode(t.v), short = v.length <= 22;
          return { short: short, h: '<div class="f' + (short ? ' s2' : '') + '"><label class="lbl">' + esc(t.label) + '</label><textarea data-t="' + t.s + '" rows="' + (short ? 1 : Math.min(5, Math.ceil(v.length / 70))) + '" class="' + (f.edits['t' + t.s] != null ? 'chg' : '') + '"' + dis + '>' + esc(v) + '</textarea></div>' };
        });
        /* 짧은 칸(숫자 · 카드)은 3개씩 한 줄 */
        var html = '', run = [];
        var flush = function () { var n = run.length; run.forEach(function (x) { html += n === 1 ? x.h.replace('class="f s2"', 'class="f"') : n === 2 || n === 4 ? x.h.replace('class="f s2"', 'class="f s3"') : x.h; }); run = []; };
        tx.forEach(function (x) { if (x.short) run.push(x); else { flush(); html += x.h; } }); flush();
        body = flds.texts.length ? '<div class="fields">' + html + '</div>' : '<p class="help">이 섹션에는 직접 쓴 글자가 없어요' + (/logo|shorts|case/.test(title + (f.blocks && f.blocks[P.sec] ? f.blocks[P.sec].cls + f.blocks[P.sec].id : '')) ? ' — 내용은 「고객사 로고 · 사례」(Home 설정)에서 관리합니다.' : '.') + '</p>';
        if (flds.links.length) body += '<label class="lbl">버튼 · 링크 주소</label><div class="fields">' + flds.links.map(function (l) { var v = f.edits['l' + l.s] != null ? f.edits['l' + l.s] : l.v; return '<div class="f s3"><input type="text" data-l="' + l.s + '" value="' + esc(v) + '" class="' + (f.edits['l' + l.s] != null ? 'chg' : '') + '"' + dis + '></div>'; }).join('') + '</div>';
        if (flds.media.length) body += '<label class="lbl">이미지 · 영상 자리 <small>— 자리 ID · [교체] · 권장 규격 · 대체 텍스트</small></label>' + flds.media.map(function (md, i) {
          var ch = f.media[md.src.s], src = ch ? ch.preview : md.src.v, vid = md.kind === 'video';
          var alt = md.alt ? (f.edits['a' + md.alt.s] != null ? f.edits['a' + md.alt.s] : decode(md.alt.v)) : null;
          var id = (isFrag() ? 'footer' : (f.blocks[P.sec].id || f.blocks[P.sec].cls.split(' ')[0] || 'sec' + P.sec)) + '-' + (md.kind === 'img' ? 'img' : md.kind === 'bg' ? 'bg' : 'video') + (i + 1);
          return '<div class="media' + (ch ? ' chg' : '') + '"><span class="th">' + (vid ? '<video src="' + esc(src) + '" muted preload="metadata"></video>' : '<img src="' + esc(src) + '" alt="" data-sz="' + i + '">') + '</span><div><code>#' + esc(id) + '</code> <span class="meta" data-szt="' + i + '">' + (vid ? '영상 · mp4 · 20MB 이하 · 가로 1920 권장' : md.kind === 'poster' ? '영상 첫 화면' : '') + '</span><div class="meta">' + esc(ch ? ch.file.name + ' (게시하면 바뀜)' : md.src.v) + '</div>' +
            '<div class="row" style="margin-top:6px">' + (wr ? '<label class="btn sm">교체<input type="file" hidden data-m="' + md.src.s + '" accept="' + (vid ? 'video/mp4,video/webm' : 'image/*') + '"></label>' : '') + (ch ? '<button class="btn sm" type="button" data-mu="' + md.src.s + '">취소</button>' : '') + '</div>' +
            (alt != null ? '<input type="text" data-a="' + md.alt.s + '" value="' + esc(alt) + '" placeholder="대체 텍스트 (사진 설명 — 화면 읽기 · 검색용)" class="' + (f.edits['a' + md.alt.s] != null ? 'chg' : '') + '"' + dis + '>' : '') + '</div></div>';
        }).join('');
      }
      ed.innerHTML = '<div class="eh"><h2>' + esc(title) + '</h2>' + langTabs() + '</div>' + (P.lang && !isFrag() ? '<p class="help" style="margin:0 0 4px">' + esc(nameOf(LANGS, P.lang)) + ' 파일(' + esc(curPath()) + ')을 고칩니다.</p>' : '') + body +
        '<div class="edbar"><span class="last" id="last">' + (f.last ? '마지막 게시 ' + fmtY(f.last) : '') + '</span><span class="help" id="chg" style="margin:0"></span>' +
        '<button class="btn" type="button" id="erv">되돌리기</button>' + (isFrag() && P.pg.files[0] === '#header' ? '' : '<button class="btn" type="button" id="epv">미리보기</button>') + '<button class="btn" type="button" id="edr">임시 저장</button>' + (wr ? '<button class="btn p" type="button" id="epb">게시</button>' : '') + '</div>';
      /* 입력 연결 */
      $$('[data-lang]', ed).forEach(function (b) { b.onclick = function () { P.lang = b.dataset.lang; ed.innerHTML = '<div class="empty">불러오는 중…</div>'; load().then(function () { if (!isFrag()) { var nf = P.files[curPath()]; if (nf.blocks.length !== P.files[langPath(P.pg.files[P.part], '')].blocks.length) msg('이 언어 파일은 섹션 수가 달라요 — 순서 · 숨김은 한국어 기준으로만 적용됩니다', true); } drawEd(); }).catch(fail('불러오기 실패')); }; });
      $$('[data-lit]', ed).forEach(function (ta) { ta.oninput = function () { var i = +ta.dataset.lit, o = litUnesc(f.lits[i].v); if (ta.value === o) delete f.edits[i]; else f.edits[i] = ta.value; ta.classList.toggle('chg', f.edits[i] != null); bar(); }; });
      var bindTxt = function (attr, pre, orig) { $$('[data-' + attr + ']', ed).forEach(function (el) { el.oninput = function () { var k = pre + el.dataset[attr], o = orig(+el.dataset[attr]); if (el.value === o) delete f.edits[k]; else f.edits[k] = el.value; el.classList.toggle('chg', f.edits[k] != null); bar(); }; }); };
      var findAt = function (list, s, prop) { return list.filter(function (x) { return (prop ? x[prop] && x[prop].s : x.s) === s; })[0]; };
      var curF = function () { return isFrag() ? f.fields : (f.blocks[P.sec] || f.blocks[0]).fields; };
      if (!(isFrag() && f.lits)) {
        bindTxt('t', 't', function (s) { return decode(findAt(curF().texts, s).v); });
        bindTxt('l', 'l', function (s) { return findAt(curF().links, s).v; });
        bindTxt('a', 'a', function (s) { return decode(findAt(curF().media, s, 'alt').alt.v); });
        $$('[data-m]', ed).forEach(function (inp) { inp.onchange = function () { var fl = inp.files[0]; if (!fl) return; var lim = /^video/.test(fl.type) ? 20 : 5; if (fl.size > lim * 1048576) return msg(lim + 'MB 이하 파일만 올릴 수 있어요', true); f.media[inp.dataset.m] = { file: fl, preview: URL.createObjectURL(fl) }; drawEd(); }; });
        $$('[data-mu]', ed).forEach(function (b) { b.onclick = function () { delete f.media[b.dataset.mu]; drawEd(); }; });
        $$('img[data-sz]', ed).forEach(function (im) { var show = function () { if (!im.naturalWidth) return; var t = $('[data-szt="' + im.dataset.sz + '"]', ed); if (t && !t.textContent) t.textContent = '권장 ' + im.naturalWidth + '×' + im.naturalHeight + ' 이상 · 같은 비율 · 5MB 이하'; }; if (im.complete) show(); else im.onload = show; });
      }
      $('#erv').onclick = function () { if (!dirty()) return msg('바꾼 곳이 없어요'); if (!confirm('게시하지 않은 수정을 모두 되돌릴까요?')) return; Object.keys(P.files).forEach(function (k) { P.files[k].edits = {}; P.files[k].media = {}; }); var bf = P.files[langPath(P.pg.files[P.part] || '', '')]; if (bf && bf.blocks) { P.order = bf.blocks.map(function (_, i) { return i; }); bf.blocks.forEach(function (b, i) { P.hide[i] = b.hidden; }); } P.orderChanged = P.hideChanged = false; clearDraft(); drawSecs(); drawEd(); };
      var pv = $('#epv'); if (pv) pv.onclick = preview;
      $('#edr').onclick = saveDraft;
      var pb = $('#epb'); if (pb) pb.onclick = publish;
      bar();
    }
    function decode(s) { var t = document.createElement('textarea'); t.innerHTML = s; return t.value; }
    function encode(s) { return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
    function count() { var n = 0; Object.keys(P.files).forEach(function (k) { n += Object.keys(P.files[k].edits).length + Object.keys(P.files[k].media).length; }); return n + (P.orderChanged ? 1 : 0) + (P.hideChanged ? 1 : 0); }
    function bar() { var c = $('#chg'); if (c) c.textContent = count() ? '바꾼 곳 ' + count() + '개' : ''; }

    /* 한 파일에 수정 적용 → 새 HTML (newSrc: 올린 사진 주소) */
    function build(f, newSrc, withLayout) {
      var html = f.html, reps = [];
      var fields = function () { if (f.fields) return [f.fields]; return (f.blocks || []).map(function (b) { return b.fields || (b.fields = fieldsOf(html, b.s, b.e)); }); };
      Object.keys(f.edits).forEach(function (k) {
        if (f.lits) { var l = f.lits[+k]; reps.push({ s: l.s, e: l.e, v: litEsc(f.edits[k], l.q) }); return; }
        var s = +k.slice(1), ty = k[0];
        reps.push({ s: s, e: findEnd(fields(), ty, s), v: ty === 't' ? encode(f.edits[k]).replace(/\n/g, '<br>') : f.edits[k].replace(/"/g, '&quot;') });
      });
      Object.keys(f.media).forEach(function (s) { var src = newSrc[f.path + ':' + s] || f.media[s].preview; reps.push({ s: +s, e: findEnd(fields(), 'm', +s), v: src }); });
      reps.sort(function (a, b) { return b.s - a.s; });
      if (!withLayout || !f.blocks || f.blocks[0].whole) { reps.forEach(function (x) { html = html.slice(0, x.s) + x.v + html.slice(x.e); }); return html; }
      /* 섹션 단위로 잘라 수정 · 숨김 · 순서 적용 후 다시 붙임 */
      var bl = f.blocks, pieces = bl.map(function (b) { return { s: b.cs, e: b.e, sec: b.s }; });
      var bodies = pieces.map(function (pc, i) {
        var t = html.slice(pc.s, pc.e);
        reps.filter(function (x) { return x.s >= pc.s && x.e <= pc.e; }).forEach(function (x) { t = t.slice(0, x.s - pc.s) + x.v + t.slice(x.e - pc.s); });
        var off = pc.sec - pc.s, tagEnd = t.indexOf('>', off), tag = t.slice(off, tagEnd);
        var want = !!P.hide[i];
        if (want && !/\sdata-admin-hidden\b/.test(tag)) tag = tag.replace(/^<section/i, '<section data-admin-hidden');
        if (!want) tag = tag.replace(/\sdata-admin-hidden(="[^"]*")?/, '');
        return t.slice(0, off) + tag + t.slice(tagEnd);
      });
      var order = P.order.length === bl.length ? P.order : bl.map(function (_, i) { return i; });
      /* 섹션 뒤의 스크립트 등(다음 섹션 전까지)은 그 섹션과 함께 움직임 */
      var last = pieces.length - 1, out = html.slice(0, pieces[0].s);
      order.forEach(function (bi, k) { out += bodies[bi] + (bi < last ? html.slice(pieces[bi].e, pieces[bi + 1].s) : (k < last ? '\n' : '')); });
      out += html.slice(pieces[last].e);
      /* 바깥(섹션 밖) 수정 반영은 없음 — 섹션 안만 고침 */
      if (/data-admin-hidden/.test(out) && out.indexOf('id="admin-hidden-css"') < 0) out = out.replace(/<\/head>/i, '<style id="admin-hidden-css">[data-admin-hidden]{display:none!important}</style>\n</head>');
      return out;
    }
    function findEnd(list, ty, s) {
      for (var i = 0; i < list.length; i++) {
        var F = list[i], hit;
        if (ty === 't') hit = F.texts.filter(function (x) { return x.s === s; })[0];
        else if (ty === 'l') hit = F.links.filter(function (x) { return x.s === s; })[0];
        else if (ty === 'a') hit = (F.media.filter(function (x) { return x.alt && x.alt.s === s; })[0] || {}).alt;
        else hit = (F.media.filter(function (x) { return x.src.s === s; })[0] || {}).src;
        if (hit) return hit.e;
      }
      throw new Error('수정 위치를 찾지 못했어요');
    }
    function layoutFiles() {   /* 순서 · 숨김을 함께 적용할 파일들 (MARKET은 4개 언어) */
      var base = P.pg.files[P.part];
      return P.pg.site === 'market' ? LANGS.map(function (l) { return langPath(base, l[0]); }) : [base];
    }
    function preview() {
      var f = isFrag() ? P.files[P.pg.files[0] + ':' + P.lang] : P.files[curPath()];
      var html = build(f, {}, !isFrag());
      html = html.replace(/<head([^>]*)>/i, '<head$1><base href="' + location.origin + '/' + (isFrag() ? langPath('market/index.html', P.lang) : curPath()).replace(/[^/]*$/, '') + '">');
      var u = URL.createObjectURL(new Blob([html], { type: 'text/html' }));
      var win = window.open(u, '_blank'); if (!win) msg('팝업이 막혔어요 — 이 사이트의 팝업을 허용해 주세요', true);
    }
    function draftKey() { return 'hm_draft:' + P.pg.files.join('+') + ':' + P.part; }
    function saveDraft() {
      var d = { at: new Date().toISOString(), lang: P.lang, order: P.order, hide: P.hide, orderChanged: P.orderChanged, hideChanged: P.hideChanged, files: {} }, skipped = 0;
      Object.keys(P.files).forEach(function (k) { var f = P.files[k]; if (Object.keys(f.edits).length) d.files[k] = { sha: f.sha, edits: f.edits }; skipped += Object.keys(f.media).length; });
      try { localStorage.setItem(draftKey(), JSON.stringify(d)); msg('임시 저장했어요 (이 브라우저)' + (skipped ? ' — 새로 고른 사진 · 영상은 게시 전까지만 유지돼요' : '')); } catch (e) { msg('임시 저장 실패', true); }
    }
    function clearDraft() { try { localStorage.removeItem(draftKey()); } catch (e) {} }
    function restoreDraft() {
      var d; try { d = JSON.parse(localStorage.getItem(draftKey()) || 'null'); } catch (e) {} if (!d) return;
      var keys = Object.keys(d.files);
      var go = function () {
        Promise.all(keys.map(function (k) { if (P.files[k]) return P.files[k]; if (k[0] === '#') return null; return readFile(k).then(function (f) { f.edits = {}; f.media = {}; f.blocks = blocks(f.html); P.files[k] = f; return f; }); })).then(function () {
          var stale = 0;
          keys.forEach(function (k) { var f = P.files[k]; if (!f) return; if (f.sha !== d.files[k].sha) { stale++; return; } f.edits = d.files[k].edits; });
          if (d.orderChanged && d.order && d.order.length === P.order.length) { P.order = d.order; P.orderChanged = true; }
          if (d.hideChanged) { P.hide = d.hide; P.hideChanged = true; }
          drawSecs(); drawEd(); msg(stale ? '임시 저장 뒤 원본이 바뀐 파일 ' + stale + '개는 불러오지 않았어요' : '임시 저장본을 불러왔어요', !!stale);
        }).catch(fail('불러오기 실패'));
      };
      var ed = $('#ed');
      setTimeout(function () { ed.insertAdjacentHTML('afterbegin', '<div class="notice" id="drn">임시 저장본(' + fmtY(d.at) + ' ' + fmt(d.at).slice(6) + ')이 있어요. <button class="btn sm" type="button" id="drl">불러오기</button> <button class="btn sm" type="button" id="drx">지우기</button></div>'); $('#drl').onclick = function () { $('#drn').remove(); go(); }; $('#drx').onclick = function () { clearDraft(); $('#drn').remove(); }; }, 0);
    }
    function publish() {
      if (!tok() && !mock) return msg('저장 키가 없어요 — 「사이트 설정」에서 넣어 주세요', true);
      if (!count()) return msg('바꾼 곳이 없어요');
      var btn = $('#epb'); btn.disabled = true; msg('게시하는 중…');
      var label = P.pg.label, by = who(), newSrc = {}, chain = Promise.resolve(), jobs = [];
      /* 1) 사진 · 영상 올리기 (한 장씩) */
      Object.keys(P.files).forEach(function (k) { var f = P.files[k]; Object.keys(f.media).forEach(function (s) { chain = chain.then(function () { return uploadAsset(P.pg.site === 'common' ? 'common' : P.pg.site, f.media[s].file).then(function (u) { newSrc[f.path + ':' + s] = u; }); }); }); });
      chain = chain.then(function () {
        if (isFrag()) {
          /* 공통 조각: 바뀐 원문 → 새 문구를 같은 언어 파일 전부에 */
          var kind = P.pg.files[0];
          Object.keys(P.files).forEach(function (k) {
            var f = P.files[k]; if (!Object.keys(f.edits).length && !Object.keys(f.media).length) return;
            if (kind === '#header') { jobs.push({ path: f.path, sha: f.sha, html: build(f, newSrc, false) }); return; }
            var pairs = [];
            if (f.lits) Object.keys(f.edits).forEach(function (i) { var l = f.lits[+i]; pairs.push([l.q + l.v + l.q, l.q + litEsc(f.edits[i], l.q) + l.q]); });
            else {
              var oldF = f.html.slice(f.region[0], f.region[1]), nh = build(f, newSrc, false), newF = nh.slice(f.region[0], nh.search(/<\/footer>/i) + 9);
              pairs.push([oldF, newF]);
            }
            jobs.push({ fragOf: k.split(':')[1] || '', pairs: pairs });
          });
        } else {
          var lay = (P.orderChanged || P.hideChanged) ? layoutFiles() : [];
          var paths = Object.keys(P.files).filter(function (k) { var f = P.files[k]; return Object.keys(f.edits).length || Object.keys(f.media).length; });
          lay.forEach(function (p) { if (paths.indexOf(p) < 0) paths.push(p); });
          return Promise.all(paths.map(function (p) { return P.files[p] || readFile(p).then(function (f) { f.edits = {}; f.media = {}; f.blocks = blocks(f.html); P.files[p] = f; return f; }); })).then(function () {
            paths.forEach(function (p) { var f = P.files[p], same = f.blocks.length === P.order.length; jobs.push({ path: p, sha: f.sha, html: build(f, newSrc, same && (lay.indexOf(p) > -1 || P.orderChanged || P.hideChanged)) }); });
          });
        }
      });
      /* 2) 공통 조각은 같은 언어의 MARKET 페이지 전부 찾아 바꿈 */
      chain = chain.then(function () {
        var fr = jobs.filter(function (j) { return j.pairs; }); if (!fr.length) return;
        jobs = jobs.filter(function (j) { return !j.pairs; });
        return Promise.all(fr.map(function (j) {
          var files = MK_PAGES.concat(TREND_PAGES).reduce(function (a, x) { x.slice(1).forEach(function (n) { if (n[0] !== '#') a.push(langPath('market/' + n + '.html', j.fragOf)); }); return a; }, []).concat([langPath('market/case-detail.html', j.fragOf)]);
          files = files.filter(function (x, i) { return files.indexOf(x) === i; });
          return Promise.all(files.map(function (p) { return readFile(p).catch(function () { return null; }); })).then(function (fs) {
            fs.forEach(function (f) { if (!f) return; var h = f.html, n = 0; j.pairs.forEach(function (pr) { if (h.indexOf(pr[0]) > -1) { h = h.split(pr[0]).join(pr[1]); n++; } }); if (n) jobs.push({ path: f.path, sha: f.sha, html: h }); });
          });
        }));
      });
      /* 3) 파일 게시 (한 개씩) */
      chain = chain.then(function () {
        if (!jobs.length) throw new Error('바꿀 파일을 찾지 못했어요');
        var c2 = Promise.resolve();
        jobs.forEach(function (j, i) { c2 = c2.then(function () { btn.textContent = '게시 ' + (i + 1) + '/' + jobs.length; return writeFile(j.path, j.html, j.sha, 'admin: ' + j.path + ' — ' + label + ' 수정 (' + by + ')'); }); });
        return c2;
      }).then(function () {
        api.audit('publish', P.pg.site, label, { files: jobs.map(function (j) { return j.path; }), changes: count() });
        clearDraft(); msg('게시했어요 — 1~2분 뒤 사이트에 반영됩니다 (' + jobs.length + '개 파일)');
        treeCache = null; openPage(P.pg, P.part, P.lang);
      }).catch(fail('게시 실패')).then(function () { var b = $('#epb'); if (b) { b.disabled = false; b.textContent = '게시'; } });
    }
  }

  api.onAuth(function () { if (!S.me) boot(); });
  boot();
})();
