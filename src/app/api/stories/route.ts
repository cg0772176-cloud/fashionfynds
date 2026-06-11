import { NextResponse } from 'next/server';
import { db } from '@/db';
import { brandStories, brands } from '@/db/schema';
import { eq, gte } from 'drizzle-orm';

export async function GET() {
  try {
    const now = new Date().toISOString();
    
    // Get all stories that haven't expired yet
    const activeStories = await db
      .select({
        id: brandStories.id,
        mediaUrl: brandStories.mediaUrl,
        expiresAt: brandStories.expiresAt,
        brandId: brands.id,
        brandName: brands.name,
        brandLogo: brands.logo,
      })
      .from(brandStories)
      .innerJoin(brands, eq(brandStories.brandId, brands.id))
      .where(gte(brandStories.expiresAt, now));

    return NextResponse.json(activeStories);
  } catch (error: any) {
    console.error('Error fetching stories:', error);
    return NextResponse.json({ error: 'Failed to fetch stories' }, { status: 500 });
  }
}
