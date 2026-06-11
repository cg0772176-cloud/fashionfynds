import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { db } from '@/db';
import { marketingPayments, brands } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(req: Request) {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, brandId, tier, amount } = await req.json();

    const secret = process.env.RAZORPAY_KEY_SECRET || 'secret_placeholder';
    const generated_signature = crypto
      .createHmac('sha256', secret)
      .update(razorpay_order_id + '|' + razorpay_payment_id)
      .digest('hex');

    if (generated_signature !== razorpay_signature) {
      return NextResponse.json({ error: 'Invalid payment signature' }, { status: 400 });
    }

    // Save payment
    await db.insert(marketingPayments).values({
      brandId: Number(brandId),
      amount: Number(amount),
      status: 'completed',
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + 1);

    const commissionRate = tier === "elite" ? 5.0 : tier === "pro" ? 10.0 : 15.0;

    await db.update(brands).set({
      subscriptionTier: tier,
      subscriptionExpiresAt: expiresAt.toISOString(),
      commissionRate: commissionRate,
    }).where(eq(brands.id, Number(brandId)));

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
