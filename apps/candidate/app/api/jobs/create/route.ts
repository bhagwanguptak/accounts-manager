//3.2 Recruiter: Create Job (AUTH REQUIRED)
export const dynamic = "force-dynamic";
import { NextRequest } from "next/server";
import { createJob } from "../../../../src/services/database";
import { getAuthUser, requireRole } from "../../../../src/lib/auth";

export async function POST(req: NextRequest) {
  const user = await getAuthUser(req);
  requireRole(user, ["recruiter"]);

  const body = await req.json();
  const job = await createJob(user!.id, body);

  return Response.json(job);
}
