/**
 * API service barrel.
 *
 * Domain implementations live in `src/services/api/`:
 * - `petService` — public catalogue + shelter inventory
 * - `shelterService` — public shelter directory + profile
 * - `userService` — platform user management
 * - `shelterUserService` — shelter staff/admin accounts
 * - `adminService` — platform admin tables + stats
 * - `overviewService` — shelter dashboard aggregates
 * - `inquiryService` — public inquiries + shelter inbox
 *
 * Keeping this barrel preserves the existing `@/services/api` import path.
 */
export type { PaginatedResult } from './shared';
export * from './petService';
export * from './shelterService';
export * from './userService';
export * from './shelterUserService';
export * from './adminService';
export * from './overviewService';
export * from './inquiryService';
export type { Inquiry } from '@/types';
