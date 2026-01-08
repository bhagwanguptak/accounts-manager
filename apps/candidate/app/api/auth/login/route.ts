import { NextRequest, NextResponse } from "next/server";
import { SignJWT } from "jose";
import bcrypt from "bcryptjs";
import pool from "../../../../src/services/database"; // adjust path if needed

const JWT_SECRET = process.env.JWT_SECRET || "dev_secret";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, mobile, password, role } = body;

    // ✅ Correct validation
    if ((!email && !mobile) || !password) {
      return NextResponse.json(
        { error: "Missing credentials" },
        { status: 400 }
      );
    }

    const normalizedRole = role?.toLowerCase() ?? "candidate";

    // ✅ Fetch user by email OR mobile
    const result = await pool.query(
      `
      SELECT *
      FROM users
      WHERE role = $1
        AND (email = $2 OR mobile = $3)
      LIMIT 1
      `,
      [normalizedRole, email ?? null, mobile ?? null]
    );

    const user = result.rows[0];

    if (!user || !user.password_hash) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // ✅ Secure password check
    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // ✅ Create JWT
    const jwt = await new SignJWT({ id: user.id, role: user.role })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("7d")
      .sign(new TextEncoder().encode(JWT_SECRET));

    return NextResponse.json(
      {
        token: jwt,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          mobile: user.mobile,
          role: user.role,
        },
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("LOGIN ERROR:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
