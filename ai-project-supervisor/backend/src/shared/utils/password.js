import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';

const COST = 32768;
const BLOCK_SIZE = 8;
const PARALLELISM = 1;
const KEY_LENGTH = 64;
const SALT_LENGTH = 16;
const MAX_MEMORY = 128 * 1024 * 1024;
const PREFIX = 'scrypt';

function derive(password, salt, cost, blockSize, parallelism, keyLength) {
  return new Promise((resolve, reject) => {
    scrypt(
      password,
      salt,
      keyLength,
      { N: cost, r: blockSize, p: parallelism, maxmem: MAX_MEMORY },
      (err, key) => (err ? reject(err) : resolve(key))
    );
  });
}

export async function hashPassword(password) {
  if (typeof password !== 'string' || password.length === 0) {
    throw new TypeError('Password must be a non-empty string');
  }
  const salt = randomBytes(SALT_LENGTH);
  const key = await derive(password, salt, COST, BLOCK_SIZE, PARALLELISM, KEY_LENGTH);
  return [
    PREFIX,
    COST,
    BLOCK_SIZE,
    PARALLELISM,
    salt.toString('base64'),
    key.toString('base64')
  ].join('$');
}

export async function verifyPassword(password, stored) {
  if (typeof password !== 'string' || typeof stored !== 'string') return false;

  const parts = stored.split('$');
  if (parts.length !== 6 || parts[0] !== PREFIX) return false;

  const cost = Number(parts[1]);
  const blockSize = Number(parts[2]);
  const parallelism = Number(parts[3]);
  if (![cost, blockSize, parallelism].every((value) => Number.isInteger(value) && value > 0)) {
    return false;
  }

  const salt = Buffer.from(parts[4], 'base64');
  const expected = Buffer.from(parts[5], 'base64');
  if (salt.length === 0 || expected.length === 0) return false;

  let actual;
  try {
    actual = await derive(password, salt, cost, blockSize, parallelism, expected.length);
  } catch {
    return false;
  }

  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
