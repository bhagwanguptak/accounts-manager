import { jwtVerify, JWTPayload } from "jose";
import { NextRequest } from "next/server";

/**
 * Supported user roles
 */
export type UserRole = "candidate" | "recruiter" | "admin";

/**
 * Authenticated user shape
 */
export interface AuthUser {
  id: string;
  role: UserRole;
  name?: string;
  email?: string;
  mobile?: string;
}

/**
 * JWT secret (must be same as login route)
 */
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "dev_secret"
);

/**
 * Extract and verify JWT from Authorization header
 */
export async function getAuthUser(
  req: NextRequest
): Promise<AuthUser | null> {
  const authHeader = req.headers.get("authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.substring("Bearer ".length);

  try {
    const { payload } = await jwtVerify<JWTPayload>(token, JWT_SECRET);

    if (!payload?.id || !payload?.role) {
      return null;
    }

    return {
      id: String(payload.id),
      role: payload.role as UserRole,
      name: payload.name as string | undefined,
      email: payload.email as string | undefined,
      mobile: payload.mobile as string | undefined,
    };
  } catch (error) {
    console.error("[AUTH] JWT verification failed:", error);
    return null;
  }
}

/**
 * Role-based access control guard
 * Throws an error if user is missing or role is not allowed
 */
export function requireRole(
  user: AuthUser | null,
  allowedRoles: UserRole[]
): Response | null {
  if (!user) {
    return new Response('Unauthorized', { status: 401 });
  }

  if (!allowedRoles.includes(user.role)) {
    return new Response('Forbidden', { status: 403 });
  }

  return null;
}
