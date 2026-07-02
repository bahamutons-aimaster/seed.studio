// netlify/functions/_utils.js
const crypto = require('crypto');

const SESSION_COOKIE = 'rezz_admin_session';

function verifyToken(token, secret) {
  if (!token || !token.includes('.')) return false;
  const [ts, sig] = token.split('.');
  const expected = crypto.createHmac('sha256', secret).update(ts).digest('hex');
  if (sig !== expected) return false;
  const age = Date.now() - parseInt(ts, 10);
  return age >= 0 && age < 7 * 24 * 60 * 60 * 1000;
}

function isAuthed(event) {
  const secret = process.env.ADMIN_SESSION_SECRET || 'change-this-secret-in-netlify-env';
  const cookie = event.headers.cookie || '';
  const match = cookie.match(new RegExp(`${SESSION_COOKIE}=([^;]+)`));
  const token = match ? match[1] : null;
  return verifyToken(token, secret);
}

module.exports = { isAuthed, SESSION_COOKIE };
