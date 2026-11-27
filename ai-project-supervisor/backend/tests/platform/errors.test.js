import { test } from 'node:test';
import assert from 'node:assert/strict';
import { AppError } from '../../src/shared/errors/AppError.js';
import { ErrorCodes, ErrorStatus } from '../../src/shared/errors/errorCodes.js';
import { asyncHandler } from '../../src/shared/utils/asyncHandler.js';

test('AppError maps its code to the HTTP status', () => {
  const error = new AppError(ErrorCodes.NOT_FOUND, 'missing');
  assert.equal(error.status, 404);
  assert.equal(error.code, ErrorCodes.NOT_FOUND);
  assert.equal(error.message, 'missing');
});

test('AppError falls back to 500 for an unknown code', () => {
  assert.equal(new AppError('SOMETHING_NEW', 'x').status, 500);
});

test('AppError keeps details and the original cause', () => {
  const cause = new Error('db down');
  const error = new AppError(ErrorCodes.AI_SERVICE_UNAVAILABLE, 'ai down', {
    details: { retryable: true },
    cause
  });
  assert.equal(error.cause, cause);
  assert.deepEqual(error.details, { retryable: true });
});

test('every error code has a status', () => {
  for (const code of Object.values(ErrorCodes)) {
    assert.ok(Number.isInteger(ErrorStatus[code]), `${code} has no status`);
  }
});

test('asyncHandler forwards rejected promises to next', async () => {
  const failure = new Error('boom');
  let received;
  const handler = asyncHandler(async () => {
    throw failure;
  });
  handler({}, {}, (err) => {
    received = err;
  });
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(received, failure);
});

test('asyncHandler forwards synchronous throws to next', async () => {
  const failure = new Error('sync boom');
  let received;
  const handler = asyncHandler(() => {
    throw failure;
  });
  handler({}, {}, (err) => {
    received = err;
  });
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(received, failure);
});
