//4.4 Candidate: My Applications
export const dynamic = "force-dynamic";
import { NextRequest } from "next/server";
import { getCandidateApplications } from "../../../../src/services/database";
import { getAuthUser, requireRole } from "../../../../src/lib/auth";

export async function GET(req: NextRequest) {
  const user = await getAuthUser(req);
  requireRole(user, ["candidate"]);

  const apps = await getCandidateApplications(user!.id);
  return Response.json(apps);
}
