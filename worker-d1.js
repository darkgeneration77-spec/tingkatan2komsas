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
    return env.ASSETS.fetch(request);
  }
};
function normalize(r){return {id:r.id,student:r.student,kelas:r.kelas,type:r.type,work:r.work,file:r.file,correct:r.correct_count,total:r.total_count,percent:r.percent,wrong:JSON.parse(r.wrong_json||'[]'),skills:JSON.parse(r.skills_json||'{}'),ts:r.ts}}