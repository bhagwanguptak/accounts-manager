import { NextRequest } from 'next/server';
import { createOtp } from '../../../../src/services/database';

export async function POST(req: NextRequest) {
  const { mobile, email } = await req.json();

  const identifier = mobile || email;
  if (!identifier) {
    return new Response('Mobile or email required', { status: 400 });
  }

  // Mock OTP for now
  const otp = '1234';
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 mins

  await createOtp(identifier, otp);

  console.log('[OTP] Sent OTP 1234 to', identifier);
  return Response.json({ success: true });
}
