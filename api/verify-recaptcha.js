const DEFAULT_ALLOWED_HOSTNAMES = ['cubic-battle-site.vercel.app'];
const RECAPTCHA_VERIFY_URL = 'https://www.google.com/recaptcha/api/siteverify';
const MAX_TOKEN_LENGTH = 8192;
const VERIFY_TIMEOUT_MS = 8000;

function sendJson(res, status, payload) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  return res.status(status).json(payload);
}

function parseRequestBody(body) {
  if (Buffer.isBuffer(body)) body = body.toString('utf8');
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch {
      return null;
    }
  }
  return body && typeof body === 'object' && !Array.isArray(body) ? body : null;
}

function allowedHostnames() {
  const configured = process.env.RECAPTCHA_ALLOWED_HOSTNAMES;
  const hostnames = configured
    ? configured.split(',')
    : DEFAULT_ALLOWED_HOSTNAMES;

  return hostnames
    .map(hostname => hostname.trim().toLowerCase().replace(/\.$/, ''))
    .filter(Boolean);
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return sendJson(res, 405, { verified: false, error: 'METHOD_NOT_ALLOWED' });
  }

  const contentType = req.headers['content-type'] || '';
  if (!/^application\/json(?:\s*;|$)/i.test(contentType)) {
    return sendJson(res, 415, { verified: false, error: 'JSON_REQUIRED' });
  }

  const contentLength = Number(req.headers['content-length'] || 0);
  if (Number.isFinite(contentLength) && contentLength > MAX_TOKEN_LENGTH + 256) {
    return sendJson(res, 413, { verified: false, error: 'REQUEST_TOO_LARGE' });
  }

  const body = parseRequestBody(req.body);
  const token = typeof body?.token === 'string' ? body.token.trim() : '';
  if (!token || token.length > MAX_TOKEN_LENGTH) {
    return sendJson(res, 400, { verified: false, error: 'INVALID_TOKEN' });
  }

  const secret = process.env.RECAPTCHA_SECRET_KEY;
  if (!secret) {
    return sendJson(res, 500, { verified: false, error: 'CAPTCHA_NOT_CONFIGURED' });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), VERIFY_TIMEOUT_MS);

  try {
    const verificationResponse = await fetch(RECAPTCHA_VERIFY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ secret, response: token }),
      signal: controller.signal,
    });

    if (!verificationResponse.ok) {
      return sendJson(res, 502, { verified: false, error: 'CAPTCHA_SERVICE_UNAVAILABLE' });
    }

    const result = await verificationResponse.json();
    if (result.success !== true) {
      const errorCodes = Array.isArray(result['error-codes']) ? result['error-codes'] : [];
      if (errorCodes.some(code => ['invalid-input-secret', 'missing-input-secret', 'bad-request'].includes(code))) {
        return sendJson(res, 502, { verified: false, error: 'CAPTCHA_SERVICE_UNAVAILABLE' });
      }
      return sendJson(res, 403, { verified: false, error: 'CAPTCHA_FAILED' });
    }

    const hostname = typeof result.hostname === 'string'
      ? result.hostname.toLowerCase().replace(/\.$/, '')
      : '';
    if (!allowedHostnames().includes(hostname)) {
      return sendJson(res, 403, { verified: false, error: 'CAPTCHA_HOSTNAME_MISMATCH' });
    }

    return sendJson(res, 200, { verified: true });
  } catch {
    return sendJson(res, 502, { verified: false, error: 'CAPTCHA_SERVICE_UNAVAILABLE' });
  } finally {
    clearTimeout(timeout);
  }
};
