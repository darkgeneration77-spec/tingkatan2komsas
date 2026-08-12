export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === '/api/track' && request.method === 'POST') {
      const e = await request.json();
      if (!e?.student || !e?.type) return Response.json({ok:false,error:'missing fields'},{status:400});
      await env.DB.prepare(`INSERT INTO events
        (student,kelas,type,work,file,correct_count,total_count,percent,wrong_json,skills_json,ts)
        VALUES (?,?,?,?,?,?,?,?,?,?,?)`)
        .bind(e.student,e.kelas||'',e.type,e.work||'',e.file||'',e.correct??null,e.total??null,e.percent??null,JSON.stringify(e.wrong||[]),JSON.stringify(e.skills||{}),e.ts||new Date().toISOString())
        .run();
      return Response.json({ok:true});
    }

    if (url.pathname === '/api/student' && request.method === 'GET') {
      const name = url.searchParams.get('name') || '';
      const {results=[]} = await env.DB.prepare('SELECT * FROM events WHERE student=? ORDER BY id ASC').bind(name).all();
      return Response.json({events:results.map(normalize)});
    }

    if (url.pathname === '/api/teacher' && request.method === 'GET') {
      const {results=[]} = await env.DB.prepare('SELECT * FROM events ORDER BY id ASC').all();
      return Response.json({events:results.map(normalize)});
    }

    const res = await env.ASSETS.fetch(request);
    const type = res.headers.get('content-type') || '';
    if (!type.includes('text/html')) return res;

    let html = await res.text();
    if (!html.includes('tracking.js')) html = html.replace('</body>','<script src="/tracking.js"></script></body>');

    const isHome = url.pathname === '/' || url.pathname.endsWith('/index.html');

    if (!isHome && !html.includes('id="global-home-button"')) {
      const homeButton = `<a id="global-home-button" href="/" aria-label="Kembali ke halaman utama" style="position:fixed;left:18px;bottom:18px;z-index:10000;text-decoration:none;background:linear-gradient(180deg,#6d9cff,#2f6df6);color:#fff;font:900 14px/1.2 Inter,system-ui,-apple-system,Segoe UI,Arial,sans-serif;padding:12px 16px;border-radius:15px;border:1px solid rgba(255,255,255,.45);box-shadow:0 6px 0 #214fae,0 12px 24px rgba(31,73,160,.28);display:flex;align-items:center;gap:8px;transition:transform .15s ease,box-shadow .15s ease">← Utama / 主页</a><style>#global-home-button:hover{transform:translateY(2px);box-shadow:0 4px 0 #214fae,0 8px 18px rgba(31,73,160,.22)}@media(max-width:640px){#global-home-button{left:12px;bottom:12px;padding:11px 13px;font-size:13px}}</style>`;
      html = html.replace('</body>', homeButton + '</body>');
    }

    if (isHome && !html.includes('student-dashboard.html')) {
      const portal = `<div style="position:fixed;right:18px;bottom:18px;z-index:9999;display:flex;gap:10px;flex-wrap:wrap;justify-content:flex-end">
        <a href="student-dashboard.html" style="text-decoration:none;background:linear-gradient(180deg,#6d9cff,#2f6df6);color:white;font-weight:900;padding:12px 15px;border-radius:14px;box-shadow:0 5px 0 #214fae">Student Dashboard 学生</a>
        <a href="teacher-dashboard.html" style="text-decoration:none;background:linear-gradient(180deg,#8d72ff,#654ee6);color:white;font-weight:900;padding:12px 15px;border-radius:14px;box-shadow:0 5px 0 #4935b1">Teacher Dashboard 老师</a>
      </div>`;
      html = html.replace('</body>', portal + '</body>');
    }

    const headers = new Headers(res.headers);
    headers.set('content-type','text/html; charset=UTF-8');
    headers.delete('content-length');
    return new Response(html,{status:res.status,headers});
  }
};

function normalize(r){
  return {
    id:r.id,student:r.student,kelas:r.kelas,type:r.type,work:r.work,file:r.file,
    correct:r.correct_count,total:r.total_count,percent:r.percent,
    wrong:JSON.parse(r.wrong_json||'[]'),skills:JSON.parse(r.skills_json||'{}'),ts:r.ts
  }
}