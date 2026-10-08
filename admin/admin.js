/* HOMI 통합 관리자 (FR-COM-017~023)
   - 위에서 사이트를 고름: 공통 / FACTORY / MARKET / PRODUCTION (계정의 사이트 권한에 있는 것만 보임)
   - 데이터: Supabase(작품 관리와 같은 프로젝트) — com_members · com_inquiries · com_creators · com_settings (설정 SQL: COM_통합관리자-DB설정)
   - 페이지 편집: GitHub 저장소 파일을 그대로 고쳐 저장(저장 키 = GitHub 토큰, Contents 읽기·쓰기) → Vercel 자동 배포
   - 로컬 점검: localhost + ?mock=1 이면 메모리 데이터로 화면만 확인 */
(function () {
  'use strict';
  var SB_URL = 'https://bcngbtwzuqtwtxaebftf.supabase.co';
  var SB_KEY = 'sb_publishable_4f1Mbi136Y8iuHSk-xub8A_43uK3Wiy';
  var REPO = 'homifactory/homifactory-site', BR = 'main';
  var SITES = [['common', '공통'], ['factory', 'HOMI FACTORY'], ['market', 'HOMI MARKET'], ['production', 'HOMI PRODUCTION']];
  var SITE_NAME = { factory: 'FACTORY', market: 'MARKET', production: 'PRODUCTION' };
  var NAV = {
    common: [['inbox', '문의함 (세 사이트)'], ['creators', '크리에이터 DB'], ['members', '계정·권한', 'owner'], ['privacy', '개인정보 관리', 'owner'], ['settings', '사이트 설정', 'owner']],
    factory: [['inbox', '문의함'], ['pages', '페이지 편집']],
    market: [['inbox', '문의함'], ['home', 'Home 설정'], ['creators', '크리에이터 DB'], ['pages', '페이지 편집']],
    production: [['inbox', '문의함'], ['works', '작품 관리'], ['pages', '페이지 편집']]
  };
  var KIND = { inquiry: '상담·문의', chat: '실시간 상담', production: '제작 문의', rental: '대관 문의' };
  var ST_INQ = [['new', '새 문의'], ['in_progress', '진행 중'], ['done', '완료'], ['spam', '스팸']];
  var ST_CR = [['new', '새 지원'], ['reviewed', '검토함'], ['contacted', '연락함'], ['partner', '함께함'], ['hold', '보류']];
  var ROLE = { owner: '전체 관리(계정 포함)', editor: '읽기·수정', viewer: '읽기만' };

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return [].slice.call((r || document).querySelectorAll(s)); };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var app = $('#app');
  var S = { me: null, site: 'common', view: 'inbox', setupNeeded: false };
  try { var saved = JSON.parse(localStorage.getItem('hm_admin_pos') || '{}'); if (saved.site) { S.site = saved.site; S.view = saved.view; } } catch (e) {}

  function msg(t, err) { var m = $('#msg'); m.textContent = t; m.className = 'msg' + (err ? ' err' : ''); m.hidden = false; clearTimeout(msg.t); msg.t = setTimeout(function () { m.hidden = true; }, err ? 6000 : 2600); }
  function fmt(d) { if (!d) return ''; var x = new Date(d); return x.getFullYear() + '.' + ('0' + (x.getMonth() + 1)).slice(-2) + '.' + ('0' + x.getDate()).slice(-2) + ' ' + ('0' + x.getHours()).slice(-2) + ':' + ('0' + x.getMinutes()).slice(-2); }
  function tagOf(list, v) { var t = list.filter(function (x) { return x[0] === v; })[0]; return '<span class="tag ' + esc(v) + '">' + esc(t ? t[1] : v) + '</span>'; }
  function csv(rows, cols, name) {
    var q = function (v) { v = v == null ? '' : (Array.isArray(v) ? v.join(', ') : (typeof v === 'object' ? JSON.stringify(v) : String(v))); return '"' + v.replace(/"/g, '""') + '"'; };
    var body = '﻿' + cols.map(function (c) { return q(c[1]); }).join(',') + '\n' + rows.map(function (r) { return cols.map(function (c) { return q(r[c[0]]); }).join(','); }).join('\n');
    var a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([body], { type: 'text/csv' })); a.download = name; a.click();
  }

  /* ── 데이터 연결 ── */
  var mock = /^(127\.0\.0\.1|localhost)$/.test(location.hostname) && /[?&]mock=1/.test(location.search);
  var api = mock ? mockApi() : sbApi();

  function sbApi() {
    var sb = window.supabase.createClient(SB_URL, SB_KEY, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } });
    function ok(r) { if (r.error) throw r.error; return r.data; }
    return {
      session: function () { return sb.auth.getSession().then(function (r) { return r.data.session; }); },
      onAuth: function (fn) { sb.auth.onAuthStateChange(function () { fn(); }); },
      signInPw: function (e, p) { return sb.auth.signInWithPassword({ email: e, password: p }).then(ok); },
      signInLink: function (e) { return sb.auth.signInWithOtp({ email: e, options: { shouldCreateUser: false, emailRedirectTo: location.origin + '/admin/' } }).then(ok); },
      signOut: function () { return sb.auth.signOut(); },
      me: function () { return sb.rpc('com_me').then(ok).then(function (d) { return Array.isArray(d) ? d[0] : d; }); },
      inquiries: function (site) { var q = sb.from('com_inquiries').select('*').order('created_at', { ascending: false }).limit(500); if (site !== 'common') q = q.eq('site', site); return q.then(ok); },
      updInquiry: function (id, p) { return sb.from('com_inquiries').update(p).eq('id', id).then(ok); },
      delInquiry: function (id) { return sb.from('com_inquiries').delete().eq('id', id).then(ok); },
      creators: function () { return sb.from('com_creators').select('*').order('created_at', { ascending: false }).limit(1000).then(ok); },
      updCreator: function (id, p) { return sb.from('com_creators').update(p).eq('id', id).then(ok); },
      delCreator: function (id) { return sb.from('com_creators').delete().eq('id', id).then(ok); },
      members: function () { return sb.from('com_members').select('*').order('created_at').then(ok); },
      saveMember: function (m) { return sb.from('com_members').upsert(m).then(ok); },
      delMember: function (e) { return sb.from('com_members').delete().eq('email', e).then(ok); },
      invite: function (e) { return sb.auth.signInWithOtp({ email: e, options: { shouldCreateUser: true, emailRedirectTo: location.origin + '/admin/' } }).then(ok); },
      expired: function () {
        var today = new Date().toISOString().slice(0, 10);
        return Promise.all([
          sb.from('com_inquiries').select('id', { count: 'exact', head: true }).lt('retain_until', today).in('status', ['done', 'spam']),
          sb.from('com_creators').select('id', { count: 'exact', head: true }).lt('retain_until', today).neq('status', 'partner')
        ]).then(function (rs) { rs.forEach(ok); return { inquiries: rs[0].count || 0, creators: rs[1].count || 0 }; });
      },
      purge: function () { return sb.rpc('com_purge_expired').then(ok); },
      findPerson: function (q) {
        var f = 'email.ilike.%' + q + '%,phone.ilike.%' + q + '%,name.ilike.%' + q + '%';
        return Promise.all([sb.from('com_inquiries').select('*').or(f).limit(100), sb.from('com_creators').select('*').or(f).limit(100)])
          .then(function (rs) { return { inquiries: ok(rs[0]), creators: ok(rs[1]) }; });
      },
      settings: function () { return sb.from('com_settings').select('*').then(ok); },
      saveSetting: function (k, v) { return sb.from('com_settings').upsert({ key: k, value: v }).then(ok); }
    };
  }
  function mockApi() {
    var now = Date.now(), d = function (h) { return new Date(now - h * 3600e3).toISOString(); };
    var inq = [
      { id: 'i1', site: 'market', kind: 'inquiry', name: '김브랜드', phone: '010-1111-2222', email: 'brand@ex.com', company: '', summary: '저자극 선크림 신제품', data: { '방향': '한국→세계', '진출 국가·시장': '일본, 인도네시아', '지금 가장 큰 고민': '어디서부터 시작할지', '이루고 싶은 목표': '6개월 안에 현지 판매' }, lang: 'KR', page: '/market/contact', status: 'new', retain_until: '2027-10-08', created_at: d(2) },
      { id: 'i2', site: 'factory', kind: 'inquiry', name: '이매니저', phone: '010-3333-4444', email: 'ent@ex.com', company: 'OO엔터', summary: '컴백 프로모션', data: { '문의 유형': 'Marketing', '프로젝트 내용': '11월 컴백 SNS 바이럴' }, lang: 'KR', page: '/contact', status: 'in_progress', assignee: '배수빈', retain_until: '2027-10-07', created_at: d(30) },
      { id: 'i3', site: 'production', kind: 'rental', name: '박감독', phone: '010-5555-6666', email: 'pd@ex.com', company: '', summary: '호리존 대관', data: { '희망 일정': '10/20 오후', '문의 내용': '4시간 촬영' }, lang: 'KR', page: '/production/contact', status: 'done', retain_until: '2025-01-01', created_at: d(400) }
    ];
    var cr = [{ id: 'c1', handle: '데일리뷰티', channel_url: 'https://instagram.com/dailybeauty', platforms: ['인스타그램', '틱톡'], followers: '1만~10만', country: '한국', categories: ['뷰티'], intro: '직장인 뷰티 루틴', name: '최크리', phone: '010-7777-8888', email: 'cr@ex.com', status: 'new', retain_until: '2027-10-08', created_at: d(5) }];
    var mem = [{ email: 'hosung@homifactory.com', name: '윤호성', role: 'owner', sites: ['factory', 'market', 'production'] }, { email: 'support@homifactory.com', name: '고객지원', role: 'editor', sites: ['market'] }];
    var set = [{ key: 'contact', value: { email: 'support@homifactory.com', phone: '010-4026-2695', hours: '평일 10:00~22:00', kakao: '' } }, { key: 'notify', value: { to: 'support@homifactory.com', cc: 'soobin1027@homifactory.com,hosung@homifactory.com' } }];
    var P = function (v) { return Promise.resolve(JSON.parse(JSON.stringify(v))); };
    var upd = function (arr, id, p, k) { arr.forEach(function (r) { if (r[k || 'id'] === id) Object.assign(r, p); }); return P(null); };
    return {
      session: function () { return P({ user: { email: 'hosung@homifactory.com' } }); }, onAuth: function () {},
      signInPw: function () { return P(null); }, signInLink: function () { return P(null); }, signOut: function () { return P(null); },
      me: function () { return P(mem[0]); },
      inquiries: function (s) { return P(inq.filter(function (r) { return s === 'common' || r.site === s; })); },
      updInquiry: function (id, p) { return upd(inq, id, p); }, delInquiry: function (id) { inq = inq.filter(function (r) { return r.id !== id; }); return P(null); },
      creators: function () { return P(cr); }, updCreator: function (id, p) { return upd(cr, id, p); }, delCreator: function (id) { cr = cr.filter(function (r) { return r.id !== id; }); return P(null); },
      members: function () { return P(mem); }, saveMember: function (m) { var f = mem.filter(function (x) { return x.email === m.email; })[0]; if (f) Object.assign(f, m); else mem.push(m); return P(null); },
      delMember: function (e) { mem = mem.filter(function (x) { return x.email !== e; }); return P(null); }, invite: function () { return P(null); },
      expired: function () { return P({ inquiries: 1, creators: 0 }); }, purge: function () { return P({ inquiries: 1, creators: 0 }); },
      findPerson: function (q) { var m = function (r) { return [r.email, r.phone, r.name].join(' ').indexOf(q) > -1; }; return P({ inquiries: inq.filter(m), creators: cr.filter(m) }); },
      settings: function () { return P(set); }, saveSetting: function (k, v) { var f = set.filter(function (x) { return x.key === k; })[0]; if (f) f.value = v; else set.push({ key: k, value: v }); return P(null); }
    };
  }

  /* ── 로그인 ── */
  function loginView(note) {
    app.innerHTML = '<div class="login"><h1>통합 관리자</h1><p>HOMI FACTORY · MARKET · PRODUCTION을 한 곳에서 관리합니다. 등록된 담당자 이메일로만 들어올 수 있어요.</p>' +
      (note ? '<div class="notice">' + note + '</div>' : '') +
      '<form id="lf"><input type="email" id="le" placeholder="이메일" autocomplete="email" required><input type="password" id="lp" placeholder="비밀번호 (없으면 비워 두고 [이메일 링크])" autocomplete="current-password">' +
      '<div class="row"><button class="btn p" type="submit">로그인</button><button class="btn" type="button" id="ll">이메일 링크 받기</button></div></form></div>';
    $('#lf').onsubmit = function (e) { e.preventDefault(); var em = $('#le').value.trim(), pw = $('#lp').value; if (!pw) return link(); api.signInPw(em, pw).then(boot).catch(function (er) { msg('로그인 실패: ' + (er.message || er), true); }); };
    function link() { var em = $('#le').value.trim(); if (!em) return msg('이메일을 넣어 주세요', true); api.signInLink(em).then(function () { msg('메일함에서 로그인 링크를 눌러 주세요'); }).catch(function (er) { msg('보내지 못했어요: ' + (er.message || er), true); }); }
    $('#ll').onclick = link;
  }

  function boot() {
    api.session().then(function (ses) {
      if (!ses) return loginView();
      return api.me().then(function (me) {
        if (!me || !me.email) return loginView('이 이메일(' + esc(ses.user.email) + ')은 관리자 계정 목록에 없어요. 전체 관리 권한이 있는 분께 「계정·권한」에서 추가해 달라고 요청해 주세요. <button class="btn" id="lo2" type="button">로그아웃</button>');
        S.me = me; shell();
      }).catch(function (er) {
        S.setupNeeded = true; S.me = { email: ses.user.email, role: 'owner', sites: ['factory', 'market', 'production'], name: '' };
        console.warn(er); shell('데이터베이스 설정이 아직 안 됐어요(Supabase에 com_ 표 없음). 「페이지 편집」·「Home 설정」·「작품 관리」는 지금도 쓸 수 있고, 문의함·크리에이터 DB·계정은 설정 SQL을 한 번 실행하면 열립니다.');
      });
    }).then(function () { var b = $('#lo2'); if (b) b.onclick = function () { api.signOut().then(boot); }; });
  }

  /* ── 틀 ── */
  function allowedSites() { var me = S.me; return SITES.filter(function (s) { return s[0] === 'common' || me.role === 'owner' || (me.sites || []).indexOf(s[0]) > -1; }); }
  function navFor(site) { return NAV[site].filter(function (n) { return !n[2] || S.me.role === 'owner'; }); }
  function shell(note) {
    S.note = note || '';
    var sites = allowedSites(); if (!sites.some(function (s) { return s[0] === S.site; })) S.site = 'common';
    if (!navFor(S.site).some(function (n) { return n[0] === S.view; })) S.view = navFor(S.site)[0][0];
    app.innerHTML = '<header class="top"><b>HOMI <span>ADMIN</span></b><nav class="sites" aria-label="사이트 고르기">' +
      sites.map(function (s) { return '<button type="button" data-site="' + s[0] + '" aria-pressed="' + (s[0] === S.site) + '">' + s[1] + '</button>'; }).join('') +
      '</nav><div class="who"><span>' + esc(S.me.name || S.me.email) + ' · ' + esc(ROLE[S.me.role] || S.me.role) + '</span><button type="button" id="lo">로그아웃</button></div></header>' +
      '<div class="wrap"><nav class="nav" aria-label="메뉴">' + navFor(S.site).map(function (n) { return '<button type="button" data-view="' + n[0] + '" aria-current="' + (n[0] === S.view) + '">' + n[1] + '</button>'; }).join('') +
      '<p class="hint">' + (S.site === 'common' ? '세 사이트에 함께 쓰이는 것들' : SITE_NAME[S.site] + '만 보입니다') + '</p></nav><main id="main"></main></div>';
    $$('.sites button').forEach(function (b) { b.onclick = function () { S.site = b.dataset.site; S.view = navFor(S.site)[0][0]; pos(); shell(S.note); }; });
    $$('.nav button').forEach(function (b) { b.onclick = function () { S.view = b.dataset.view; pos(); shell(S.note); }; });
    $('#lo').onclick = function () { api.signOut().then(function () { location.reload(); }); };
    render();
  }
  function pos() { try { localStorage.setItem('hm_admin_pos', JSON.stringify({ site: S.site, view: S.view })); } catch (e) {} }
  function render() {
    var m = $('#main'); var head = S.note ? '<div class="notice">' + S.note + '</div>' : '';
    var V = { inbox: viewInbox, creators: viewCreators, members: viewMembers, privacy: viewPrivacy, settings: viewSettings, pages: viewPages, home: viewHome, works: viewWorks }[S.view];
    var dbViews = ['inbox', 'creators', 'members', 'privacy', 'settings'];
    if (S.setupNeeded && dbViews.indexOf(S.view) > -1) { m.innerHTML = head + '<h1>' + titleOf() + '</h1><div class="card empty">데이터베이스 설정 후 열립니다.</div>'; return; }
    m.innerHTML = head; V(m);
  }
  function titleOf() { var n = navFor(S.site).filter(function (x) { return x[0] === S.view; })[0]; return n ? n[1] : ''; }
  function canWrite(site) { var me = S.me; if (me.role === 'owner') return true; if (me.role !== 'editor') return false; return site === 'common' || (me.sites || []).indexOf(site) > -1; }

  /* ── 문의함 (FR-COM-019) ── */
  function viewInbox(m) {
    m.insertAdjacentHTML('beforeend', '<h1>문의함</h1><p class="sub">' + (S.site === 'common' ? '세 사이트의 상담 신청서·문의·실시간 상담이 한 곳에 모입니다.' : SITE_NAME[S.site] + ' 사이트로 들어온 문의입니다.') + ' 메일 알림(support@homifactory.com)은 그대로 갑니다.</p>' +
      '<div class="card"><div class="row" style="margin-bottom:12px"><select id="fs"><option value="">모든 상태</option>' + ST_INQ.map(function (s) { return '<option value="' + s[0] + '">' + s[1] + '</option>'; }).join('') + '</select>' +
      '<input type="search" id="fq" placeholder="이름·이메일·내용 찾기" style="flex:1;min-width:180px"><button class="btn" id="fx">엑셀(CSV)로 받기</button></div><div id="list"><div class="empty">불러오는 중…</div></div></div>');
    api.inquiries(S.site).then(function (rows) {
      var draw = function () {
        var st = $('#fs').value, q = $('#fq').value.trim().toLowerCase();
        var rs = rows.filter(function (r) { return (!st || r.status === st) && (!q || JSON.stringify(r).toLowerCase().indexOf(q) > -1); });
        $('#list').innerHTML = rs.length ? '<table><thead><tr><th>받은 날</th>' + (S.site === 'common' ? '<th>사이트</th>' : '') + '<th>종류</th><th>이름</th><th>내용</th><th>상태</th></tr></thead><tbody>' +
          rs.map(function (r) { return '<tr class="click" data-id="' + r.id + '"><td>' + fmt(r.created_at) + '</td>' + (S.site === 'common' ? '<td>' + SITE_NAME[r.site] + '</td>' : '') + '<td>' + esc(KIND[r.kind] || r.kind) + '</td><td>' + esc(r.name) + (r.company ? '<br><small>' + esc(r.company) + '</small>' : '') + '</td><td>' + esc(r.summary || '') + '</td><td>' + tagOf(ST_INQ, r.status) + '</td></tr>'; }).join('') + '</tbody></table>'
          : '<div class="empty">문의가 없어요.</div>';
        $$('#list tr.click').forEach(function (tr) { tr.onclick = function () { openInq(rows.filter(function (r) { return r.id === tr.dataset.id; })[0], function () { viewReload(); }); }; });
      };
      $('#fs').onchange = draw; $('#fq').oninput = draw; draw();
      $('#fx').onclick = function () { csv(rows, [['created_at', '받은 날'], ['site', '사이트'], ['kind', '종류'], ['name', '이름'], ['phone', '연락처'], ['email', '이메일'], ['company', '회사'], ['summary', '요약'], ['data', '내용'], ['status', '상태'], ['assignee', '담당'], ['memo', '메모']], 'HOMI_문의함_' + new Date().toISOString().slice(0, 10) + '.csv'); };
    }).catch(function (er) { $('#list').innerHTML = '<div class="empty">불러오지 못했어요: ' + esc(er.message || er) + '</div>'; });
  }
  function viewReload() { shell(S.note); }
  function openInq(r, done) {
    var w = canWrite(r.site), d = r.data || {};
    var dr = drawer('<h2>' + esc(r.summary || KIND[r.kind] || '문의') + '</h2><dl class="kv"><dt>받은 날</dt><dd>' + fmt(r.created_at) + '</dd><dt>사이트·종류</dt><dd>' + SITE_NAME[r.site] + ' · ' + esc(KIND[r.kind] || r.kind) + '</dd>' +
      '<dt>이름</dt><dd>' + esc(r.name) + '</dd><dt>연락처</dt><dd><a href="tel:' + esc(r.phone) + '">' + esc(r.phone) + '</a></dd><dt>이메일</dt><dd><a href="mailto:' + esc(r.email) + '">' + esc(r.email) + '</a></dd>' +
      (r.company ? '<dt>회사</dt><dd>' + esc(r.company) + '</dd>' : '') +
      Object.keys(d).map(function (k) { return '<dt>' + esc(k) + '</dt><dd>' + esc(d[k]) + '</dd>'; }).join('') +
      '<dt>언어·페이지</dt><dd>' + esc(r.lang || '') + ' · ' + esc(r.page || '') + '</dd><dt>보관 기한</dt><dd>' + esc(r.retain_until || '') + '</dd></dl>' +
      '<label class="lbl">상태</label><select id="ds" ' + (w ? '' : 'disabled') + '>' + ST_INQ.map(function (s) { return '<option value="' + s[0] + '"' + (s[0] === r.status ? ' selected' : '') + '>' + s[1] + '</option>'; }).join('') + '</select>' +
      '<label class="lbl">담당</label><input type="text" id="da" value="' + esc(r.assignee || '') + '" ' + (w ? '' : 'disabled') + ' style="width:100%">' +
      '<label class="lbl">메모 (안에서만 보임)</label><textarea id="dm" ' + (w ? '' : 'disabled') + '>' + esc(r.memo || '') + '</textarea>' +
      '<div class="row" style="margin-top:16px">' + (w ? '<button class="btn p" id="dsv">저장</button><button class="btn d" id="ddl">삭제</button>' : '') + '<button class="btn" id="dcl">닫기</button></div>');
    $('#dcl', dr).onclick = function () { dr.remove(); };
    if (!w) return;
    $('#dsv', dr).onclick = function () {
      var p = { status: $('#ds', dr).value, assignee: $('#da', dr).value.trim() || null, memo: $('#dm', dr).value.trim() || null };
      if (p.status === 'done' && r.status !== 'done') { var t = new Date(); t.setFullYear(t.getFullYear() + 1); p.retain_until = t.toISOString().slice(0, 10); }   /* 처리 완료일로부터 1년 */
      api.updInquiry(r.id, p).then(function () { msg('저장했어요'); dr.remove(); done(); }).catch(function (er) { msg('저장 실패: ' + (er.message || er), true); });
    };
    $('#ddl', dr).onclick = function () { if (!confirm('이 문의를 지울까요? 되돌릴 수 없어요.')) return; api.delInquiry(r.id).then(function () { msg('지웠어요'); dr.remove(); done(); }).catch(function (er) { msg('삭제 실패: ' + (er.message || er), true); }); };
  }
  function drawer(html) { $$('.drawer').forEach(function (x) { x.remove(); }); var d = document.createElement('aside'); d.className = 'drawer'; d.innerHTML = html; document.body.appendChild(d); return d; }

  /* ── 크리에이터 DB ── */
  function viewCreators(m) {
    m.insertAdjacentHTML('beforeend', '<h1>크리에이터 DB</h1><p class="sub">HOMI MARKET 「크리에이터 지원」(/market/creator)으로 들어온 크리에이터입니다. 소속 계약이 아니라 캠페인마다 연락하는 명단이에요.</p>' +
      '<div class="card"><div class="row" style="margin-bottom:12px"><select id="cs"><option value="">모든 상태</option>' + ST_CR.map(function (s) { return '<option value="' + s[0] + '">' + s[1] + '</option>'; }).join('') + '</select>' +
      '<input type="search" id="cq" placeholder="활동명·카테고리·나라·플랫폼 찾기" style="flex:1;min-width:180px"><button class="btn" id="cx">엑셀(CSV)로 받기</button></div><div id="clist"><div class="empty">불러오는 중…</div></div></div>');
    api.creators().then(function (rows) {
      var draw = function () {
        var st = $('#cs').value, q = $('#cq').value.trim().toLowerCase();
        var rs = rows.filter(function (r) { return (!st || r.status === st) && (!q || JSON.stringify(r).toLowerCase().indexOf(q) > -1); });
        $('#clist').innerHTML = rs.length ? '<table><thead><tr><th>지원일</th><th>활동명</th><th>플랫폼·규모</th><th>카테고리</th><th>나라</th><th>상태</th></tr></thead><tbody>' +
          rs.map(function (r) { return '<tr class="click" data-id="' + r.id + '"><td>' + fmt(r.created_at) + '</td><td><b>' + esc(r.handle) + '</b><br><a href="' + esc(r.channel_url) + '" target="_blank" rel="noopener" onclick="event.stopPropagation()">채널 ↗</a></td><td>' + esc((r.platforms || []).join(', ')) + '<br><small>' + esc(r.followers || '') + '</small></td><td>' + esc((r.categories || []).join(', ')) + '</td><td>' + esc(r.country || '') + '</td><td>' + tagOf(ST_CR, r.status) + '</td></tr>'; }).join('') + '</tbody></table>'
          : '<div class="empty">아직 지원한 크리에이터가 없어요.</div>';
        $$('#clist tr.click').forEach(function (tr) { tr.onclick = function () { openCr(rows.filter(function (r) { return r.id === tr.dataset.id; })[0]); }; });
      };
      $('#cs').onchange = draw; $('#cq').oninput = draw; draw();
      $('#cx').onclick = function () { csv(rows, [['created_at', '지원일'], ['handle', '활동명'], ['channel_url', '채널'], ['platforms', '플랫폼'], ['followers', '팔로워 규모'], ['country', '나라'], ['categories', '카테고리'], ['intro', '자기소개'], ['name', '이름'], ['phone', '연락처'], ['email', '이메일'], ['status', '상태'], ['memo', '메모']], 'HOMI_크리에이터DB_' + new Date().toISOString().slice(0, 10) + '.csv'); };
    }).catch(function (er) { $('#clist').innerHTML = '<div class="empty">불러오지 못했어요: ' + esc(er.message || er) + '</div>'; });
  }
  function openCr(r) {
    var w = canWrite('market');
    var dr = drawer('<h2>' + esc(r.handle) + '</h2><dl class="kv"><dt>채널</dt><dd><a href="' + esc(r.channel_url) + '" target="_blank" rel="noopener">' + esc(r.channel_url) + '</a></dd>' +
      '<dt>플랫폼</dt><dd>' + esc((r.platforms || []).join(', ')) + '</dd><dt>팔로워 규모</dt><dd>' + esc(r.followers) + '</dd><dt>나라</dt><dd>' + esc(r.country) + '</dd><dt>카테고리</dt><dd>' + esc((r.categories || []).join(', ')) + '</dd>' +
      '<dt>자기소개</dt><dd>' + esc(r.intro || '') + '</dd><dt>이름</dt><dd>' + esc(r.name) + '</dd><dt>연락처</dt><dd>' + esc(r.phone) + '</dd><dt>이메일</dt><dd><a href="mailto:' + esc(r.email) + '">' + esc(r.email) + '</a></dd>' +
      '<dt>지원일</dt><dd>' + fmt(r.created_at) + '</dd><dt>보관 기한</dt><dd>' + esc(r.retain_until || '') + '</dd></dl>' +
      '<label class="lbl">상태</label><select id="rs" ' + (w ? '' : 'disabled') + '>' + ST_CR.map(function (s) { return '<option value="' + s[0] + '"' + (s[0] === r.status ? ' selected' : '') + '>' + s[1] + '</option>'; }).join('') + '</select>' +
      '<label class="lbl">메모 (안에서만 보임)</label><textarea id="rm" ' + (w ? '' : 'disabled') + '>' + esc(r.memo || '') + '</textarea>' +
      '<div class="row" style="margin-top:16px">' + (w ? '<button class="btn p" id="rsv">저장</button><button class="btn d" id="rdl">삭제</button>' : '') + '<button class="btn" id="rcl">닫기</button></div>');
    $('#rcl', dr).onclick = function () { dr.remove(); };
    if (!w) return;
    $('#rsv', dr).onclick = function () { api.updCreator(r.id, { status: $('#rs', dr).value, memo: $('#rm', dr).value.trim() || null }).then(function () { msg('저장했어요'); dr.remove(); viewReload(); }).catch(function (er) { msg('저장 실패: ' + (er.message || er), true); }); };
    $('#rdl', dr).onclick = function () { if (!confirm('이 크리에이터 정보를 지울까요?')) return; api.delCreator(r.id).then(function () { msg('지웠어요'); dr.remove(); viewReload(); }).catch(function (er) { msg('삭제 실패: ' + (er.message || er), true); }); };
  }

  /* ── 계정·권한 (FR-COM-020·021) ── */
  function viewMembers(m) {
    m.insertAdjacentHTML('beforeend', '<h1>계정·권한</h1><p class="sub">여기 있는 이메일만 관리자에 들어올 수 있어요. 권한: 전체 관리(계정 포함) / 읽기·수정 / 읽기만. 사이트를 고르면 그 사이트만 보입니다.</p>' +
      '<div class="card"><div id="mlist"><div class="empty">불러오는 중…</div></div></div>' +
      '<div class="card"><h2 style="font-size:16px;margin-bottom:10px">담당자 추가·수정</h2><div class="row"><input type="email" id="me_e" placeholder="이메일" style="flex:1;min-width:200px"><input type="text" id="me_n" placeholder="이름"><select id="me_r">' +
      Object.keys(ROLE).map(function (k) { return '<option value="' + k + '"' + (k === 'editor' ? ' selected' : '') + '>' + ROLE[k] + '</option>'; }).join('') + '</select></div>' +
      '<div style="margin:12px 0">' + ['factory', 'market', 'production'].map(function (s) { return '<label class="chk"><input type="checkbox" class="me_s" value="' + s + '" checked> ' + SITE_NAME[s] + '</label>'; }).join('') + '</div>' +
      '<div class="row"><button class="btn p" id="me_sv">저장</button><label class="chk"><input type="checkbox" id="me_inv" checked> 저장하면서 로그인 링크(초대 메일) 보내기</label></div></div>');
    var load = function () {
      api.members().then(function (rows) {
        $('#mlist').innerHTML = '<table><thead><tr><th>이메일</th><th>이름</th><th>권한</th><th>사이트</th><th></th></tr></thead><tbody>' + rows.map(function (r) {
          return '<tr><td>' + esc(r.email) + '</td><td>' + esc(r.name || '') + '</td><td>' + esc(ROLE[r.role]) + '</td><td>' + (r.role === 'owner' ? '전체' : esc((r.sites || []).map(function (s) { return SITE_NAME[s]; }).join(', '))) + '</td>' +
            '<td style="white-space:nowrap"><button class="btn" data-ed="' + esc(r.email) + '">수정</button> ' + (r.email === S.me.email ? '' : '<button class="btn d" data-rm="' + esc(r.email) + '">빼기</button>') + '</td></tr>';
        }).join('') + '</tbody></table>';
        $$('[data-ed]').forEach(function (b) { b.onclick = function () { var r = rows.filter(function (x) { return x.email === b.dataset.ed; })[0]; $('#me_e').value = r.email; $('#me_n').value = r.name || ''; $('#me_r').value = r.role; $$('.me_s').forEach(function (c) { c.checked = (r.sites || []).indexOf(c.value) > -1; }); $('#me_inv').checked = false; $('#me_e').focus(); }; });
        $$('[data-rm]').forEach(function (b) { b.onclick = function () { if (!confirm(b.dataset.rm + ' 계정을 관리자에서 뺄까요?')) return; api.delMember(b.dataset.rm).then(function () { msg('뺐어요'); load(); }).catch(function (er) { msg('실패: ' + (er.message || er), true); }); }; });
      }).catch(function (er) { $('#mlist').innerHTML = '<div class="empty">불러오지 못했어요: ' + esc(er.message || er) + '</div>'; });
    };
    $('#me_sv').onclick = function () {
      var e = $('#me_e').value.trim().toLowerCase(); if (!/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(e)) return msg('이메일을 확인해 주세요', true);
      var mem = { email: e, name: $('#me_n').value.trim() || null, role: $('#me_r').value, sites: $$('.me_s').filter(function (c) { return c.checked; }).map(function (c) { return c.value; }) };
      api.saveMember(mem).then(function () { return $('#me_inv').checked ? api.invite(e).then(function () { msg('저장하고 로그인 링크를 보냈어요'); }) : msg('저장했어요'); })
        .then(function () { $('#me_e').value = ''; $('#me_n').value = ''; load(); }).catch(function (er) { msg('실패: ' + (er.message || er), true); });
    };
    load();
  }

  /* ── 개인정보 관리 (FR-COM-022) ── */
  function viewPrivacy(m) {
    m.insertAdjacentHTML('beforeend', '<h1>개인정보 관리</h1><p class="sub">처리방침(<a href="/market/privacy" target="_blank" rel="noopener">전문 ↗</a>)에 적은 보유 기간을 지키고, 본인 요청(열람·정정·삭제)을 처리하는 곳입니다.</p>' +
      '<div class="card"><h2 style="font-size:16px;margin-bottom:8px">보유 기간</h2><table><tbody>' +
      '<tr><td>상담 신청서·프로젝트 문의·제작·대관 문의</td><td>처리 완료일로부터 1년</td></tr><tr><td>크리에이터 지원</td><td>접수일로부터 1년 (함께한 크리에이터는 계약 종료 후 법정 기간)</td></tr><tr><td>실시간 채팅 상담</td><td>상담 종료일로부터 1년</td></tr></tbody></table></div>' +
      '<div class="card"><h2 style="font-size:16px;margin-bottom:8px">기간이 지난 정보 지우기</h2><p id="pexp" class="sub" style="margin:0 0 12px">확인하는 중…</p><button class="btn d" id="ppg">지금 지우기</button>' +
      '<p class="sub" style="margin:10px 0 0">완료·스팸 처리된 문의와, 「함께함」이 아닌 크리에이터 중 보관 기한이 지난 것만 지웁니다. 메일함·구글 시트에 남은 사본은 따로 지워 주세요.</p></div>' +
      '<div class="card"><h2 style="font-size:16px;margin-bottom:8px">본인 요청 처리 (열람·정정·삭제)</h2><div class="row"><input type="search" id="pq" placeholder="요청한 분의 이메일·전화번호·이름" style="flex:1;min-width:200px"><button class="btn p" id="pf">찾기</button></div><div id="pres" style="margin-top:12px"></div>' +
      '<p class="sub" style="margin:10px 0 0">요청을 받은 날부터 10일 안에 처리합니다(처리방침 제8조). 본인 확인 후 처리해 주세요.</p></div>');
    var count = function () { api.expired().then(function (c) { $('#pexp').textContent = '지울 대상: 문의 ' + c.inquiries + '건 · 크리에이터 ' + c.creators + '건'; $('#ppg').disabled = !(c.inquiries + c.creators); }).catch(function (er) { $('#pexp').textContent = '확인하지 못했어요: ' + (er.message || er); }); };
    $('#ppg').onclick = function () { if (!confirm('보관 기한이 지난 정보를 지울까요? 되돌릴 수 없어요.')) return; api.purge().then(function (r) { msg('지웠어요 — 문의 ' + r.inquiries + '건 · 크리에이터 ' + r.creators + '건'); count(); }).catch(function (er) { msg('실패: ' + (er.message || er), true); }); };
    $('#pf').onclick = function () {
      var q = $('#pq').value.trim(); if (q.length < 3) return msg('3글자 이상 넣어 주세요', true);
      api.findPerson(q).then(function (r) {
        var rows = r.inquiries.map(function (x) { return { t: '문의 · ' + SITE_NAME[x.site], id: x.id, k: 'i', name: x.name, c: (x.email || '') + ' ' + (x.phone || ''), at: x.created_at }; })
          .concat(r.creators.map(function (x) { return { t: '크리에이터', id: x.id, k: 'c', name: x.name + ' (' + x.handle + ')', c: (x.email || '') + ' ' + (x.phone || ''), at: x.created_at }; }));
        $('#pres').innerHTML = rows.length ? '<table><tbody>' + rows.map(function (x) { return '<tr><td>' + esc(x.t) + '</td><td>' + esc(x.name) + '</td><td>' + esc(x.c) + '</td><td>' + fmt(x.at) + '</td><td><button class="btn d" data-k="' + x.k + '" data-id="' + x.id + '">지우기</button></td></tr>'; }).join('') + '</tbody></table>' : '<div class="empty">찾은 정보가 없어요.</div>';
        $$('#pres [data-id]').forEach(function (b) { b.onclick = function () { if (!confirm('이 정보를 지울까요?')) return; (b.dataset.k === 'i' ? api.delInquiry(b.dataset.id) : api.delCreator(b.dataset.id)).then(function () { msg('지웠어요'); $('#pf').click(); count(); }).catch(function (er) { msg('실패: ' + (er.message || er), true); }); }; });
      }).catch(function (er) { msg('찾지 못했어요: ' + (er.message || er), true); });
    };
    count();
  }

  /* ── 사이트 설정 (FR-COM-023) ── */
  function viewSettings(m) {
    m.insertAdjacentHTML('beforeend', '<h1>사이트 설정</h1><p class="sub">세 사이트가 함께 쓰는 연락처·알림 받는 곳입니다.</p><div class="card" id="sbox"><div class="empty">불러오는 중…</div></div>' +
      '<div class="card"><h2 style="font-size:16px;margin-bottom:8px">페이지 저장 키 (GitHub)</h2><p class="sub" style="margin:0 0 10px">「페이지 편집」·「Home 설정」에서 저장할 때 씁니다. 이 브라우저에만 기억됩니다. 만드는 곳: GitHub → Settings → Developer settings → Fine-grained token (저장소 homifactory-site · Contents 읽기·쓰기)</p>' +
      '<div class="row"><input type="password" id="gt" placeholder="github_pat_…" style="flex:1;min-width:220px"><button class="btn p" id="gts">기억</button><span id="gst" class="sub" style="margin:0"></span></div></div>');
    $('#gt').value = tok(); $('#gst').textContent = tok() ? '기억됨' : '';
    $('#gts').onclick = function () { try { localStorage.setItem('hm_gh_token', $('#gt').value.trim()); } catch (e) {} $('#gst').textContent = $('#gt').value.trim() ? '기억됨' : ''; msg('저장 키를 기억했어요'); };
    api.settings().then(function (rows) {
      var g = function (k) { var r = rows.filter(function (x) { return x.key === k; })[0]; return (r && r.value) || {}; };
      var c = g('contact'), n = g('notify');
      $('#sbox').innerHTML = '<label class="lbl">대표 이메일</label><input type="email" id="s_em" value="' + esc(c.email || '') + '" style="width:100%">' +
        '<label class="lbl">대표 전화</label><input type="text" id="s_ph" value="' + esc(c.phone || '') + '" style="width:100%">' +
        '<label class="lbl">운영시간</label><input type="text" id="s_hr" value="' + esc(c.hours || '') + '" style="width:100%">' +
        '<label class="lbl">카카오톡 채널 주소</label><input type="text" id="s_kk" value="' + esc(c.kakao || '') + '" placeholder="https://pf.kakao.com/…" style="width:100%">' +
        '<label class="lbl">문의 알림 받는 메일</label><input type="text" id="s_to" value="' + esc(n.to || '') + '" style="width:100%">' +
        '<label class="lbl">함께 받는 메일 (쉼표로 구분)</label><input type="text" id="s_cc" value="' + esc(n.cc || '') + '" style="width:100%">' +
        '<p class="sub" style="margin:12px 0">지금 사이트 화면의 연락처·알림 주소는 각 페이지에 적혀 있어서, 여기서 바꾼 값은 개발 반영 때 함께 맞춥니다. (다음 단계: 페이지가 이 값을 직접 읽도록 연결)</p>' +
        '<button class="btn p" id="s_sv">저장</button>';
      $('#s_sv').onclick = function () {
        Promise.all([api.saveSetting('contact', { email: $('#s_em').value.trim(), phone: $('#s_ph').value.trim(), hours: $('#s_hr').value.trim(), kakao: $('#s_kk').value.trim() }),
          api.saveSetting('notify', { to: $('#s_to').value.trim(), cc: $('#s_cc').value.trim() })]).then(function () { msg('저장했어요'); }).catch(function (er) { msg('저장 실패: ' + (er.message || er), true); });
      };
    }).catch(function (er) { $('#sbox').innerHTML = '<div class="empty">불러오지 못했어요: ' + esc(er.message || er) + '</div>'; });
  }

  /* ── 사이트별 연결 화면 ── */
  function viewHome(m) { m.insertAdjacentHTML('beforeend', '<h1>MARKET Home 설정</h1><p class="sub">고객사 로고·띠 배너·히어로 문구·업종 줄·Home 사진·영상·문구. 저장하면 1~2분 뒤 4개 언어 Home에 반영됩니다. (<a href="/market-admin/" target="_blank" rel="noopener">새 창으로 열기 ↗</a>)</p><iframe class="embed" src="/market-admin/" title="MARKET Home 설정"></iframe>'); }
  function viewWorks(m) { m.insertAdjacentHTML('beforeend', '<h1>PRODUCTION 작품 관리</h1><p class="sub">작품 등록·순서·대표 작품·숨김과 사이트 설정. 같은 계정으로 로그인됩니다. (<a href="/production/admin" target="_blank" rel="noopener">새 창으로 열기 ↗</a>)</p><iframe class="embed" src="/production/admin" title="PRODUCTION 작품 관리"></iframe>'); }

  /* ── 페이지 편집 (FR-COM-018) — 저장소 파일의 글자·사진을 그 자리에서 바꿔 저장 ── */
  function tok() { try { return localStorage.getItem('hm_gh_token') || ''; } catch (e) { return ''; } }
  function gh(path, opt) { opt = opt || {}; opt.headers = Object.assign({ Accept: 'application/vnd.github+json' }, opt.headers || {}); var t = tok(); if (t) opt.headers.Authorization = 'Bearer ' + t; return fetch('https://api.github.com/repos/' + REPO + path, opt); }
  function b64dec(b) { var bin = atob(b.replace(/\n/g, '')); var u = new Uint8Array(bin.length); for (var i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i); return new TextDecoder().decode(u); }
  function b64enc(s) { var u = new TextEncoder().encode(s), bin = ''; for (var i = 0; i < u.length; i += 0x8000) bin += String.fromCharCode.apply(null, u.subarray(i, i + 0x8000)); return btoa(bin); }
  function fileB64(f) { return new Promise(function (ok, no) { var r = new FileReader(); r.onload = function () { ok(String(r.result).split(',')[1]); }; r.onerror = no; r.readAsDataURL(f); }); }
  var FILTER = {
    factory: function (p) { return /^[^/]+\.html$/.test(p) && !/^(404|admin)/.test(p); },
    market: function (p) { return /^(market|en\/market|ja\/market|id\/market)\/[^/]+\.html$/.test(p); },
    production: function (p) { return /^production\/[^/]+\.html$/.test(p) && !/admin\.html$/.test(p); }
  };
  /* 글자 조각: 태그 사이의 글(스크립트·스타일·주석 제외). 위치(start,end)를 기억해 그 자리만 바꿈 */
  function segments(html) {
    var out = [], i = 0, n = html.length, skip = /^<(script|style|noscript|svg|template)\b/i;
    while (i < n) {
      if (html.startsWith('<!--', i)) { var e = html.indexOf('-->', i); i = e < 0 ? n : e + 3; continue; }
      if (html[i] === '<') {
        var m = skip.exec(html.slice(i, i + 12));
        if (m) { var close = html.toLowerCase().indexOf('</' + m[1].toLowerCase(), i); i = close < 0 ? n : html.indexOf('>', close) + 1; continue; }
        var gt = html.indexOf('>', i); i = gt < 0 ? n : gt + 1; continue;
      }
      var lt = html.indexOf('<', i); if (lt < 0) lt = n;
      var t = html.slice(i, lt);
      if (t.trim() && !/^\s*(&nbsp;|\s)*\s*$/.test(t)) { var a = i + t.search(/\S/), b = i + t.replace(/\s+$/, '').length; out.push({ s: a, e: b, t: html.slice(a, b) }); }
      i = lt;
    }
    return out;
  }
  function images(html) { var out = [], re = /<img\b[^>]*?\ssrc="([^"]+)"/gi, m; while ((m = re.exec(html))) { var s = m.index + m[0].length - m[1].length - 1; out.push({ s: s, e: s + m[1].length, src: m[1] }); } return out; }
  function viewPages(m) {
    var site = S.site, w = canWrite(site);
    m.insertAdjacentHTML('beforeend', '<h1>' + SITE_NAME[site] + ' 페이지 편집</h1><p class="sub">페이지를 고르면 화면의 글자와 사진이 차례대로 나옵니다. 바꾼 칸만 저장되고, 1~2분 뒤 사이트에 반영됩니다.' +
      (site === 'market' ? ' <b>MARKET은 언어마다 파일이 따로라서</b> 한국어(market/)를 고치면 EN·JA·ID는 그대로예요 — 같은 문장을 각 언어 파일에서도 고쳐 주세요. Home의 로고·문구는 「Home 설정」이 더 편합니다.' : '') + '</p>' +
      (tok() ? '' : '<div class="notice">저장하려면 페이지 저장 키(GitHub)가 필요해요 — 공통 › 사이트 설정 아래에서 넣을 수 있어요. 키 없이도 읽기는 됩니다.</div>') +
      '<div class="card"><div class="row"><select id="pg" style="flex:1;min-width:240px"><option value="">페이지 고르기…</option></select><input type="search" id="pgq" placeholder="글자 찾기" style="flex:1;min-width:160px">' +
      '<a class="btn" id="pgv" target="_blank" rel="noopener" href="#" hidden>사이트에서 보기 ↗</a></div></div><div id="pgbody"></div>' +
      '<div class="card row" id="pgbar" hidden style="position:sticky;bottom:12px;box-shadow:0 10px 30px rgba(0,0,0,.08)"><span id="pgc" class="sub" style="margin:0;flex:1"></span><button class="btn" id="pgr">되돌리기</button>' + (w ? '<button class="btn p" id="pgs">저장하기</button>' : '<span class="sub" style="margin:0">읽기 권한만 있어요</span>') + '</div>');
    gh('/git/trees/' + BR + '?recursive=1').then(function (r) { if (!r.ok) throw new Error('목록을 못 불러왔어요 (' + r.status + ')'); return r.json(); }).then(function (j) {
      var files = j.tree.filter(function (t) { return t.type === 'blob' && FILTER[site](t.path); }).map(function (t) { return t.path; }).sort();
      $('#pg').insertAdjacentHTML('beforeend', files.map(function (p) { return '<option>' + esc(p) + '</option>'; }).join(''));
    }).catch(function (er) { msg(er.message || String(er), true); });
    var cur = null;
    $('#pg').onchange = function () { var p = $('#pg').value; if (!p) return; openPage(p); };
    function openPage(path) {
      $('#pgbody').innerHTML = '<div class="card empty">불러오는 중…</div>'; $('#pgbar').hidden = true;
      gh('/contents/' + encodeURI(path) + '?ref=' + BR).then(function (r) { if (!r.ok) throw new Error('파일을 못 불러왔어요 (' + r.status + ')'); return r.json(); }).then(function (j) {
        var html = b64dec(j.content); cur = { path: path, sha: j.sha, html: html, segs: segments(html), imgs: images(html), imgNew: {} };
        var url = '/' + path.replace(/index\.html$/, '').replace(/\.html$/, ''); $('#pgv').href = url; $('#pgv').hidden = false;
        draw();
      }).catch(function (er) { $('#pgbody').innerHTML = '<div class="card empty">' + esc(er.message || er) + '</div>'; });
    }
    function draw() {
      var q = ($('#pgq').value || '').trim();
      var segHtml = cur.segs.map(function (s, k) { if (q && s.t.indexOf(q) < 0) return ''; return '<div class="seg-item"><span class="n">' + (k + 1) + '</span><textarea data-k="' + k + '" rows="' + Math.min(6, Math.ceil(s.t.length / 60)) + '"' + (w ? '' : ' disabled') + '>' + esc(s.t) + '</textarea></div>'; }).join('');
      var imgHtml = cur.imgs.map(function (im, k) { var shown = cur.imgNew[k] ? cur.imgNew[k].preview : (/^(https?:|\/)/.test(im.src) ? im.src : ''); return '<div class="img-item"><img src="' + esc(shown) + '" alt=""><code>' + esc(cur.imgNew[k] ? cur.imgNew[k].file.name + ' (바꿀 예정)' : im.src) + '</code>' + (w ? '<label class="btn">바꾸기<input type="file" accept="image/*" hidden data-i="' + k + '"></label>' : '') + '</div>'; }).join('');
      $('#pgbody').innerHTML = '<div class="card"><h2 style="font-size:16px;margin-bottom:12px">글자 ' + cur.segs.length + '칸</h2><div class="seg">' + (segHtml || '<div class="empty">찾는 글자가 없어요</div>') + '</div></div>' +
        (cur.imgs.length ? '<div class="card"><h2 style="font-size:16px;margin-bottom:6px">사진 ' + cur.imgs.length + '장</h2><p class="sub" style="margin:0 0 6px">사진은 5MB 이하. 관리자 화면(Home 설정)에서 바꾸는 사진은 여기 나오지 않아요.</p>' + imgHtml + '</div>' : '');
      $$('#pgbody textarea').forEach(function (ta) { var s = cur.segs[+ta.dataset.k]; if (s.nv != null) { ta.value = s.nv; ta.classList.add('changed'); } ta.oninput = function () { s.nv = ta.value === s.t ? null : ta.value; ta.classList.toggle('changed', s.nv != null); bar(); }; });
      $$('#pgbody input[type=file]').forEach(function (inp) { inp.onchange = function () { var f = inp.files[0]; if (!f) return; if (f.size > 5 * 1024 * 1024) return msg('5MB 이하 사진만 올릴 수 있어요', true); cur.imgNew[+inp.dataset.i] = { file: f, preview: URL.createObjectURL(f) }; draw(); bar(); }; });
      bar();
    }
    function changed() { return cur ? cur.segs.filter(function (s) { return s.nv != null; }).length + Object.keys(cur.imgNew).length : 0; }
    function bar() { var c = changed(); $('#pgbar').hidden = !c; $('#pgc').textContent = '바꾼 곳 ' + c + '개'; }
    $('#pgq').oninput = function () { if (cur) draw(); };
    $('#pgr').onclick = function () { if (!cur) return; cur.segs.forEach(function (s) { s.nv = null; }); cur.imgNew = {}; draw(); };
    var sv = $('#pgs'); if (sv) sv.onclick = function () {
      if (!tok()) return msg('저장 키가 없어요 — 공통 › 사이트 설정에서 넣어 주세요', true);
      sv.disabled = true; msg('저장하는 중…');
      var ups = Object.keys(cur.imgNew).map(function (k) { return { k: +k, f: cur.imgNew[k].file }; });
      var chain = Promise.resolve(), newSrc = {};
      ups.forEach(function (u) {   /* 한 장씩 (동시에 올리면 409) */
        chain = chain.then(function () {
          var ext = (u.f.name.match(/\.(png|jpe?g|webp|gif|svg)$/i) || ['', 'jpg'])[1].toLowerCase(), path = 'assets/uploads/' + site + '/' + Date.now() + '-' + Math.random().toString(36).slice(2, 6) + '.' + ext;
          return fileB64(u.f).then(function (c) { return gh('/contents/' + path, { method: 'PUT', body: JSON.stringify({ message: 'admin: ' + site + ' 사진 업로드', content: c, branch: BR }) }); })
            .then(function (r) { if (!r.ok) throw new Error('사진 업로드 실패 (' + r.status + ')'); newSrc[u.k] = '/' + path; });
        });
      });
      chain.then(function () {
        var edits = cur.segs.filter(function (s) { return s.nv != null; }).map(function (s) { return { s: s.s, e: s.e, v: s.nv.replace(/</g, '&lt;') }; })
          .concat(Object.keys(newSrc).map(function (k) { var im = cur.imgs[k]; return { s: im.s, e: im.e, v: newSrc[k] }; }));
        edits.sort(function (a, b) { return b.s - a.s; });
        var html = cur.html; edits.forEach(function (x) { html = html.slice(0, x.s) + x.v + html.slice(x.e); });
        return gh('/contents/' + encodeURI(cur.path), { method: 'PUT', body: JSON.stringify({ message: 'admin: ' + cur.path + ' 글자·사진 수정 (' + edits.length + '곳, ' + (S.me.name || S.me.email) + ')', content: b64enc(html), sha: cur.sha, branch: BR }) });
      }).then(function (r) {
        if (r.status === 409) throw new Error('그사이 다른 곳에서 이 페이지가 바뀌었어요 — 페이지를 다시 골라 불러온 뒤 고쳐 주세요');
        if (!r.ok) throw new Error('저장 실패 (' + r.status + ')'); return r.json();
      }).then(function () { msg('저장했어요 — 1~2분 뒤 사이트에 반영됩니다'); openPage(cur.path); })
        .catch(function (er) { msg(er.message || String(er), true); }).then(function () { sv.disabled = false; });
    };
  }

  api.onAuth(function () { if (!S.me) boot(); });
  boot();
})();
