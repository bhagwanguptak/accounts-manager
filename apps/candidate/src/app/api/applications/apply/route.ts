//4.1 Candidate: Apply for Job
import { NextRequest } from "next/server";
import { createApplication } from "../../../../services/database";
import { getAuthUser, requireRole } from "../../../../lib/auth";

export async function POST(req: NextRequest) {
  const user = await getAuthUser(req);
  requireRole(user, ["candidate"]);

  const { jobId, application } = await req.json();

  const app = await createApplication(jobId, user!.id, application);
  return Response.json(app);
}
