import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { db } from '@/db';
import { orders, orderItems } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth';
import {
  createShiprocketOrder,
  generateAWB,
  generateLabel,
  type ShiprocketOrderData,
} from '@/lib/shiprocket';

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser(null as any);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, order_number } = await req.json();

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !order_number) {
      return NextResponse.json({ error: 'Missing required payment fields' }, { status: 400 });
    }

    const secret = process.env.RAZORPAY_KEY_SECRET || 'secret_placeholder';

    // Verify signature
    const generated_signature = crypto
      .createHmac('sha256', secret)
      .update(razorpay_order_id + '|' + razorpay_payment_id)
      .digest('hex');

    if (generated_signature !== razorpay_signature) {
      return NextResponse.json({ error: 'Invalid payment signature' }, { status: 400 });
    }

    // Payment is valid! Update the order status
    await db
      .update(orders)
      .set({
        status: 'processing',
        razorpayOrderId: razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id,
        razorpaySignature: razorpay_signature,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(orders.orderNumber, order_number));

    // --- Shiprocket Integration (non-blocking) ---
    try {
      // Fetch the full order with items
      const [order] = await db
        .select()
        .from(orders)
        .where(eq(orders.orderNumber, order_number))
        .limit(1);

      if (!order) {
        console.error('[Shiprocket] Order not found after update:', order_number);
        return NextResponse.json({ success: true, message: 'Payment verified successfully' });
      }

      const items = await db
        .select()
        .from(orderItems)
        .where(eq(orderItems.orderId, order.id));

      // Build Shiprocket order payload
      const shiprocketOrderData: ShiprocketOrderData = {
        order_id: order.orderNumber,
        order_date: new Date(order.createdAt).toISOString().split('T')[0] + ' ' +
                    new Date(order.createdAt).toISOString().split('T')[1]?.substring(0, 8),
        billing_customer_name: order.shippingName.split(' ')[0] || order.shippingName,
        billing_last_name: order.shippingName.split(' ').slice(1).join(' ') || '',
        billing_address: order.shippingAddress,
        billing_city: order.shippingCity,
        billing_pincode: order.shippingZip,
        billing_state: order.shippingState,
        billing_country: order.shippingCountry || 'India',
        billing_email: order.shippingEmail,
        billing_phone: order.shippingPhone,
        shipping_is_billing: true,
        order_items: items.map((item) => ({
          name: item.productName,
          sku: `FF-${item.productId || item.id}`,
          units: item.quantity,
          selling_price: item.price,
          discount: 0,
          tax: 0,
        })),
        payment_method: 'Prepaid',
        sub_total: order.subtotal,
        length: 25,
        breadth: 20,
        height: 10,
        weight: 0.5,
      };

      // 1. Create order on Shiprocket
      const shiprocketResponse = await createShiprocketOrder(shiprocketOrderData);

      const updateFields: Record<string, string> = {
        shiprocketOrderId: String(shiprocketResponse.order_id),
        shiprocketShipmentId: String(shiprocketResponse.shipment_id),
        updatedAt: new Date().toISOString(),
      };

      // 2. Generate AWB (courier assignment)
      if (shiprocketResponse.shipment_id) {
        try {
          const awbResponse = await generateAWB(shiprocketResponse.shipment_id);
          updateFields.awbCode = awbResponse.awb_code;
          updateFields.courierName = awbResponse.courier_name;
          updateFields.trackingUrl = `https://shiprocket.co/tracking/${awbResponse.awb_code}`;
        } catch (awbError) {
          console.error('[Shiprocket] AWB generation failed (non-blocking):', awbError);
        }
      }

      // 3. Generate shipping label
      if (shiprocketResponse.shipment_id) {
        try {
          const labelResponse = await generateLabel(shiprocketResponse.shipment_id);
          if (labelResponse.label_url) {
            updateFields.shippingLabelUrl = labelResponse.label_url;
          }
        } catch (labelError) {
          console.error('[Shiprocket] Label generation failed (non-blocking):', labelError);
        }
      }

      // 4. Save all Shiprocket details back to the order
      await db
        .update(orders)
        .set(updateFields)
        .where(eq(orders.orderNumber, order_number));

      console.log(`[Shiprocket] Successfully processed order ${order_number}`);
    } catch (shiprocketError) {
      // Shiprocket failure should NOT block checkout
      console.error('[Shiprocket] Integration failed (non-blocking):', shiprocketError);
    }

    return NextResponse.json({ success: true, message: 'Payment verified successfully' });
  } catch (error: any) {
    console.error('Razorpay Payment Verification Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
