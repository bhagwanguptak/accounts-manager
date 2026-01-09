//3.1 Get all jobs (PUBLIC)
export const dynamic = "force-dynamic";
import { getAllJobs } from "../../../src/services/database";

export async function GET() {
  const jobs = await getAllJobs();
  return Response.json(jobs);
}
