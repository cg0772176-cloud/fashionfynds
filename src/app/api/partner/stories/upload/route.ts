import { NextResponse } from 'next/server';
import { db } from '@/db';
import { brandStories, brands } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const brandId = formData.get('brandId');
    const file = formData.get('file');

    if (!brandId || !file) {
      return NextResponse.json({ error: 'Missing data' }, { status: 400 });
    }

    const brandList = await db.select().from(brands).where(eq(brands.id, Number(brandId)));
    if (brandList.length === 0) {
      return NextResponse.json({ error: 'Brand not found' }, { status: 404 });
    }
    const brand = brandList[0];

    if (brand.status === 'pending' || brand.status === 'suspended') {
      return NextResponse.json({ error: 'Brand is pending or suspended.' }, { status: 403 });
    }

    if (brand.subscriptionTier === 'basic' || !brand.subscriptionTier) {
      return NextResponse.json({ error: 'Basic tier cannot upload stories. Please upgrade to Pro.' }, { status: 403 });
    }

    // MOCK UPLOAD: In production, upload to Cloudinary or AWS S3.
    // For now, we use a placeholder image to simulate a successful upload.
    const mockMediaUrl = "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&q=80&w=800";

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // Expires in 24 hours

    await db.insert(brandStories).values({
      brandId: Number(brandId),
      mediaUrl: mockMediaUrl,
      expiresAt: expiresAt.toISOString(),
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({ success: true, url: mockMediaUrl });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
