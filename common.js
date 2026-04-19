/* ========= 호미팩토리 공통 JS ========= */
/* v1 · 2026-04-19 */

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

  /* ── SCROLL REVEAL ── */
  const ro = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('visible'); ro.unobserve(e.target); }
  }), { threshold: 0.08 });
  document.querySelectorAll('.reveal').forEach(el => ro.observe(el));

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
