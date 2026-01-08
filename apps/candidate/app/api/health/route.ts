import { NextResponse } from 'next/server';

import { ensureDbInitialized } from '../../../src/services/dbInit';

export async function GET() {
  await ensureDbInitialized();
  return NextResponse.json({ status: 'ok' });
}
