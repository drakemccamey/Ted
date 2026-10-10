const JSON_HEADERS = {
  'Content-Type': 'application/json; charset=utf-8',
  'Cache-Control': 'no-store'
};
const TOP_DOGS_LIMIT = 5;
const MAX_SCORE = 999999;
const MAX_SUBMISSION_BYTES = 512;

const corsHeaders = (origin) => ({
  'Access-Control-Allow-Origin': origin,
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Accept',
  'Access-Control-Max-Age': '86400',
  Vary: 'Origin'
});

const jsonResponse = (body, status, origin) => new Response(JSON.stringify(body), {
  status,
  headers: {
    ...JSON_HEADERS,
    ...corsHeaders(origin)
  }
});

const isValidNickname = (nickname) => typeof nickname === 'string' &&
  nickname.trim().length > 0 &&
  [...nickname.trim()].length <= 24 &&
  !/[\u0000-\u001f\u007f]/u.test(nickname);

const getTopScores = async (db) => {
  const result = await db.prepare(
    'SELECT nickname, score FROM scores ORDER BY score DESC, created_at ASC, id ASC LIMIT 5'
  ).all();
  return result.results;
};

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin');
    if (!origin || origin !== env.ALLOWED_ORIGIN) {
      return new Response('Forbidden', { status: 403 });
    }

    const url = new URL(request.url);
    if (url.pathname !== '/scores') {
      return jsonResponse({ error: 'Not found.' }, 404, origin);
    }
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders(origin) });
    }
    if (request.method !== 'GET' && request.method !== 'POST') {
      return jsonResponse({ error: 'Method not allowed.' }, 405, origin);
    }

    try {
      if (request.method === 'GET') {
        return jsonResponse({ entries: await getTopScores(env.DB) }, 200, origin);
      }

      const contentType = request.headers.get('Content-Type')?.split(';', 1)[0].trim().toLowerCase();
      if (contentType !== 'application/json') {
        return jsonResponse({ error: 'Content-Type must be application/json.' }, 415, origin);
      }

      const contentLength = Number(request.headers.get('Content-Length'));
      if (Number.isFinite(contentLength) && contentLength > MAX_SUBMISSION_BYTES) {
        return jsonResponse({ error: 'Submission is too large.' }, 413, origin);
      }

      const requestBody = await request.text();
      if (new TextEncoder().encode(requestBody).byteLength > MAX_SUBMISSION_BYTES) {
        return jsonResponse({ error: 'Submission is too large.' }, 413, origin);
      }

      let submission;
      try {
        submission = JSON.parse(requestBody);
      } catch {
        return jsonResponse({ error: 'Request body must be valid JSON.' }, 400, origin);
      }

      if (!submission || typeof submission !== 'object' || Array.isArray(submission) ||
          !isValidNickname(submission.nickname)) {
        return jsonResponse({ error: 'Nickname must be 1 to 24 characters.' }, 400, origin);
      }
      if (!Number.isSafeInteger(submission.score) || submission.score < 1 || submission.score > MAX_SCORE) {
        return jsonResponse({ error: `Score must be a whole number from 1 to ${MAX_SCORE}.` }, 400, origin);
      }

      const nickname = submission.nickname.trim();
      const results = await env.DB.batch([
        env.DB.prepare(
          `INSERT INTO scores (nickname, score)
           SELECT ?, ?
           WHERE (SELECT COUNT(*) FROM scores) < ?
              OR ? > (SELECT score FROM scores ORDER BY score ASC, created_at DESC, id DESC LIMIT 1)`
        ).bind(nickname, submission.score, TOP_DOGS_LIMIT, submission.score),
        env.DB.prepare(
          `DELETE FROM scores
           WHERE id NOT IN (
             SELECT id FROM scores ORDER BY score DESC, created_at ASC, id ASC LIMIT ?
           )`
        ).bind(TOP_DOGS_LIMIT),
        env.DB.prepare(
          'SELECT nickname, score FROM scores ORDER BY score DESC, created_at ASC, id ASC LIMIT 5'
        )
      ]);
      const entries = results[2].results;
      if (results[0].meta.changes === 0) {
        return jsonResponse({ error: 'That score no longer makes the top five.', entries }, 409, origin);
      }
      return jsonResponse({ entries }, 201, origin);
    } catch (error) {
      console.error('Ted’s Top Dogs request failed:', error);
      return jsonResponse({ error: 'The leaderboard could not complete that request.' }, 500, origin);
    }
  }
};
