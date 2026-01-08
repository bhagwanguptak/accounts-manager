import { NextRequest } from 'next/server';
import { getAuthUser, requireRole } from '../../../../src/lib/auth';
import {
  getAdminSettings,
  updateAdminSettings
} from '../../../../src/services/database';
/**
 * GET → Load admin settings
 */
export async function GET(req: NextRequest) {
  const user = await getAuthUser(req);
  requireRole(user, ['admin']);

  const settings = await getAdminSettings(user!.id);

  return Response.json(settings ?? {});
}

/**
 * POST → Save admin settings
 */
export async function POST(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) {
    return new Response('Unauthorized', { status: 401 });
  }

  const settings = await req.json();
  await updateAdminSettings(user.id, settings);

  return Response.json({ success: true });
}
