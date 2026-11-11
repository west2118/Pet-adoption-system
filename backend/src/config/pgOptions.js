/**
 * Supabase (managed Postgres) connection helpers.
 *
 * Supabase is the only database this app connects to — there is no local
 * PostgreSQL fallback. Everything (API, migrations, seeds) builds its
 * node-postgres config here so TLS and pooling settings stay consistent.
 *
 * Deployment note on the "port" failures: Supabase's direct host
 * `db.<project-ref>.supabase.co:5432` is IPv6-only, which Render and most PaaS
 * hosts cannot reach. The IPv4-safe routes are Supavisor's pooler endpoints:
 *   - session mode:     aws-0-<region>.pooler.supabase.com:5432
 *   - transaction mode: aws-0-<region>.pooler.supabase.com:6543
 * Both require TLS. Supabase's CA is not in Node's trust store, so certificate
 * verification is relaxed (traffic is still encrypted). Add `?sslmode=verify-full`
 * together with NODE_EXTRA_CA_CERTS when you want full verification.
 */

const SUPABASE_HOST_PATTERNS = [
  /\.supabase\.co$/i,
  /\.supabase\.com$/i,
  /\.supabase\.net$/i,
];

const POOLER_PORTS = ['5432', '6543'];
const DIRECT_HOST_PATTERN = /^db\.[a-z0-9-]+\.supabase\.co$/i;

const parseDbUrl = (dbUrl) => {
  if (!dbUrl) return null;
  try {
    return new URL(dbUrl);
  } catch {
    return null;
  }
};

/** True when the connection string points at Supabase (direct host or pooler). */
export const isSupabaseDatabase = (dbUrl) => {
  const url = parseDbUrl(dbUrl);
  if (!url) return false;
  return SUPABASE_HOST_PATTERNS.some((pattern) => pattern.test(url.hostname));
};

/**
 * Kept for callers that only need "is this a hosted database?" — with Supabase
 * as the sole database this is the same check.
 */
export const isManagedDatabase = isSupabaseDatabase;

/**
 * Validates DATABASE_URL and fails fast with an actionable message instead of
 * retrying a local/direct host that cannot be reached from the deployment.
 * Returns the parsed URL.
 */
export const assertSupabaseDatabaseUrl = (dbUrl) => {
  const url = parseDbUrl(dbUrl);

  if (!url) {
    throw new Error(
      'DATABASE_URL is not a valid connection string. Paste the Supabase "Session pooler" URI ' +
        '(Dashboard -> Project Settings -> Database -> Connection string) into backend/.env.production.',
    );
  }

  if (!isSupabaseDatabase(dbUrl)) {
    throw new Error(
      `DATABASE_URL points at ${url.hostname}, but this app uses Supabase as its only database. ` +
        'Replace the DATABASE_URL line in backend/.env (development) and backend/.env.production ' +
        '(production) with the Supabase "Session pooler" URI: ' +
        'postgresql://postgres.<project-ref>:<db-password>@aws-0-<region>.pooler.supabase.com:5432/postgres',
    );
  }

  if (DIRECT_HOST_PATTERN.test(url.hostname)) {
    throw new Error(
      `DATABASE_URL uses the Supabase direct host ${url.hostname}, which is IPv6-only and unreachable ` +
        'from Render and most hosts. Use the "Session pooler" URI ' +
        '(aws-0-<region>.pooler.supabase.com:5432) instead.',
    );
  }

  if (url.port && !POOLER_PORTS.includes(url.port)) {
    throw new Error(
      `DATABASE_URL uses port ${url.port}. Use the Supabase pooler ports instead: ` +
        '5432 (session mode) or 6543 (transaction mode).',
    );
  }

  return url;
};

/**
 * node-postgres config for a Supabase connection string. TLS is always on
 * (Supabase requires it); `?sslmode=verify-full` additionally verifies the
 * certificate against the CA in NODE_EXTRA_CA_CERTS.
 */
export const buildPgConfig = (dbUrl) => {
  const url = parseDbUrl(dbUrl);
  const sslMode = url?.searchParams.get('sslmode')?.toLowerCase();

  return {
    connectionString: dbUrl,
    ssl:
      sslMode === 'verify-full'
        ? { rejectUnauthorized: true }
        : { rejectUnauthorized: false },
    // Supavisor caps concurrent clients per project; keep the pool small so the
    // free tier has headroom and idle connections are released promptly.
    max: Number(process.env.DB_POOL_MAX) || 10,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 15_000,
    keepAlive: true,
  };
};
