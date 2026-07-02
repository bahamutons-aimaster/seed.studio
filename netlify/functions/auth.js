// netlify/functions/auth.js
// Simple password-based auth for the admin panel.
// Sets an HttpOnly cookie session on successful login.

const crypto = require('crypto');

const SESSION_COOKIE = 'rezz_admin_session';

function makeToken(secret) {
  const ts = Date.now().toString();
  const sig = crypto.createHmac('sha256', secret).update(ts).digest('hex');
  return `${ts}.${sig}`;
}

function verifyToken(token, secret) {
  if (!token || !token.includes('.')) return false;
  const [ts, sig] = token.split('.');
  const expected = crypto.createHmac('sha256', secret).update(ts).digest('hex');
  if (sig !== expected) return false;
  // Session valid for 7 days
  const age = Date.now() - parseInt(ts, 10);
  return age >= 0 && age < 7 * 24 * 60 * 60 * 1000;
}

exports.handler = async (event) => {
  const secret = process.env.ADMIN_SESSION_SECRET || 'change-this-secret-in-netlify-env';
  const adminPassword = process.env.ADMIN_PASSWORD || 'rezzvze2026';

  if (event.httpMethod === 'POST') {
    try {
      const body = JSON.parse(event.body || '{}');
      if (body.password === adminPassword) {
        const token = makeToken(secret);
        return {
          statusCode: 200,
          headers: {
            'Set-Cookie': `${SESSION_COOKIE}=${token}; HttpOnly; Path=/; Max-Age=${7 * 24 * 60 * 60}; SameSite=Strict; Secure`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ ok: true }),
        };
      }
      return { statusCode: 401, body: JSON.stringify({ ok: false, error: 'Password salah.' }) };
    } catch (e) {
      return { statusCode: 400, body: JSON.stringify({ ok: false, error: 'Bad request' }) };
    }
  }

  if (event.httpMethod === 'GET') {
    const cookie = event.headers.cookie || '';
    const match = cookie.match(new RegExp(`${SESSION_COOKIE}=([^;]+)`));
    const token = match ? match[1] : null;
    const valid = verifyToken(token, secret);
    return {
      statusCode: 200,
      body: JSON.stringify({ authed: valid }),
    };
  }

  if (event.httpMethod === 'DELETE') {
    return {
      statusCode: 200,
      headers: {
        'Set-Cookie': `${SESSION_COOKIE}=; HttpOnly; Path=/; Max-Age=0; SameSite=Strict; Secure`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ok: true }),
    };
  }

  return { statusCode: 405, body: 'Method not allowed' };
};

module.exports.SESSION_COOKIE = SESSION_COOKIE;
module.exports.verifyToken = verifyToken;
