import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { orders, orderItems } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import {
  createShiprocketOrder,
  generateAWB,
  generateLabel,
  cancelOrder,
  type ShiprocketOrderData,
} from '@/lib/shiprocket';

async function requireAdmin() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return { error: NextResponse.json({ error: 'Authentication required' }, { status: 401 }) };
  }
  if (session.user.role !== 'admin') {
    return { error: NextResponse.json({ error: 'Admin access required' }, { status: 403 }) };
  }
  return { user: session.user };
}

export async function POST(req: NextRequest) {
  const authResult = await requireAdmin();
  if ('error' in authResult && authResult.error) return authResult.error;

  try {
    const { action, orderId } = await req.json();

    if (!action || !orderId) {
      return NextResponse.json(
        { error: 'Missing required fields: action, orderId' },
        { status: 400 }
      );
    }

    // Fetch the order
    const [order] = await db
      .select()
      .from(orders)
      .where(eq(orders.id, orderId))
      .limit(1);

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    switch (action) {
      case 'create_shipment': {
        // Fetch order items
        const items = await db
          .select()
          .from(orderItems)
          .where(eq(orderItems.orderId, order.id));

        const shiprocketOrderData: ShiprocketOrderData = {
          order_id: order.orderNumber,
          order_date:
            new Date(order.createdAt).toISOString().split('T')[0] +
            ' ' +
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
          payment_method: order.paymentMethod === 'cod' ? 'COD' : 'Prepaid',
          sub_total: order.subtotal,
          length: 25,
          breadth: 20,
          height: 10,
          weight: 0.5,
        };

        // Create shipment
        const shiprocketResponse = await createShiprocketOrder(shiprocketOrderData);

        const updateFields: Record<string, string> = {
          shiprocketOrderId: String(shiprocketResponse.order_id),
          shiprocketShipmentId: String(shiprocketResponse.shipment_id),
          updatedAt: new Date().toISOString(),
        };

        // Generate AWB
        if (shiprocketResponse.shipment_id) {
          try {
            const awbResponse = await generateAWB(shiprocketResponse.shipment_id);
            updateFields.awbCode = awbResponse.awb_code;
            updateFields.courierName = awbResponse.courier_name;
            updateFields.trackingUrl = `https://shiprocket.co/tracking/${awbResponse.awb_code}`;
          } catch (awbError) {
            console.error('[Admin Shiprocket] AWB generation failed:', awbError);
          }
        }

        // Generate label
        if (shiprocketResponse.shipment_id) {
          try {
            const labelResponse = await generateLabel(shiprocketResponse.shipment_id);
            if (labelResponse.label_url) {
              updateFields.shippingLabelUrl = labelResponse.label_url;
            }
          } catch (labelError) {
            console.error('[Admin Shiprocket] Label generation failed:', labelError);
          }
        }

        // Update order
        await db.update(orders).set(updateFields).where(eq(orders.id, orderId));

        return NextResponse.json({
          success: true,
          message: 'Shipment created successfully',
          data: updateFields,
        });
      }

      case 'cancel': {
        if (!order.shiprocketOrderId) {
          return NextResponse.json(
            { error: 'No Shiprocket order found for this order' },
            { status: 400 }
          );
        }

        await cancelOrder(parseInt(order.shiprocketOrderId));

        // Update local order status
        await db
          .update(orders)
          .set({
            status: 'cancelled',
            updatedAt: new Date().toISOString(),
          })
          .where(eq(orders.id, orderId));

        return NextResponse.json({
          success: true,
          message: 'Order cancelled on Shiprocket',
        });
      }

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}. Use 'create_shipment' or 'cancel'.` },
          { status: 400 }
        );
    }
  } catch (error: any) {
    console.error('[Admin Shiprocket] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
