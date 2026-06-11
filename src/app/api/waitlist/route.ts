import { NextResponse } from 'next/server';
import { db } from '@/db';
import { newsletterSubscribers } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Valid email is required' }, { status: 400 });
    }

    // Check if they are already on the waitlist
    const existing = await db
      .select()
      .from(newsletterSubscribers)
      .where(eq(newsletterSubscribers.email, email))
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json({ message: 'Already on the waitlist!' });
    }

    // Insert new waitlist subscriber
    await db.insert(newsletterSubscribers).values({
      email,
      source: 'waitlist_landing_page',
      active: true,
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({ message: 'Successfully joined the waitlist!' });
  } catch (error: any) {
    console.error('Waitlist Error:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: error?.message || String(error) }, { status: 500 });
  }
}
