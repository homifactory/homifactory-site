/* SNP COMPANY — 모바일 메뉴 + 크리에이터 지원서
   접수: 메일(FormSubmit) + 접수 기록 시트(Make) + 통합 관리자 크리에이터 DB(Supabase com_creator_apply)
   셋 중 하나라도 성공하면 접수 완료로 처리 */
(function () {
  /* 모바일 메뉴 */
  var bg = document.querySelector('.burger'), mn = document.getElementById('mnav');
  if (bg && mn) {
    bg.addEventListener('click', function () {
      var o = bg.getAttribute('aria-expanded') === 'true';
      bg.setAttribute('aria-expanded', String(!o)); mn.hidden = o;
    });
    mn.addEventListener('click', function (e) { if (e.target.tagName === 'A') { bg.setAttribute('aria-expanded', 'false'); mn.hidden = true; } });
  }

  var form = document.getElementById('snpForm');
  if (!form) return;
  var MAIL = 'https://formsubmit.co/ajax/support@homifactory.com';
  var STORE = 'https://hook.us2.make.com/ygeoee1dy78ed05ce2ifrddovcs62sfh';
  var SB = 'https://bcngbtwzuqtwtxaebftf.supabase.co/rest/v1/rpc/com_creator_apply';
  var KEY = 'sb_publishable_4f1Mbi136Y8iuHSk-xub8A_43uK3Wiy';
  var MSG = { req: '필수 항목이에요. 내용을 입력해 주세요.', pick: '하나를 골라 주세요.', url: '링크 형식을 확인해 주세요. (https://로 시작)', tel: '연락처를 숫자로 입력해 주세요.', mail: '이메일 형식을 확인해 주세요.', agree: '개인정보 수집·이용에 동의해 주셔야 보낼 수 있어요.', fail: '전송에 실패했어요. 잠시 후 다시 시도하거나 010-9873-4339로 연락 주세요.' };

  function g(n) { var el = form.elements[n]; return el ? (el.value || '').trim() : ''; }
  function multi(n) { return [].slice.call(form.querySelectorAll('input[name="' + n + '"]:checked')).map(function (i) { return i.value; }).join(', '); }
  function radio(n) { var c = form.querySelector('input[name="' + n + '"]:checked'); return c ? c.value : ''; }
  function clear() {
    form.querySelectorAll('.err').forEach(function (e) { e.remove(); });
    form.querySelectorAll('.bad').forEach(function (e) { e.classList.remove('bad'); });
  }
  function mark(box, msg) {
    box.classList.add('bad');
    var p = document.createElement('p'); p.className = 'err'; p.textContent = msg; box.appendChild(p);
  }

  /* 고르면 바로 오류 지우기 */
  form.addEventListener('change', function (e) {
    var box = e.target.closest('.bad'); if (!box) return;
    box.classList.remove('bad'); var er = box.querySelector('.err'); if (er) er.remove();
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault(); clear();
    var topErr = form.querySelector('.f-err'); topErr.hidden = true;
    if (g('_honey')) return;
    var first = null, add = function (box, msg) { mark(box, msg); if (!first) first = box; };

    form.querySelectorAll('input[required]:not([type=checkbox]),select[required],textarea[required]').forEach(function (el) {
      if (!el.value.trim()) add(el.closest('.fld'), MSG.req);
    });
    var link = form.elements['채널 링크'];
    if (link.value.trim() && !/^https?:\/\/\S+\.\S+/.test(link.value.trim())) add(link.closest('.fld'), MSG.url);
    var tel = form.elements['연락처'];
    if (tel.value.trim() && tel.value.replace(/[^0-9]/g, '').length < 9) add(tel.closest('.fld'), MSG.tel);
    var em = form.elements['이메일'];
    if (em.value.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em.value.trim())) add(em.closest('.fld'), MSG.mail);
    var grp = form.querySelector('[data-req-group]');
    if (!radio('라이브 경험')) add(grp, MSG.pick);
    var ag = form.elements['개인정보 동의'];
    if (!ag.checked) add(ag.closest('.agree'), MSG.agree);

    if (first) {
      first.scrollIntoView({ behavior: 'smooth', block: 'center' });
      var f = first.querySelector('input,select,textarea'); if (f) f.focus({ preventScroll: true });
      return;
    }

    var handle = g('활동명').replace(/^@?/, '@');
    var mail = {
      _subject: '[SNP 크리에이터 지원] ' + handle, _template: 'table', _captcha: 'false',
      _cc: 'hosung@homifactory.com',
      '틱톡 아이디': handle, '채널 링크': g('채널 링크'), '팔로워 규모': g('팔로워 규모'), '활동 나라': g('활동 나라'),
      '라이브 경험': radio('라이브 경험'), '방송 장르': multi('장르'), '방송 가능 시간': g('방송 가능 시간'),
      '이름': g('이름'), '연락처': g('연락처'), '이메일': g('이메일'), '하고 싶은 말': g('하고 싶은 말'),
      '개인정보 동의': '동의', '접수 페이지': location.href.split('?')[0].split('#')[0]
    };
    var row = {
      lang: 'KR', brand: '[SNP 크리에이터] ' + handle, link: mail['채널 링크'], dir: '[SNP] 틱톡 라이브 지원',
      countries: mail['활동 나라'], channel: '틱톡 · ' + mail['팔로워 규모'], concern: mail['라이브 경험'] + (mail['방송 장르'] ? ' / ' + mail['방송 장르'] : ''),
      goal: mail['하고 싶은 말'], timing: mail['방송 가능 시간'], budget: '',
      name: mail['이름'], phone: mail['연락처'], email: mail['이메일'], page: mail['접수 페이지'], hp: ''
    };
    var btn = form.querySelector('button[type=submit]'), label = btn.innerHTML;
    btn.disabled = true; btn.textContent = '보내는 중…';

    var post = function (u, b, h) {
      return fetch(u, { method: 'POST', headers: Object.assign({ 'Content-Type': 'application/json', 'Accept': 'application/json' }, h || {}), body: JSON.stringify(b) })
        .then(function (r) { if (!r.ok) throw new Error(r.status); return r; });
    };
    var a = post(MAIL, mail).then(function (r) { return r.json(); }).then(function (j) { if (j && (j.success === false || j.success === 'false')) throw new Error('mail'); return true; });
    var s = post(STORE, row).then(function () { return true; });
    var d = post(SB, { p: {
      handle: handle, channel_url: mail['채널 링크'], platforms: ['틱톡'], followers: mail['팔로워 규모'] || null, country: mail['활동 나라'] || null,
      categories: ['SNP 틱톡 라이브'].concat(mail['방송 장르'] ? mail['방송 장르'].split(', ') : []),
      intro: ['라이브 경험: ' + mail['라이브 경험'], mail['방송 가능 시간'] ? '방송 가능: ' + mail['방송 가능 시간'] : '', mail['하고 싶은 말']].filter(Boolean).join(' / '),
      name: mail['이름'], phone: mail['연락처'], email: mail['이메일'] || null, lang: 'KR'
    } }, { apikey: KEY, Prefer: 'return=minimal' }).then(function () { return true; });

    Promise.allSettled([a, s, d]).then(function (rs) {
      if (rs.some(function (x) { return x.status === 'fulfilled'; })) {
        form.hidden = true;
        var done = document.getElementById('snpDone'); done.hidden = false; done.focus();
      } else {
        btn.disabled = false; btn.innerHTML = label; topErr.textContent = MSG.fail; topErr.hidden = false;
      }
    });
  });
})();
