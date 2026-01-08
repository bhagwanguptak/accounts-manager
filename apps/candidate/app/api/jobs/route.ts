//3.1 Get all jobs (PUBLIC)
import { getAllJobs } from "../../../src/services/database";

export async function GET() {
  const jobs = await getAllJobs();
  return Response.json(jobs);
}
