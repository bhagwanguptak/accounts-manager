export const runtime = 'nodejs';
export const dynamic = "force-dynamic";
import { NextRequest } from 'next/server';
import { getUserByMobile, createUser } from '../../../src/services/database';

/* =========================
   GET /api/users?mobile=
========================= */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const mobile = searchParams.get('mobile');

    if (!mobile) {
      return Response.json(
        { message: 'Mobile is required' },
        { status: 400 }
      );
    }
    console.log("DATABASE_URL =", process.env.DATABASE_URL);

    const user = await getUserByMobile(mobile);

    if (!user) {
      return Response.json(null, { status: 404 });
    }

    return Response.json(user);
  } catch (error) {
    console.error('[API /users GET]', error);
    return Response.json(
      { message: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

/* =========================
   POST /api/users
========================= */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { mobile } = body;

    if (!mobile) {
      return Response.json(
        { message: 'Mobile is required' },
        { status: 400 }
      );
    }

    // ✅ CHECK FIRST
    const existingUser = await getUserByMobile(mobile);

    if (existingUser) {
      // ✅ Return existing instead of crashing
      return Response.json(existingUser, { status: 200 });
    }

    // ✅ Create only if not exists
    const user = await createUser(body);
    return Response.json(user, { status: 201 });

  } catch (error) {
    console.error('[API /users POST]', error);
    return Response.json(
      { message: 'Failed to create user' },
      { status: 500 }
    );
  }
}
