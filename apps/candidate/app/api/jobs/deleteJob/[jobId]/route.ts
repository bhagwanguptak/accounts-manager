export const dynamic = "force-dynamic";
import { NextRequest } from 'next/server';
import { getAuthUser } from '../../../../../src/lib/auth';
import { deleteJobById } from '../../../../../src/services/database';

export async function DELETE(
  req: NextRequest,
  { params }: { params: { jobId: string } }
) {
  const user = await getAuthUser(req);

  if (!user) {
    return new Response('Unauthorized', { status: 401 });
  }

  // allow recruiter + admin
  if (!['admin', 'recruiter'].includes(user.role)) {
    return new Response('Forbidden', { status: 403 });
  }

  console.log('[DELETE JOB] jobId:', params.jobId);

  const result = await deleteJobById(params.jobId);

  if (!result.ok) {
    return new Response('Job not found', { status: 404 });
  }

  return Response.json({ success: true });
}
