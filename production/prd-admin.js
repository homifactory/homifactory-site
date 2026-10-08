/* HOMI PRODUCTION 작품 관리 (FR-PRD-007) — 로그인한 담당자만. 저장소: Supabase prd_works / 썸네일: prd-thumbs */
(function () {
  'use strict';
  var URL_ = 'https://bcngbtwzuqtwtxaebftf.supabase.co';
  var KEY = 'sb_publishable_4f1Mbi136Y8iuHSk-xub8A_43uK3Wiy';
  var CATS = { visual: [['mv', '뮤직비디오'], ['film', '아티스트 필름'], ['live', '라이브·퍼포먼스']],
               commercial: [['ad', '광고·브랜드 필름'], ['series', '웹예능·시리즈'], ['short', '숏폼·SNS 콘텐츠']] };
  var ROLES = ['기획', '촬영', '편집', '색보정', '모션그래픽', '음향'];
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var catName = {}; CATS.visual.concat(CATS.commercial).forEach(function (c) { catName[c[0]] = c[1]; });

  /* ── 저장소 연결: 실서비스는 Supabase, 로컬 점검(?mock=1, localhost)만 메모리 ── */
  var mock = /^(127\.0\.0\.1|localhost)$/.test(location.hostname) && /[?&]mock=1/.test(location.search);
  var api = mock ? mockApi() : sbApi();

  function sbApi() {
    var sb = window.supabase.createClient(URL_, KEY, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } });
    function ok(r) { if (r.error) throw r.error; return r.data; }
    return {
      session: function () { return sb.auth.getSession().then(function (r) { return r.data.session; }); },
      onAuth: function (fn) { sb.auth.onAuthStateChange(function (_e, s) { fn(s); }); },
      login: function (email) { return sb.auth.signInWithOtp({ email: email, options: { shouldCreateUser: false, emailRedirectTo: location.origin + '/production/admin' } }).then(ok); },
      logout: function () { return sb.auth.signOut(); },
      isAdmin: function () { return sb.rpc('is_prd_admin').then(ok); },
      list: function () { return sb.from('prd_works').select('*').order('sort_order').order('published_on', { ascending: false, nullsFirst: false }).then(ok); },
      save: function (row) {
        var q = row.id ? sb.from('prd_works').update(row).eq('id', row.id) : sb.from('prd_works').insert(row);
        return q.select().single().then(ok);
      },
      remove: function (id) { return sb.from('prd_works').delete().eq('id', id).then(ok); },
      clearFeatured: function (exceptId) { var q = sb.from('prd_works').update({ is_featured: false }).eq('is_featured', true); if (exceptId) q = q.neq('id', exceptId); return q.then(ok); },
      setOrder: function (pairs) { return Promise.all(pairs.map(function (p) { return sb.from('prd_works').update({ sort_order: p[1] }).eq('id', p[0]).then(ok); })); },
      getSettings: function () { return sb.from('prd_settings').select('key,value').then(ok); },
      saveSetting: function (key, value) { return sb.from('prd_settings').upsert({ key: key, value: value }).then(ok); },
      upload: function (file) {
        var path = Date.now() + '-' + file.name.replace(/[^\w.\-]/g, '_');
        return sb.storage.from('prd-thumbs').upload(path, file, { upsert: false, contentType: file.type }).then(ok)
          .then(function () { return sb.storage.from('prd-thumbs').getPublicUrl(path).data.publicUrl; });
      }
    };
  }
  function mockApi() {
    var rows = [], n = 0, s = null, cb = function () {}, sets = {};
    return {
      session: function () { return Promise.resolve(s); }, onAuth: function (fn) { cb = fn; },
      login: function (email) { s = { user: { email: email } }; setTimeout(function () { cb(s); }, 10); return Promise.resolve(); },
      logout: function () { s = null; cb(null); return Promise.resolve(); },
      isAdmin: function () { return Promise.resolve(!!s && /@homifactory\.com$/.test(s.user.email)); },
      list: function () { return Promise.resolve(rows.slice().sort(function (a, b) { return a.sort_order - b.sort_order; }).map(function (r) { return Object.assign({}, r); })); },
      save: function (row) {
        if (!row.id) { row = Object.assign({ id: 'm' + (++n), slug: 'w' + n, sort_order: rows.length }, row); rows.push(row); }
        else { var i = rows.findIndex(function (r) { return r.id === row.id; }); rows[i] = Object.assign(rows[i], row); row = rows[i]; }
        return Promise.resolve(Object.assign({}, row));
      },
      remove: function (id) { rows = rows.filter(function (r) { return r.id !== id; }); return Promise.resolve(); },
      clearFeatured: function (ex) { rows.forEach(function (r) { if (r.id !== ex) r.is_featured = false; }); return Promise.resolve(); },
      setOrder: function (pairs) { pairs.forEach(function (p) { rows.forEach(function (r) { if (r.id === p[0]) r.sort_order = p[1]; }); }); return Promise.resolve(); },
      getSettings: function () { return Promise.resolve(Object.keys(sets).map(function (k) { return { key: k, value: sets[k] }; })); },
      saveSetting: function (k, v) { sets[k] = v; return Promise.resolve(); },
      upload: function (file) { return Promise.resolve('data:' + file.type + ';base64,'); }
    };
  }

  /* ── 영상 링크 → 썸네일 ── */
  function parse(url) {
    url = String(url || '');
    var m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/))([\w-]{11})/);
    if (m) return { kind: 'yt', id: m[1] };
    m = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
    return m ? { kind: 'vm', id: m[1] } : null;
  }
  function autoThumb(url) {
    var v = parse(url); if (!v) return Promise.resolve('');
    if (v.kind === 'yt') return Promise.resolve('https://i.ytimg.com/vi/' + v.id + '/hqdefault.jpg');
    return fetch('https://vimeo.com/api/oembed.json?width=640&url=' + encodeURIComponent(url)).then(function (r) { return r.json(); })
      .then(function (j) { return j.thumbnail_url || ''; }).catch(function () { return ''; });
  }

  /* ── 화면 ── */
  var rows = [], filter = 'all', cur = null, msgT;
  function msg(t, bad) { var m = $('#a-msg'); m.textContent = t; m.className = 'a-msg' + (bad ? ' bad' : ''); m.hidden = false; clearTimeout(msgT); msgT = setTimeout(function () { m.hidden = true; }, 3500); }

  var tab = 'works';
  function showView(v) {
    ['login', 'denied'].forEach(function (k) { $('#a-' + k).hidden = k !== v; });
    $('#a-tabs').hidden = v !== 'app';
    $('#a-app').hidden = !(v === 'app' && tab === 'works');
    $('#a-set').hidden = !(v === 'app' && tab === 'set');
  }

  /* ── 사이트 설정 (FR-PRD-012 소개 문구 · FR-PRD-013 스튜디오 영상) — 값이 없으면 페이지 처음 문구·영상을 그대로 씀 ── */
  var DEF = {
    intro: { headline: '잘 만든 영상을 넘어,\n제 몫을 해내는 영상을 만듭니다',
      body: '호미 프로덕션은 아티스트와 브랜드의 마케팅을 해 온 호미 팩토리의 제작팀입니다. 그래서 카메라를 들기 전에, 이 영상이 누구에게 닿아야 하는지부터 함께 정합니다. 기획부터 촬영·편집까지 한 팀이 맡고, 전용 호리존 스튜디오에서 찍습니다. 완성된 뒤에는 크리에이터 네트워크와 일본·인도네시아 거점을 통해 영상이 닿을 곳까지 함께 설계합니다.',
      closing: '한 편을 만드는 데서 끝내지 않고, 그 한 편이 제 몫을 할 때까지 함께합니다.',
      chips: ['전용 호리존 스튜디오', '아티스트·브랜드 마케팅에서 출발한 기획', '크리에이터·해외 거점과 이어지는 확산'] },
    studio_video: { url: 'https://www.youtube.com/watch?v=UQrShy8I1EQ', title: '[Live Clip] ILHOON - closet (Feat. ZENE THE ZILLA) (One Take ver.)', channel: 'CPTZ' }
  };
  var sets = {};
  function fillIntro(v) {
    var f = $('#s-intro'); f.headline.value = v.headline || '';
    var ps = v.paras || [];   /* 예전 형식도 받아 줌 */
    f.p1.value = v.body || ps.slice(0, 2).filter(Boolean).join(' '); f.p3.value = v.closing || ps[2] || '';
    ['c1', 'c2', 'c3'].forEach(function (k, i) { f[k].value = (v.chips || [])[i] || ''; });
  }
  function fillVid(v) { var f = $('#s-vid'); f.url.value = v.url || ''; f.title.value = v.title || ''; f.channel.value = v.channel || ''; vidPrev(); }
  function vidPrev() {
    var p = parse($('#s-vid').url.value), box = $('#s-vid-prev');
    box.innerHTML = p && p.kind === 'yt' ? '<img alt="" src="https://i.ytimg.com/vi/' + p.id + '/hqdefault.jpg">' : '유튜브 링크를 넣으면 미리보기가 나와요';
  }
  function loadSettings() {
    return api.getSettings().then(function (rs) {
      sets = {}; (rs || []).forEach(function (r) { sets[r.key] = r.value; });
      fillIntro(sets.intro || DEF.intro); fillVid(sets.studio_video || DEF.studio_video);
    }).catch(function (e) { fillIntro(DEF.intro); fillVid(DEF.studio_video); msg('설정 불러오기 실패: ' + (e.message || e), true); });
  }
  function bindSettings() {
    $('#a-tabs').addEventListener('click', function (e) {
      var b = e.target.closest('[data-tab]'); if (!b) return;
      tab = b.dataset.tab; this.querySelectorAll('[data-tab]').forEach(function (x) { x.setAttribute('aria-selected', String(x === b)); });
      showView('app'); if (tab === 'set') loadSettings();
    });
    document.querySelectorAll('[data-reset]').forEach(function (b) { b.addEventListener('click', function () {
      if (b.dataset.reset === 'intro') fillIntro(DEF.intro); else fillVid(DEF.studio_video);
      msg('처음 값으로 채웠어요. [저장]을 눌러야 반영됩니다.');
    }); });
    $('#s-vid').url.addEventListener('input', vidPrev);
    $('#s-intro').addEventListener('submit', function (e) {
      e.preventDefault(); var f = this, t = function (n) { return f[n].value.trim(); };
      var v = { headline: t('headline'), body: t('p1'), closing: t('p3'), chips: [t('c1'), t('c2'), t('c3')] };
      api.saveSetting('intro', v).then(function () { sets.intro = v; msg('소개 문구를 저장했어요. 사이트에 바로 반영됩니다.'); })
        .catch(function (er) { msg('저장 실패: ' + (er.message || er), true); });
    });
    $('#s-vid').addEventListener('submit', function (e) {
      e.preventDefault(); var f = this, err = $('#s-url-err'), u = f.url.value.trim(), p = parse(u);
      if (u && !(p && p.kind === 'yt')) { err.textContent = '유튜브 영상 링크를 넣어 주세요.'; f.url.focus(); return; }
      err.textContent = '';
      var v = { url: u, title: f.title.value.trim(), channel: f.channel.value.trim() };
      api.saveSetting('studio_video', v).then(function () { sets.studio_video = v; msg(u ? '스튜디오 영상을 저장했어요. 사이트에 바로 반영됩니다.' : '링크를 비웠어요. 사이트에는 처음 영상이 나옵니다.'); })
        .catch(function (er) { msg('저장 실패: ' + (er.message || er), true); });
    });
  }
  var lastKey;
  function boot(s) {
    var key = s ? s.user.email : '';
    if (key === lastKey) return; lastKey = key;   /* 같은 상태로 두 번 불리면 무시 */
    if (!s) { showView('login'); return; }
    $('#a-who').textContent = s.user.email;
    api.isAdmin().then(function (ok) {
      if (!ok) { $('#a-denied-email').textContent = s.user.email; showView('denied'); return; }
      showView('app'); load();
    }).catch(function (e) { msg('권한 확인 실패: ' + (e.message || e), true); showView('denied'); });
  }
  function load(selectId) {
    return api.list().then(function (d) { rows = d; renderList(); if (selectId) edit(selectId); else if (!cur) newItem(); })
      .catch(function (e) { msg('불러오기 실패: ' + (e.message || e), true); });
  }

  function visible() {   /* 전체 보기는 VISUAL 먼저, 각 구분 안에서는 사이트 순서 그대로 */
    return rows.filter(function (r) { return filter === 'all' || r.section === filter; })
      .sort(function (a, b) { return (a.section === b.section ? 0 : a.section === 'visual' ? -1 : 1) || a.sort_order - b.sort_order; });
  }
  function renderList() {
    var v = visible(), ul = $('#a-list');
    $('#a-count').textContent = v.length + '개';
    ul.innerHTML = v.length ? v.map(function (r) {
      return '<li draggable="true" data-id="' + esc(r.id) + '"' + (cur && cur.id === r.id ? ' aria-current="true"' : '') + (r.hidden ? ' class="is-hidden"' : '') + '>' +
        '<span class="a-grip" aria-hidden="true">⋮⋮</span>' +
        '<button type="button" class="a-pick" data-id="' + esc(r.id) + '">' +
        '<span class="a-t">' + (r.is_featured ? '<b class="a-star" title="대표 영상">★</b> ' : '') + esc(r.title) + '</span>' +
        '<span class="a-s">' + (r.section === 'visual' ? 'VISUAL' : 'COMMERCIAL') + ' · ' + esc(catName[r.category] || '') + (r.hidden ? ' · 숨김' : '') + '</span></button>' +
        '<span class="a-move"><button type="button" data-mv="-1" aria-label="위로">▲</button><button type="button" data-mv="1" aria-label="아래로">▼</button></span></li>';
    }).join('') : '<li class="a-empty">등록된 작품이 없습니다. 오른쪽에서 첫 작품을 등록해 주세요.</li>';
    $('#a-order-note').hidden = filter === 'all';
  }

  function fillCats(section, val) {
    $('#f-cat').innerHTML = CATS[section].map(function (c) { return '<option value="' + c[0] + '"' + (c[0] === val ? ' selected' : '') + '>' + c[1] + '</option>'; }).join('');
  }
  function setForm(r) {
    var f = $('#a-form');
    f.reset();
    f.url.value = r.url || '';
    f.querySelector('input[name=section][value="' + (r.section || 'visual') + '"]').checked = true;
    fillCats(r.section || 'visual', r.category);
    f.title.value = r.title || ''; f.published_on.value = r.published_on || '';
    f.client.value = r.client || ''; f.show_client.checked = r.show_client !== false;
    f.querySelectorAll('input[name=roles]').forEach(function (c) { c.checked = (r.roles || []).indexOf(c.value) > -1; });
    f.description.value = r.description || ''; f.thumb_url.value = r.thumb_url || '';
    f.is_featured.checked = !!r.is_featured; f.hidden_.checked = !!r.hidden;
    $('#a-form-h').textContent = r.id ? '작품 수정' : '새 작품 등록';
    $('#a-del').hidden = !r.id; $('#a-del').textContent = '삭제'; $('#a-del').dataset.armed = '';
    $('#a-view').hidden = !r.id || r.hidden;
    if (r.id) $('#a-view').href = '/production/' + (r.section === 'commercial' ? 'commercial-works' : '') + '#work=' + encodeURIComponent(r.slug);
    preview();
  }
  function newItem() { cur = { section: filter === 'commercial' ? 'commercial' : 'visual' }; setForm(cur); renderList(); $('#a-form').url.focus(); }
  function edit(id) { var r = rows.filter(function (x) { return x.id === id; })[0]; if (!r) return; cur = r; setForm(r); renderList(); }

  function preview() {
    var f = $('#a-form'), box = $('#a-thumb'), t = f.thumb_url.value.trim();
    var p = t ? Promise.resolve(t) : autoThumb(f.url.value.trim());
    p.then(function (src) {
      box.innerHTML = src ? '<img src="' + esc(src) + '" alt="썸네일 미리보기">' : '<span>영상 링크를 넣으면 썸네일이 자동으로 나옵니다</span>';
      $('#a-thumb-src').textContent = t ? '직접 올린 썸네일' : (src ? '영상에서 자동' : '');
    });
    $('#f-url-err').textContent = f.url.value.trim() && !parse(f.url.value) ? '유튜브 또는 비메오 주소를 넣어 주세요.' : '';
  }

  function collect() {
    var f = $('#a-form');
    return {
      url: f.url.value.trim(), section: f.querySelector('input[name=section]:checked').value, category: f.category.value,
      title: f.title.value.trim(), published_on: f.published_on.value || null,
      client: f.client.value.trim() || null, show_client: f.show_client.checked,
      roles: [].slice.call(f.querySelectorAll('input[name=roles]:checked')).map(function (c) { return c.value; }),
      description: f.description.value.trim() || null, thumb_url: f.thumb_url.value.trim() || null,
      is_featured: f.is_featured.checked, hidden: f.hidden_.checked
    };
  }

  function bind() {
    $('#a-login-form').addEventListener('submit', function (e) {
      e.preventDefault();
      var em = this.email.value.trim(), b = this.querySelector('button');
      if (!/^[^\s@]+@[^\s@]+\.[A-Za-z]{2,}$/.test(em)) { $('#a-login-msg').textContent = '이메일 형식을 확인해 주세요.'; return; }
      b.disabled = true;
      api.login(em).then(function () { $('#a-login-msg').textContent = em + ' 로 로그인 링크를 보냈어요. 메일의 링크를 누르면 이 화면으로 돌아와 로그인됩니다.'; })
        .catch(function (er) { $('#a-login-msg').textContent = '보내기 실패: ' + (er.message || er); }).then(function () { b.disabled = false; });
    });
    document.querySelectorAll('[data-logout]').forEach(function (b) { b.addEventListener('click', function () { api.logout(); }); });
    $('#a-filter').addEventListener('click', function (e) {
      var b = e.target.closest('button[data-f]'); if (!b) return;
      filter = b.dataset.f; this.querySelectorAll('button').forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); }); renderList();
    });
    $('#a-new').addEventListener('click', newItem);
    var ul = $('#a-list'), drag = null;
    ul.addEventListener('click', function (e) {
      var p = e.target.closest('.a-pick'); if (p) { edit(p.dataset.id); return; }
      var mv = e.target.closest('[data-mv]'); if (!mv) return;
      var li = mv.closest('li'), sib = +mv.dataset.mv < 0 ? li.previousElementSibling : li.nextElementSibling;
      if (!sib) return;
      if (+mv.dataset.mv < 0) ul.insertBefore(li, sib); else ul.insertBefore(sib, li);
      saveOrder();
    });
    ul.addEventListener('dragstart', function (e) { drag = e.target.closest('li[data-id]'); if (drag) { drag.classList.add('dragging'); e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', drag.dataset.id); } });
    ul.addEventListener('dragover', function (e) {
      if (!drag) return; e.preventDefault();
      var over = e.target.closest('li[data-id]'); if (!over || over === drag) return;
      var r = over.getBoundingClientRect(); ul.insertBefore(drag, (e.clientY - r.top) > r.height / 2 ? over.nextSibling : over);
    });
    ul.addEventListener('dragend', function () { if (drag) { drag.classList.remove('dragging'); drag = null; saveOrder(); } });

    var f = $('#a-form');
    f.url.addEventListener('input', preview); f.thumb_url.addEventListener('input', preview);
    f.querySelectorAll('input[name=section]').forEach(function (r) { r.addEventListener('change', function () { fillCats(r.value); }); });
    $('#f-file').addEventListener('change', function () {
      var file = this.files[0]; if (!file) return;
      if (!/^image\//.test(file.type) || file.size > 3 * 1024 * 1024) { msg('3MB 이하 이미지만 올릴 수 있어요.', true); this.value = ''; return; }
      msg('썸네일 올리는 중…');
      api.upload(file).then(function (u) { f.thumb_url.value = u; preview(); msg('썸네일을 올렸어요. [저장]을 눌러야 반영됩니다.'); })
        .catch(function (er) { msg('올리기 실패: ' + (er.message || er), true); });
    });
    $('#f-thumb-clear').addEventListener('click', function () { f.thumb_url.value = ''; $('#f-file').value = ''; preview(); });
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var d = collect();
      if (!parse(d.url)) { msg('유튜브 또는 비메오 주소를 넣어 주세요.', true); f.url.focus(); return; }
      if (!d.title) { msg('제목을 넣어 주세요.', true); f.title.focus(); return; }
      if (d.is_featured && d.section !== 'visual') { msg('대표 영상은 VISUAL WORKS 작품만 지정할 수 있어요.', true); return; }
      if (cur && cur.id) d.id = cur.id;
      else d.sort_order = rows.filter(function (r) { return r.section === d.section; }).reduce(function (m, r) { return Math.max(m, r.sort_order + 1); }, 0);
      var btn = f.querySelector('.a-save'); btn.disabled = true;
      (d.is_featured ? api.clearFeatured(d.id) : Promise.resolve())   /* 대표는 1개만 */
        .then(function () { return api.save(d); })
        .then(function (r) { cur = r; msg('저장했어요. 사이트에 바로 반영됩니다.'); return load(r.id); })
        .catch(function (er) { msg('저장 실패: ' + (er.message || er), true); })
        .then(function () { btn.disabled = false; });
    });
    $('#a-del').addEventListener('click', function () {
      var b = this;
      if (!b.dataset.armed) { b.dataset.armed = '1'; b.textContent = '한 번 더 누르면 삭제'; setTimeout(function () { b.dataset.armed = ''; b.textContent = '삭제'; }, 4000); return; }
      api.remove(cur.id).then(function () { msg('삭제했어요.'); cur = null; return load(); }).catch(function (er) { msg('삭제 실패: ' + (er.message || er), true); });
    });
  }
  function saveOrder() {
    var ids = [].slice.call(document.querySelectorAll('#a-list li[data-id]')).map(function (li) { return li.dataset.id; });
    var pairs = ids.map(function (id, i) { return [id, i]; });
    api.setOrder(pairs).then(function () { pairs.forEach(function (p) { rows.forEach(function (r) { if (r.id === p[0]) r.sort_order = p[1]; }); }); msg('순서를 저장했어요. 사이트 순서도 그대로 바뀝니다.'); })
      .catch(function (er) { msg('순서 저장 실패: ' + (er.message || er), true); load(); });
  }

  /* 역할 체크박스 */
  $('#f-roles').innerHTML = ROLES.map(function (r) { return '<label class="a-chip"><input type="checkbox" name="roles" value="' + r + '"><span>' + r + '</span></label>'; }).join('');
  bind(); bindSettings();
  if (mock) document.documentElement.classList.add('a-mock');
  api.onAuth(boot);
  api.session().then(boot);
})();
