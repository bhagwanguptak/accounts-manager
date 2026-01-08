// app/api/jobs/admin/route.ts
import { NextRequest } from "next/server";
import { getAllJobs } from "../../../../src/services/database";
import { getAuthUser, requireRole } from "../../../../src/lib/auth";

export async function GET(req: NextRequest) {
  const user = await getAuthUser(req);
  requireRole(user, ["admin"]);

  const jobs = await getAllJobs();
  return Response.json(jobs);
}
