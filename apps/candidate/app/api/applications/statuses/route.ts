// 4.3 Recruiter: Update Application Status
import { NextRequest } from "next/server";
import { updateApplicationStatus } from "../../../../src/services/database";
import { getAuthUser, requireRole } from "../../../../src/lib/auth";

export async function PUT(req: NextRequest) {
  const user = await getAuthUser(req);
  requireRole(user, ["recruiter"]);

  const { applicationId, status } = await req.json();

  if (!applicationId || !status) {
    return new Response(
      JSON.stringify({ message: "applicationId and status are required" }),
      { status: 400 }
    );
  }

  const updated = await updateApplicationStatus(applicationId, status);
  return Response.json(updated);
}
