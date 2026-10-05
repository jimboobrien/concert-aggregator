import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { shouldFillMissingVenueUrl } from './venue-url.ts';

describe('shouldFillMissingVenueUrl', () => {
  it('fills only when the stored URL is missing', () => {
    assert.equal(shouldFillMissingVenueUrl(null), true);
    assert.equal(shouldFillMissingVenueUrl(undefined), true);
    assert.equal(shouldFillMissingVenueUrl(''), true);
    assert.equal(shouldFillMissingVenueUrl('   '), true);
  });

  it('never overwrites an existing canonical URL', () => {
    assert.equal(
      shouldFillMissingVenueUrl('https://thecaverns.com/shows'),
      false
    );
    assert.equal(
      shouldFillMissingVenueUrl('https://thecaverns.com/attacker-path'),
      false
    );
  });
});
