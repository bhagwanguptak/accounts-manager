import { NextResponse } from 'next/server';
import * as database from '../src/services/database';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../src/types';
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-prod';

export async function POST(req: Request) {
  try {
    const { mobile, email, password, role } = await req.json();
    const identifier = mobile || email;

    if (!identifier || !password) {
      return NextResponse.json({ error: 'Missing credentials' }, { status: 400 });
    }

    let userRecord = await database.getUserForLogin(identifier);

    // Auto-create Admin if not exists (for testing purposes)
    if (!userRecord && role === 'ADMIN') {
      console.log('[AUTH] Admin user not found, creating new admin...');
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      
      const newAdmin: User = {
        id: crypto.randomUUID(),
        name: 'Admin',
        mobile: mobile || '0000000000',
        email: email,
        role: 'ADMIN' as any,
        employmentStatus: 'Working Professional',
        expertise: [],
        experience: '0'
      };

      userRecord = await database.createUserWithPassword(newAdmin, hashedPassword);
      // Attach hash for the subsequent check
      userRecord.password_hash = hashedPassword;
    }

    if (!userRecord) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // Verify Role if specified (Allow ADMIN to log in even if role mismatch in request, or enforce strictness)
    if (role && userRecord.role !== role && userRecord.role !== 'ADMIN') {
       return NextResponse.json({ error: 'Unauthorized access for this role' }, { status: 403 });
    }

    // Verify Password
    const isValid = await bcrypt.compare(password, userRecord.password_hash || '');
    
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // Generate JWT
    const token = jwt.sign(
      { id: userRecord.id, role: userRecord.role, name: userRecord.name, mobile: userRecord.mobile, email: userRecord.email },
      JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    // Remove sensitive data
    const { password_hash, ...user } = userRecord;

    return NextResponse.json({ user, token });
  } catch (error) {
    console.error('[LOGIN-ERROR]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}