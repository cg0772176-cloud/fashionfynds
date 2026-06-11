import { NextResponse } from 'next/server';
import { db } from '@/db';
import { orders, orderItems, products, brands } from '@/db/schema';
import { eq, desc, inArray } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

export async function GET() {
  try {
    // Get authenticated user
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const userId = session.user.id;

    // Find the brand owned by this user
    const [brand] = await db
      .select()
      .from(brands)
      .where(eq(brands.ownerId, userId))
      .limit(1);

    if (!brand) {
      return NextResponse.json({ error: 'No brand found for this user' }, { status: 404 });
    }

    // Find all products belonging to this brand
    const brandProducts = await db
      .select({ id: products.id })
      .from(products)
      .where(eq(products.brandId, brand.id));

    const productIds = brandProducts.map((p) => p.id);

    if (productIds.length === 0) {
      return NextResponse.json([]);
    }

    // Find all order items that reference this brand's products
    const brandOrderItems = await db
      .select()
      .from(orderItems)
      .where(inArray(orderItems.productId, productIds));

    if (brandOrderItems.length === 0) {
      return NextResponse.json([]);
    }

    // Get unique order IDs
    const orderIds = [...new Set(brandOrderItems.map((item) => item.orderId))];

    // Fetch full orders
    const brandOrders = await db
      .select()
      .from(orders)
      .where(inArray(orders.id, orderIds))
      .orderBy(desc(orders.createdAt));

    // Fetch all order items for these orders (not just this brand's items, for completeness)
    const allItems = await db
      .select()
      .from(orderItems)
      .where(inArray(orderItems.orderId, orderIds));

    // Combine orders with their items
    const ordersWithItems = brandOrders.map((order) => ({
      ...order,
      items: allItems.filter((item) => item.orderId === order.id),
      brandItems: brandOrderItems.filter((item) => item.orderId === order.id),
    }));

    return NextResponse.json(ordersWithItems);
  } catch (error) {
    console.error('GET /api/partner/orders error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
