import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser, requireRole } from '../../../../../src/lib/auth';
import { withdrawApplication } from '../../../../../src/services/database';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthUser(req);
    requireRole(user, ['candidate']);

    if (!params.id) {
      return NextResponse.json(
        { error: 'Missing application id' },
        { status: 400 }
      );
    }

    await withdrawApplication(params.id, user.id);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[WITHDRAW ERROR]', err);
    return NextResponse.json(
      { error: 'Unable to withdraw application' },
      { status: 400 }
    );
  }
}
