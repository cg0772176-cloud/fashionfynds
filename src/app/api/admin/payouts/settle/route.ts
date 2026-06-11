import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/db";
import { payouts } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser(null as any);
    if (process.env.NODE_ENV !== "development" && (!user || user.role !== "admin")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { brandId } = body;

    if (!brandId) {
      return NextResponse.json({ error: "brandId is required" }, { status: 400 });
    }

    const now = new Date().toISOString();

    await db.update(payouts)
      .set({ 
        status: 'paid', 
        settledAt: now,
        updatedAt: now
      })
      .where(
        and(
          eq(payouts.brandId, brandId),
          eq(payouts.status, 'ready_for_payout')
        )
      );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to settle payout:", error);
    return NextResponse.json({ error: "Failed to settle payout" }, { status: 500 });
  }
}
