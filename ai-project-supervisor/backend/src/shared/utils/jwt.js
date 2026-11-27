import { createHmac, timingSafeEqual } from 'node:crypto';

const HEADER = Object.freeze({ alg: 'HS256', typ: 'JWT' });
const ENCODED_HEADER = Buffer.from(JSON.stringify(HEADER)).toString('base64url');

export class JwtError extends Error {
  constructor(reason, message) {
    super(message ?? reason);
    this.name = 'JwtError';
    this.reason = reason;
  }
}

function sign(input, secret) {
  return createHmac('sha256', secret).update(input).digest();
}

export function signJwt(payload, secret, { expiresInSeconds, now = Date.now() }) {
  if (!secret) throw new TypeError('A signing secret is required');
  if (!(expiresInSeconds > 0)) throw new TypeError('expiresInSeconds must be positive');

  const issuedAt = Math.floor(now / 1000);
  const body = { ...payload, iat: issuedAt, exp: issuedAt + Math.floor(expiresInSeconds) };
  const encodedBody = Buffer.from(JSON.stringify(body)).toString('base64url');
  const signingInput = `${ENCODED_HEADER}.${encodedBody}`;
  return `${signingInput}.${sign(signingInput, secret).toString('base64url')}`;
}

export function verifyJwt(token, secret, { now = Date.now() } = {}) {
  if (typeof token !== 'string') throw new JwtError('malformed');

  const parts = token.split('.');
  if (parts.length !== 3) throw new JwtError('malformed');

  const [encodedHeader, encodedBody, encodedSignature] = parts;
  if (encodedHeader !== ENCODED_HEADER) throw new JwtError('unsupported_algorithm');

  const expected = sign(`${encodedHeader}.${encodedBody}`, secret);
  const provided = Buffer.from(encodedSignature, 'base64url');
  if (provided.length !== expected.length || !timingSafeEqual(provided, expected)) {
    throw new JwtError('bad_signature');
  }

  let payload;
  try {
    payload = JSON.parse(Buffer.from(encodedBody, 'base64url').toString('utf8'));
  } catch {
    throw new JwtError('malformed');
  }

  if (payload === null || typeof payload !== 'object' || !Number.isFinite(payload.exp)) {
    throw new JwtError('malformed');
  }

  if (payload.exp <= Math.floor(now / 1000)) throw new JwtError('expired');

  return payload;
}
