import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'postgresql://postgres:postgres@localhost:5432/pet_adoption_test';
process.env.JWT_SECRET = 'test-secret-at-least-16-chars';
process.env.JWT_EXPIRES_IN = '7d';
process.env.ALLOWED_ORIGINS = 'http://localhost:5173';

const {
  ACCESS_COOKIE,
  REFRESH_COOKIE,
  clearAuthCookies,
  getCookie,
  parseDurationMs,
  setAuthCookies,
} = await import('../src/services/sessionService.js');

describe('sessionService (httpOnly cookie sessions, no database required)', () => {
  it('parses duration strings into milliseconds', () => {
    assert.equal(parseDurationMs('500ms'), 500);
    assert.equal(parseDurationMs('30s'), 30000);
    assert.equal(parseDurationMs('15m'), 900000);
    assert.equal(parseDurationMs('1h'), 3600000);
    assert.equal(parseDurationMs('7d'), 604800000);
    assert.equal(parseDurationMs('2w'), 1209600000);
  });

  it('rejects malformed durations', () => {
    assert.throws(() => parseDurationMs('forever'), /Invalid duration/);
    assert.throws(() => parseDurationMs(''), /Invalid duration/);
  });

  it('reads cookies from the request header', () => {
    const req = { headers: { cookie: 'paws_at=abc123; paws_rt=def%20456; other=x' } };
    assert.equal(getCookie(req, ACCESS_COOKIE), 'abc123');
    assert.equal(getCookie(req, REFRESH_COOKIE), 'def 456');
    assert.equal(getCookie(req, 'missing'), undefined);
    assert.equal(getCookie({ headers: {} }, ACCESS_COOKIE), undefined);
  });

  it('sets httpOnly session cookies with matching lifetimes', () => {
    const calls = [];
    const res = { cookie: (name, value, opts) => calls.push([name, value, opts]) };
    setAuthCookies(res, { accessToken: 'at', refreshToken: 'rt' });

    assert.equal(calls.length, 2);
    const [[accessName, accessValue, accessOpts], [refreshName, refreshValue, refreshOpts]] = calls;
    assert.equal(accessName, ACCESS_COOKIE);
    assert.equal(accessValue, 'at');
    assert.equal(refreshName, REFRESH_COOKIE);
    assert.equal(refreshValue, 'rt');
    for (const opts of [accessOpts, refreshOpts]) {
      assert.equal(opts.httpOnly, true);
      assert.equal(opts.sameSite, 'lax');
      assert.equal(opts.path, '/');
      // Non-production over plain HTTP must not set Secure or browsers drop it.
      assert.equal(opts.secure, false);
    }
    assert.equal(accessOpts.maxAge, 15 * 60 * 1000);
    assert.equal(refreshOpts.maxAge, 30 * 24 * 60 * 60 * 1000);
  });

  it('clears both session cookies on logout', () => {
    const calls = [];
    const res = { clearCookie: (name, opts) => calls.push([name, opts]) };
    clearAuthCookies(res);
    assert.deepEqual(
      calls.map(([name]) => name).sort(),
      [ACCESS_COOKIE, REFRESH_COOKIE].sort(),
    );
    for (const [, opts] of calls) assert.equal(opts.path, '/');
  });
});
