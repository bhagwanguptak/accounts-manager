export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, requireRole } from "../../../../src/lib/auth";
import { getCandidateApplications } from "../../../../src/services/database";

/**
 * CANDIDATE: get own applications
 * GET /api/applications/candidate
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    requireRole(user, ["candidate"]);

    const apps = await getCandidateApplications(user.id);
    return NextResponse.json(apps);
  } catch (err) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 403 }
    );
  }
}
