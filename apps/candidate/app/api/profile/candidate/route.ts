export const runtime = 'nodejs';
export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser, requireRole } from '../../../../src/lib/auth';
import {
  getCandidateProfile,
  updateCandidateProfile,
} from '../../../../src/services/database';
import { UserRole } from '@accuhire/shared';

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    requireRole(user, ['candidate']);
    console.log('JWT_SECRET:', process.env.JWT_SECRET)

    const profile = await getCandidateProfile(user.id);
    return NextResponse.json(profile);
  } catch (err) {
    console.error('[PROFILE AUTH ERROR]', err);
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }
}

export async function PUT(req: NextRequest) {
  const user = await getAuthUser(req);

  const roleCheck = requireRole(user, ['candidate']);
  if (roleCheck) return roleCheck; // ⬅️ IMPORTANT

  const body = await req.json();
  const updated = await updateCandidateProfile(user.id, body);

  return NextResponse.json(updated);
}

