export const dynamic = "force-dynamic";
import { NextRequest } from "next/server";
import { getAuthUser, requireRole } from "../../../../../src/lib/auth";
import { updateJob } from "../../../../../src/services/database";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getAuthUser(req);
  requireRole(user, ["recruiter"]);

  const updates = await req.json();

  const updatedJob = await updateJob(params.id, updates);
  return Response.json(updatedJob);
}
