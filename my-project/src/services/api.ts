/**
 * Backwards-compatible entry point for the API services.
 *
 * The implementation is split by domain under `src/services/api/` so each
 * service can be read and maintained on its own. Import from `@/services/api`
 * (this barrel) or directly from a domain module when only one is needed.
 */
export * from './api/index';
