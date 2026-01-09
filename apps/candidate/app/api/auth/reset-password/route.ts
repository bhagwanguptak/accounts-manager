export const dynamic = "force-dynamic";
import { NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';
import { getOtp, deleteOtp, getUserForLogin, getPool } from '../../../../src/services/database';

export async function POST(req: NextRequest) {
  const { identifier, otp, newPassword } = await req.json();

  const otpRow = await getOtp(identifier, otp);
  if (!otpRow || otpRow.expires_at < new Date()) {
    return new Response('Invalid or expired OTP', { status: 400 });
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);

  await getPool().query(
    `UPDATE users SET password_hash = $1 WHERE mobile = $2 OR email = $2`,
    [passwordHash, identifier]
  );

  await deleteOtp(otpRow.id);

  return Response.json({ success: true });
}
