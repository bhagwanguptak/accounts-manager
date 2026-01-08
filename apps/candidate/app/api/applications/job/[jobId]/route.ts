import { NextRequest } from "next/server";
import { getApplicationsByJob } from "../../../../../src/services/database";
import { getAuthUser, requireRole } from "../../../../../src/lib/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: { jobId: string } }
) {
  const user = await getAuthUser(req);
  requireRole(user, ["recruiter"]);

  const jobId = params.jobId;

  if (!jobId) {
    return new Response(
      JSON.stringify({ message: "jobId is required" }),
      { status: 400 }
    );
  }

  const apps = await getApplicationsByJob(jobId);
  return Response.json(apps);
}
