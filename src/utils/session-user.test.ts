import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { hasSessionUser } from './session-user.ts';

describe('hasSessionUser', () => {
  it('rejects missing, empty, and malformed users', () => {
    assert.equal(hasSessionUser(null), false);
    assert.equal(hasSessionUser(undefined), false);
    assert.equal(hasSessionUser({}), false);
    assert.equal(hasSessionUser({ id: '' }), false);
  });

  it('accepts a user with a non-empty id', () => {
    assert.equal(hasSessionUser({ id: 'user-1' }), true);
  });
});
