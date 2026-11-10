/**
 * Shared Postgres connection helpers.
 *
 * Local Postgres speaks plain TCP, but managed providers (Supabase's direct
 * connection and its Supavisor pooler) require TLS. Supabase's certificate is
 * not in Node's trust store, so verification is relaxed for those hosts —
 * traffic is still encrypted. Add `?sslmode=verify-full` (plus the CA in
 * NODE_EXTRA_CA_CERTS) when you want full certificate verification.
 */

const MANAGED_HOST_PATTERNS = [
  /\.supabase\.co$/i,
  /\.supabase\.com$/i,
  /\.supabase\.net$/i,
  /\.pooler\.supabase\.com$/i,
];

const parseDbUrl = (dbUrl) => {
  if (!dbUrl) return null;
  try {
    return new URL(dbUrl);
  } catch {
    return null;
  }
};

/** True for hosted providers where the database already exists and TLS is mandatory. */
export const isManagedDatabase = (dbUrl) => {
  const url = parseDbUrl(dbUrl);
  if (!url) return false;
  return MANAGED_HOST_PATTERNS.some((pattern) => pattern.test(url.hostname));
};

/** Whether the connection string should be upgraded to TLS. */
export const usesTls = (dbUrl) => {
  const url = parseDbUrl(dbUrl);
  if (!url) return false;
  const sslMode = url.searchParams.get('sslmode');
  if (sslMode) return sslMode.toLowerCase() !== 'disable';
  return isManagedDatabase(dbUrl);
};

/** node-postgres config for a connection string, with TLS for managed hosts. */
export const buildPgConfig = (dbUrl) => {
  const config = { connectionString: dbUrl };
  if (usesTls(dbUrl)) {
    config.ssl = { rejectUnauthorized: false };
  }
  return config;
};
