import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { orders } from '@/db/schema';
import { eq, desc, and, sql } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { sendOrderStatusEmail } from '@/lib/email';
import { headers } from 'next/headers';

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "").split(",").map(s => s.trim()).filter(Boolean);

async function requireAdmin(): Promise<NextResponse | null> {
  if (process.env.NODE_ENV === "development") return null;
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  if (ADMIN_EMAILS.length > 0 && !ADMIN_EMAILS.includes(session.user.email)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  return null;
}

export async function GET(request: NextRequest) {
  const authError = await requireAdmin();
  if (authError) return authError;

  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '50'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    const conditions = [];

    if (status && status !== 'all') {
      conditions.push(eq(orders.status, status));
    }

    if (search) {
      conditions.push(
        sql`(${orders.orderNumber} LIKE ${'%' + search + '%'} OR ${orders.shippingName} LIKE ${'%' + search + '%'} OR ${orders.shippingEmail} LIKE ${'%' + search + '%'})`
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const allOrders = await db.select()
      .from(orders)
      .where(whereClause)
      .orderBy(desc(orders.createdAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json(allOrders, { status: 200 });
    } catch (error) {
      console.error('GET /api/admin/orders error:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function PUT(request: NextRequest) {
  const authError = await requireAdmin();
  if (authError) return authError;

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ 
        error: 'Valid order ID is required',
        code: 'INVALID_ID' 
      }, { status: 400 });
    }

    const existingOrder = await db.select()
      .from(orders)
      .where(eq(orders.id, parseInt(id)))
      .limit(1);

    if (existingOrder.length === 0) {
      return NextResponse.json({ 
        error: 'Order not found',
        code: 'ORDER_NOT_FOUND' 
      }, { status: 404 });
    }

    const body = await request.json();
    const { status } = body;

    const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json({ 
        error: 'Invalid status. Must be one of: ' + validStatuses.join(', '),
        code: 'INVALID_STATUS' 
      }, { status: 400 });
    }

    const updateData: Record<string, unknown> = {
      updatedAt: new Date().toISOString(),
    };

    if (status) updateData.status = status;

    const updated = await db.update(orders)
      .set(updateData)
      .where(eq(orders.id, parseInt(id)))
      .returning();

    // Send order update email if status changed
    const oldStatus = existingOrder[0].status;
    if (status && status !== oldStatus && updated[0].shippingEmail) {
      void sendOrderStatusEmail(
        updated[0].shippingEmail,
        updated[0].shippingName || "Customer",
        updated[0].orderNumber,
        oldStatus,
        status,
        body.message // Optional note from admin that could be added in future frontend updates
      );
    }

    return NextResponse.json(updated[0], { status: 200 });
    } catch (error) {
      console.error('PUT /api/admin/orders error:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
