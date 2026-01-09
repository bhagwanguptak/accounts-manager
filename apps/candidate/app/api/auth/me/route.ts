export const dynamic = "force-dynamic";
import { NextRequest } from "next/server";
import { getAuthUser } from "../../../../src/lib/auth";

export async function GET(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }
  return Response.json({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
});

}
