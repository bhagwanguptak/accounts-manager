import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, requireRole } from "../../../../src/lib/auth";
import {
  getAllApplications,
  createApplication,
} from "../../../../src/services/database";

/**
 * ADMIN: get all applications
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    requireRole(user, ["admin"]);

    const apps = await getAllApplications();
    return NextResponse.json(apps);
  } catch (err) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 403 }
    );
  }
}

/**
 * CANDIDATE: apply for a job
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    requireRole(user, ["candidate"]);

      const body = await req.json();
      const { jobId, ...application } = body;

    const app = await createApplication(jobId, user.id, application);
    console.log('[APPLY PAYLOAD]', application);

    return NextResponse.json(app);
  } catch (err) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 403 }
    );
  }
}
