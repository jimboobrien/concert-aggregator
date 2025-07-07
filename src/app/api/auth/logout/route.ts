import { logoutApi } from '@/actions/auth';

/**
 * API route for handling logout requests
 * This can be called from client-side components like the navbar
 * POST /api/auth/logout
 */
export async function POST(request: Request) {
  return logoutApi(request);
}

/**
 * Also handle GET requests to support simple link-based logout
 * GET /api/auth/logout
 */
export async function GET(request: Request) {
  return logoutApi(request);
} 