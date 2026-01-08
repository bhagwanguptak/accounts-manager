//3.3 Recruiter: Get own jobs

import { NextRequest } from "next/server";
import { getJobsByRecruiter } from "../../../../src/services/database";
import { getAuthUser, requireRole } from "../../../../src/lib/auth";

export async function GET(req: NextRequest) {
  const user = await getAuthUser(req);
  requireRole(user, ["recruiter"]);

  const jobs = await getJobsByRecruiter(user.id);
  return Response.json(jobs);
}
