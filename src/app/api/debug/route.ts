import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const tursoUrl = process.env.TURSO_CONNECTION_URL;
  const tursoToken = process.env.TURSO_AUTH_TOKEN;

  const diagnostics = {
    env_check: {
      TURSO_CONNECTION_URL: tursoUrl ? `SET (${tursoUrl.substring(0, 20)}...)` : 'NOT SET',
      TURSO_AUTH_TOKEN: tursoToken ? `SET (${tursoToken.substring(0, 10)}...)` : 'NOT SET',
      NODE_ENV: process.env.NODE_ENV || 'NOT SET',
    },
    db_test: 'not run yet',
  };

  // Try to connect to the database
  try {
    const { createClient } = await import('@libsql/client');
    
    if (!tursoUrl || !tursoToken) {
      diagnostics.db_test = 'SKIPPED - missing env vars';
      return NextResponse.json(diagnostics);
    }

    const client = createClient({
      url: tursoUrl,
      authToken: tursoToken,
    });

    // Simple test query
    const result = await client.execute('SELECT 1 as test');
    diagnostics.db_test = `SUCCESS - connected to Turso! Result: ${JSON.stringify(result.rows)}`;
  } catch (error: any) {
    diagnostics.db_test = `FAILED - ${error.message}`;
  }

  return NextResponse.json(diagnostics, { status: 200 });
}
