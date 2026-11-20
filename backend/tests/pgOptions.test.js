import { test } from 'node:test';
import assert from 'node:assert/strict';
import { assertDatabaseUrl, buildPgConfig, migrationDatabaseUrl } from '../src/config/pgOptions.js';
const pooled = 'postgresql://postgres.example:password@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres';
test('accepts Supabase session pooler and preserves migration endpoint', () => {
  assert.equal(assertDatabaseUrl(pooled).pathname, '/postgres');
  assert.equal(migrationDatabaseUrl(pooled), pooled);
});
test('rejects unsupported providers and direct hosts', () => {
  for (const value of ['invalid', 'postgresql://owner:password@ep-example.neon.tech/neondb', 'postgresql://postgres:password@db.example.supabase.co:5432/postgres']) {
    assert.throws(() => assertDatabaseUrl(value), /Supabase|IPv6/);
  }
});
test('uses encrypted Supabase connections with bounded pooling', () => {
  const config = buildPgConfig(pooled);
  assert.ok(config.ssl);
  assert.equal(config.connectionTimeoutMillis, 15000);
});
