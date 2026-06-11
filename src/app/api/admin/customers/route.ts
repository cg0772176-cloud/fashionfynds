import { NextResponse } from "next/server";
import { db } from "@/db";
import { user, orders } from "@/db/schema";
import { sql, desc } from "drizzle-orm";
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
    // Get all users with their order stats
    const customers = await db
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
        orderCount: sql<number>`COALESCE((SELECT COUNT(*) FROM orders WHERE orders.user_id = ${user.id}), 0)`,
        totalSpent: sql<number>`COALESCE((SELECT SUM(total) FROM orders WHERE orders.user_id = ${user.id}), 0)`,
      })
      .from(user)
      .orderBy(desc(user.createdAt));

    return NextResponse.json(customers, { status: 200 });
  } catch (error) {
    console.error("GET /api/admin/customers error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
