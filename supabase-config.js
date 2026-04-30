/* ========= 호미팩토리 — Supabase 설정 ========= */
/* publishable key는 RLS로 보호되므로 브라우저 노출 안전 */

(function () {
  const SUPABASE_URL = 'https://bcngbtwzuqtwtxaebftf.supabase.co';
  const SUPABASE_ANON_KEY = 'sb_publishable_4f1Mbi136Y8iuHSk-xub8A_43uK3Wiy';

  // supabase는 CDN 스크립트가 먼저 로드되어 window.supabase에 노출됨
  if (typeof supabase === 'undefined') {
    console.error('[HOMI] Supabase JS not loaded. Add the CDN script before this file.');
    return;
  }
  const { createClient } = supabase;
  const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: true, autoRefreshToken: true }
  });
  window.HOMI = { sb, SUPABASE_URL, SUPABASE_ANON_KEY };
})();
