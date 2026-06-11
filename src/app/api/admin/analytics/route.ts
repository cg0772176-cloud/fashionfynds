import { NextResponse } from "next/server";
import { db } from "@/db";
import { user, orders, products } from "@/db/schema";
import { sql } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

async function requireAdmin(): Promise<NextResponse | null> {
  if (process.env.NODE_ENV === "development") return null;
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  if (ADMIN_EMAILS.length > 0 && !ADMIN_EMAILS.includes(session.user.email)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  return null;
}

export async function GET() {
  const authError = await requireAdmin();
  if (authError) return authError;

  try {
    const [orderStats] = await db
      .select({
        totalOrders: sql<number>`COUNT(*)`,
        totalRevenue: sql<number>`COALESCE(SUM(total), 0)`,
      })
      .from(orders);

    const [customerStats] = await db
      .select({ totalCustomers: sql<number>`COUNT(*)` })
      .from(user);

    const [productStats] = await db
      .select({ totalProducts: sql<number>`COUNT(*)` })
      .from(products);

    // Recent 7 days breakdown
    const recentOrders = await db
      .select({
        date: sql<string>`DATE(created_at)`,
        count: sql<number>`COUNT(*)`,
        revenue: sql<number>`COALESCE(SUM(total), 0)`,
      })
      .from(orders)
      .groupBy(sql`DATE(created_at)`)
      .orderBy(sql`DATE(created_at) DESC`)
      .limit(7);

    return NextResponse.json({
      totalOrders: orderStats.totalOrders,
      totalRevenue: orderStats.totalRevenue,
      totalCustomers: customerStats.totalCustomers,
      totalProducts: productStats.totalProducts,
      recentOrders: recentOrders.map((r) => ({
        date: r.date,
        count: r.count,
        revenue: r.revenue,
      })),
    });
  } catch (error) {
    console.error("GET /api/admin/analytics error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
