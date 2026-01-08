export const runtime = 'nodejs';

import { NextRequest } from 'next/server';
import { SignJWT } from 'jose';
import {
  getOtp,
  deleteOtp,
  getUserByMobile,
  createUser,
} from '../../../../src/services/database';
import { mapDbRoleToJwtRole } from '../../../../src/lib/roleHelper';
import { UserRole } from '@accuhire/shared';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'dev_secret'
);

export async function POST(req: NextRequest) {

  try {
     const body = await req.json();
    console.log('[VERIFY OTP BODY]', body);

    const { identifier, otp, name, role } = body;

    if (!identifier || !otp) {
      return new Response('Missing identifier or otp', { status: 400 });
    }

    const safeName =
      typeof name === 'string' && name.trim().length > 0
        ? name.trim()
        : null;

    // 1️⃣ Verify OTP
    const record = await getOtp(identifier, otp);

    if (!record || record.expires_at < new Date()) {
      return new Response('Invalid or expired OTP', { status: 400 });
    }
   
    // OTP is valid → delete it (single use)
    await deleteOtp(record.id);

    // 2️⃣ Fetch user by mobile
    let user = await getUserByMobile(identifier);

    // 3️⃣ Decide role
    let finalRole: UserRole;

    if (user) {
      // ✅ Existing user → DB is source of truth
      finalRole = user.role;
    } else {
      // ✅ New user → role must come from portal
      if (role !== UserRole.CANDIDATE && role !== UserRole.RECRUITER) {
        return new Response('Role is required for new users', {
          status: 400,
        });
      }

      finalRole = role;

      user = await createUser({
        name: safeName,
        mobile: identifier,
        email: null,
        role: finalRole,
      });
    }

    // 4️⃣ Map DB role → JWT role
    const jwtRole = mapDbRoleToJwtRole(finalRole);

    // 5️⃣ Create JWT
    const token = await new SignJWT({
      id: user.id,
      role: jwtRole,
      ...(user.name && { name: user.name }),
      mobile: user.mobile,
      email: user.email,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('7d')
      .sign(JWT_SECRET);

    // 6️⃣ Response
    return Response.json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        mobile: user.mobile,
        email: user.email,
        role: jwtRole,
      },
    });

  } catch (error) {
    console.error('[VERIFY OTP] ERROR:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
