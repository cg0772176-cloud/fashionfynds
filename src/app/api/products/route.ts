import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { products, brands, categories } from '@/db/schema';
import { eq, and, or, desc } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "").split(",").map(s => s.trim()).filter(Boolean);

async function requireAuth() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return null;
  return session.user;
}

async function requireAdmin(user: any): Promise<NextResponse | null> {
  if (ADMIN_EMAILS.length > 0 && !ADMIN_EMAILS.includes(user.email)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  return null;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    // Single product by ID
    if (id) {
      if (!id || isNaN(parseInt(id))) {
        return NextResponse.json({ 
          error: "Valid ID is required",
          code: "INVALID_ID" 
        }, { status: 400 });
      }

      const product = await db.select()
        .from(products)
        .where(eq(products.id, parseInt(id)))
        .limit(1);

      if (product.length === 0) {
        return NextResponse.json({ 
          error: 'Product not found',
          code: 'PRODUCT_NOT_FOUND' 
        }, { status: 404 });
      }

      return NextResponse.json(product[0], { status: 200 });
    }

    // List products with filters
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '20'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');
    const search = searchParams.get('search');
    const category = searchParams.get('category') || searchParams.get('categoryId');
    const brand = searchParams.get('brand') || searchParams.get('brandId');
    const featured = searchParams.get('featured');
    const deal = searchParams.get('deal');

    // Build filter conditions
    const conditions = [];

    if (search) {
      conditions.push(
        or(
          like(products.name, `%${search}%`),
          like(products.description, `%${search}%`)
        )
      );
    }

    if (category) {
      conditions.push(eq(products.categoryId, parseInt(category)));
    }

    if (brand) {
      conditions.push(eq(products.brandId, parseInt(brand)));
    }

    if (featured === 'true') {
      conditions.push(eq(products.featured, true));
    }

    if (deal === 'true') {
      conditions.push(eq(products.deal, true));
    }

    // Execute query with filters
    let query = db.select().from(products);

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const results = await query
      .orderBy(desc(products.createdAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json(results, { status: 200 });
    } catch (error) {
      console.error('GET /api/products error:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
  const user = await requireAuth();
  if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

  try {
    const body = await request.json();
    const { 
      name, 
      price, 
      image,
      slug,
      brandId,
      categoryId,
      originalPrice,
      description,
      images,
      sizes,
      colors,
      rating,
      reviews,
      inStock,
      featured,
      deal,
      dealDiscount,
      dealEndsAt,
      movement
    } = body;

    // Validate required fields
    if (!name) {
      return NextResponse.json({ 
        error: "Product name is required",
        code: "MISSING_NAME" 
      }, { status: 400 });
    }

    if (!image) {
      return NextResponse.json({ 
        error: "Product image is required",
        code: "MISSING_IMAGE" 
      }, { status: 400 });
    }

    if (!price || typeof price !== 'number' || price <= 0) {
      return NextResponse.json({ 
        error: "Valid positive price is required",
        code: "INVALID_PRICE" 
      }, { status: 400 });
    }

    // Paywall and QC Enforcement
    if (brandId) {
       const brandList = await db.select().from(brands).where(eq(brands.id, brandId));
       if (brandList.length > 0) {
          const brand = brandList[0];
          
          // Verify ownership or admin
          const isAdmin = ADMIN_EMAILS.includes(user.email);
          if (brand.ownerId !== user.id && !isAdmin) {
             return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
          }

          // Block pending/suspended
          if (brand.status === 'pending') {
             return NextResponse.json({ error: 'Your brand is pending approval.' }, { status: 403 });
          }
          if (brand.status === 'suspended') {
             return NextResponse.json({ error: 'Your brand is suspended.' }, { status: 403 });
          }

          // Basic tier limit check
          if (brand.subscriptionTier === 'basic' || !brand.subscriptionTier) {
             const existingProducts = await db.select().from(products).where(eq(products.brandId, brandId));
             if (existingProducts.length >= 50) {
                return NextResponse.json({ error: 'Basic tier limit reached. Please upgrade to Pro to add more products.' }, { status: 403 });
             }
          }
       }
    }

    // Generate slug from name if not provided
    const productSlug = slug || name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    const timestamp = new Date().toISOString();

    // Prepare insert data with defaults
    const insertData = {
      name: name.trim(),
      slug: productSlug,
      brandId: brandId || null,
      categoryId: categoryId || null,
      price,
      originalPrice: originalPrice || null,
      description: description?.trim() || null,
      image: image.trim(),
      images: images || null,
      sizes: sizes || null,
      colors: colors || null,
      rating: rating ?? 0,
      reviews: reviews ?? 0,
      inStock: inStock ?? true,
      featured: featured ?? false,
      deal: deal ?? false,
      dealDiscount: dealDiscount || null,
      dealEndsAt: dealEndsAt || null,
      movement: movement?.trim() || null,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    const newProduct = await db.insert(products)
      .values(insertData)
      .returning();

    return NextResponse.json(newProduct[0], { status: 201 });
    } catch (error) {
      console.error('POST /api/products error:', error);
      if ((error as Error).message?.includes('UNIQUE constraint failed')) {
        return NextResponse.json({ error: "A product with this slug already exists", code: "DUPLICATE_SLUG" }, { status: 400 });
      }
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function PUT(request: NextRequest) {
  const user = await requireAuth();
  if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  const authError = await requireAdmin(user);
  if (authError) return authError;

  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ 
        error: "Valid ID is required",
        code: "INVALID_ID" 
      }, { status: 400 });
    }

    // Check if product exists
    const existingProduct = await db.select()
      .from(products)
      .where(eq(products.id, parseInt(id)))
      .limit(1);

    if (existingProduct.length === 0) {
      return NextResponse.json({ 
        error: 'Product not found',
        code: 'PRODUCT_NOT_FOUND' 
      }, { status: 404 });
    }

    const body = await request.json();
    const { 
      name, 
      slug,
      brandId,
      categoryId,
      price, 
      originalPrice,
      description,
      image,
      images,
      sizes,
      colors,
      rating,
      reviews,
      inStock,
      featured,
      deal,
      dealDiscount,
      dealEndsAt,
      movement
    } = body;

    // Validate price if provided
    if (price !== undefined && (typeof price !== 'number' || price <= 0)) {
      return NextResponse.json({ 
        error: "Valid positive price is required",
        code: "INVALID_PRICE" 
      }, { status: 400 });
    }

    // Prepare update data
    const updateData: any = {
      updatedAt: new Date().toISOString(),
    };

    if (name !== undefined) updateData.name = name.trim();
    if (slug !== undefined) updateData.slug = slug.trim();
    if (brandId !== undefined) updateData.brandId = brandId;
    if (categoryId !== undefined) updateData.categoryId = categoryId;
    if (price !== undefined) updateData.price = price;
    if (originalPrice !== undefined) updateData.originalPrice = originalPrice;
    if (description !== undefined) updateData.description = description?.trim();
    if (image !== undefined) updateData.image = image.trim();
    if (images !== undefined) updateData.images = images;
    if (sizes !== undefined) updateData.sizes = sizes;
    if (colors !== undefined) updateData.colors = colors;
    if (rating !== undefined) updateData.rating = rating;
    if (reviews !== undefined) updateData.reviews = reviews;
    if (inStock !== undefined) updateData.inStock = inStock;
    if (featured !== undefined) updateData.featured = featured;
    if (deal !== undefined) updateData.deal = deal;
    if (dealDiscount !== undefined) updateData.dealDiscount = dealDiscount;
    if (dealEndsAt !== undefined) updateData.dealEndsAt = dealEndsAt;
    if (movement !== undefined) updateData.movement = movement?.trim();

    const updated = await db.update(products)
      .set(updateData)
      .where(eq(products.id, parseInt(id)))
      .returning();

    return NextResponse.json(updated[0], { status: 200 });
    } catch (error) {
      console.error('PUT /api/products error:', error);
      if ((error as Error).message?.includes('UNIQUE constraint failed')) {
        return NextResponse.json({ error: "A product with this slug already exists", code: "DUPLICATE_SLUG" }, { status: 400 });
      }
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
  const user = await requireAuth();
  if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  const authError = await requireAdmin(user);
  if (authError) return authError;

  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ 
        error: "Valid ID is required",
        code: "INVALID_ID" 
      }, { status: 400 });
    }

    // Check if product exists
    const existingProduct = await db.select()
      .from(products)
      .where(eq(products.id, parseInt(id)))
      .limit(1);

    if (existingProduct.length === 0) {
      return NextResponse.json({ 
        error: 'Product not found',
        code: 'PRODUCT_NOT_FOUND' 
      }, { status: 404 });
    }

    const deleted = await db.delete(products)
      .where(eq(products.id, parseInt(id)))
      .returning();

    return NextResponse.json({
      message: 'Product deleted successfully',
      product: deleted[0]
    }, { status: 200 });
    } catch (error) {
      console.error('DELETE /api/products error:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}