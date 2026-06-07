/* ========= 호미팩토리 공통 JS ========= */
/* v4 · 2026-06-07 — Sprint 11 reveal fix (inline !important + safety net) */

(function(){
  /* ── CUSTOM CURSOR ── */
  const cursor = document.getElementById('cursor');
  const ring = document.getElementById('cursor-ring');
  if (cursor && ring) {
    let mx = 0, my = 0, rx = 0, ry = 0;
    document.addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; });
    (function animate(){
      cursor.style.left = mx + 'px'; cursor.style.top = my + 'px';
      rx += (mx - rx) * 0.12; ry += (my - ry) * 0.12;
      ring.style.left = rx + 'px'; ring.style.top = ry + 'px';
      requestAnimationFrame(animate);
    })();
    document.querySelectorAll('a, button, .faq-q').forEach(el => {
      el.addEventListener('mouseenter', () => document.body.classList.add('cursor-expand'));
      el.addEventListener('mouseleave', () => document.body.classList.remove('cursor-expand'));
    });
  }

  /* ── SCROLL PROGRESS ── */
  const bar = document.getElementById('progress-bar');
  if (bar) {
    window.addEventListener('scroll', () => {
      const d = document.documentElement;
      const pct = (d.scrollTop / (d.scrollHeight - d.clientHeight)) * 100;
      bar.style.width = pct + '%';
    });
  }

  /* ── HAMBURGER ── */
  const hbg = document.getElementById('hamburger');
  const mnav = document.getElementById('mobileNav');
  if (hbg && mnav) {
    hbg.addEventListener('click', () => {
      hbg.classList.toggle('open');
      mnav.classList.toggle('open');
    });
  }

  /* ── SCROLL REVEAL ── (Sprint 11 fix: inline + !important로 specificity override 강제) */
  function revealEl(el){
    el.classList.add('visible');
    el.style.setProperty('opacity', '1', 'important');
    el.style.setProperty('transform', 'none', 'important');
  }
  const ro = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { revealEl(e.target); ro.unobserve(e.target); }
  }), { threshold: 0.08, rootMargin: '0px 0px -50px 0px' });
  document.querySelectorAll('.reveal').forEach(el => ro.observe(el));
  // SAFETY NET — 1.5s 후 viewport 근처 reveal 강제 표시 (IO 미작동 대비)
  setTimeout(function(){
    document.querySelectorAll('.reveal:not(.visible)').forEach(function(el){
      var rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight + 200) revealEl(el);
    });
  }, 1500);

  /* ── COUNTER ── */
  function runCounter(el) {
    const target = parseInt(el.dataset.target, 10);
    const dur = 1800, start = performance.now();
    const tick = now => {
      const p = Math.min((now - start) / dur, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.floor(ease * target).toLocaleString();
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }
  const co = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { runCounter(e.target); co.unobserve(e.target); }
  }), { threshold: 0.5 });
  document.querySelectorAll('.counter').forEach(el => co.observe(el));

  /* ── MAGNET BUTTONS ── */
  document.querySelectorAll('.form-submit, .nav-cta, .modal-cta, .btn-primary').forEach(btn => {
    btn.addEventListener('mousemove', e => {
      const r = btn.getBoundingClientRect();
      const x = (e.clientX - r.left - r.width/2) * 0.18;
      const y = (e.clientY - r.top - r.height/2) * 0.18;
      btn.style.transform = `translate(${x}px, ${y}px)`;
    });
    btn.addEventListener('mouseleave', () => { btn.style.transform = ''; });
  });
})();

/* ── ADMIN LOGIN CORNER BUTTON ──
   상단 nav에서 '로그인' 항목을 제거하고, 우측 하단에 작고 은은한
   '관리자 로그인' 버튼을 모든 일반 페이지에 자동 주입.
   admin.html / login.html에서는 주입하지 않음. */
(function(){
  var path = location.pathname || '';
  if (/login\.html|admin\.html|\/login$|\/admin$/.test(path)) return;
  function inject(){
    if (document.querySelector('.admin-login-corner')) return;
    var btn = document.createElement('a');
    btn.href = 'login.html';
    btn.className = 'admin-login-corner';
    btn.textContent = '관리자 로그인';
    btn.setAttribute('aria-label', '관리자 로그인');
    btn.style.cssText = [
      'position:fixed',
      'right:14px',
      'bottom:14px',
      'z-index:1000',
      'padding:6px 11px',
      'font-size:11px',
      'font-weight:500',
      'color:rgba(0,0,0,0.42)',
      'background:rgba(255,255,255,0.7)',
      'border:1px solid rgba(0,0,0,0.06)',
      'border-radius:14px',
      'text-decoration:none',
      'backdrop-filter:blur(6px)',
      '-webkit-backdrop-filter:blur(6px)',
      'transition:opacity 0.2s ease, color 0.2s ease, transform 0.2s ease',
      'opacity:0.5',
      'letter-spacing:-0.01em',
      'box-shadow:0 1px 4px rgba(0,0,0,0.04)'
    ].join(';');
    btn.addEventListener('mouseenter', function(){
      btn.style.opacity = '1';
      btn.style.color = 'var(--pink, #fd0151)';
      btn.style.transform = 'translateY(-1px)';
    });
    btn.addEventListener('mouseleave', function(){
      btn.style.opacity = '0.5';
      btn.style.color = 'rgba(0,0,0,0.42)';
      btn.style.transform = '';
    });
    document.body.appendChild(btn);
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inject);
  } else {
    inject();
  }
})();

/* ── TRAFFIC LOGGING (Sprint 10) ──
   페이지 로드 → page_views 1건 insert (세션 중복 방지)
   CTA 클릭 → cta_clicks insert
   admin/login/봇 제외. */
(function(){
  var path = location.pathname || '/';
  if (/login\.html|admin\.html|\/login$|\/admin$/.test(path)) return;
  var ua = navigator.userAgent || '';
  if (/bot|crawler|spider|preview|lighthouse|headless|pingdom/i.test(ua)) return;

  var SB_URL = 'https://bcngbtwzuqtwtxaebftf.supabase.co';
  var SB_KEY = 'sb_publishable_4f1Mbi136Y8iuHSk-xub8A_43uK3Wiy';
  var device = /mobile|android|iphone|ipad/i.test(ua) ? 'mobile' : 'desktop';
  var lang = (navigator.language || '').slice(0, 8);

  function sbRpc(fnName, args){
    try {
      fetch(SB_URL + '/rest/v1/rpc/' + fnName, {
        method: 'POST',
        headers: {
          'apikey': SB_KEY,
          'Authorization': 'Bearer ' + SB_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(args),
        keepalive: true
      }).catch(function(){});
    } catch(e){}
  }

  function logPageView(){
    var key = 'pv_' + path;
    try { if (sessionStorage.getItem(key)) return; sessionStorage.setItem(key, '1'); } catch(e){}
    sbRpc('log_page_view', {
      p_path: path,
      p_referrer: document.referrer || null,
      p_user_agent: ua.slice(0, 200),
      p_device: device,
      p_language: lang
    });
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', logPageView);
  } else {
    logPageView();
  }

  document.addEventListener('click', function(e){
    var t = e.target;
    if (!t || !t.closest) return;
    var cta = t.closest('.nav-cta, .hero-main-cta, .hero-cta-ghost, .dept-panel-cta, .modal-cta, .form-submit, .ref-card, .blog-card, [data-cta]');
    if (!cta) return;
    var label = (cta.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 80);
    var ctaId = cta.dataset.cta || cta.id ||
      (cta.className || '').split(/\s+/).filter(function(c){
        return /hero-main-cta|nav-cta|dept-panel-cta|modal-cta|form-submit|ref-card|blog-card|hero-cta-ghost/.test(c);
      })[0] || 'unknown';
    sbRpc('log_cta_click', { p_path: path, p_cta_id: ctaId, p_cta_label: label });
  }, true);
})();
