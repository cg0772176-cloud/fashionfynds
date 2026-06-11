/**
 * Shiprocket API Integration Module
 *
 * Provides utility functions for interacting with Shiprocket's REST API
 * for logistics and shipping management in FashionFynds.
 */

const SHIPROCKET_BASE_URL = 'https://apiv2.shiprocket.in/v1/external';

// In-memory token cache
let cachedToken: string | null = null;
let tokenExpiresAt: number = 0;

/**
 * Authenticates with Shiprocket and returns a cached bearer token.
 * Tokens are cached for 9 days (Shiprocket tokens are valid for 10 days).
 */
export async function getShiprocketToken(): Promise<string> {
  // Return cached token if still valid
  if (cachedToken && Date.now() < tokenExpiresAt) {
    return cachedToken;
  }

  const email = process.env.SHIPROCKET_EMAIL;
  const password = process.env.SHIPROCKET_PASSWORD;

  if (!email || !password) {
    throw new Error('Shiprocket credentials not configured. Set SHIPROCKET_EMAIL and SHIPROCKET_PASSWORD env vars.');
  }

  try {
    const response = await fetch(`${SHIPROCKET_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Shiprocket auth failed (${response.status}): ${errorBody}`);
    }

    const data = await response.json();
    cachedToken = data.token;
    // Cache for 9 days (Shiprocket tokens are valid for 10 days)
    tokenExpiresAt = Date.now() + 9 * 24 * 60 * 60 * 1000;

    console.log('[Shiprocket] Authentication successful');
    return cachedToken!;
  } catch (error) {
    console.error('[Shiprocket] Authentication error:', error);
    throw error;
  }
}

/** Type for order data passed to createShiprocketOrder */
export interface ShiprocketOrderData {
  order_id: string;
  order_date: string;
  pickup_location?: string;
  billing_customer_name: string;
  billing_last_name?: string;
  billing_address: string;
  billing_city: string;
  billing_pincode: string;
  billing_state: string;
  billing_country: string;
  billing_email: string;
  billing_phone: string;
  shipping_is_billing: boolean;
  shipping_customer_name?: string;
  shipping_address?: string;
  shipping_city?: string;
  shipping_pincode?: string;
  shipping_state?: string;
  shipping_country?: string;
  order_items: {
    name: string;
    sku: string;
    units: number;
    selling_price: number;
    discount?: number;
    tax?: number;
    hsn?: string;
  }[];
  payment_method: 'Prepaid' | 'COD';
  sub_total: number;
  length: number;
  breadth: number;
  height: number;
  weight: number;
}

/** Response from Shiprocket order creation */
export interface ShiprocketOrderResponse {
  order_id: number;
  shipment_id: number;
  status: string;
  status_code: number;
  onboarding_completed_now?: number;
  awb_code?: string;
  courier_company_id?: string;
  courier_name?: string;
}

/**
 * Creates an order on Shiprocket after payment verification.
 */
export async function createShiprocketOrder(
  orderData: ShiprocketOrderData
): Promise<ShiprocketOrderResponse> {
  try {
    const token = await getShiprocketToken();

    const payload = {
      ...orderData,
      pickup_location: orderData.pickup_location || 'Primary',
      channel_id: '',
      comment: `FashionFynds Order ${orderData.order_id}`,
    };

    const response = await fetch(`${SHIPROCKET_BASE_URL}/orders/create/adhoc`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Shiprocket create order failed (${response.status}): ${errorBody}`);
    }

    const data = await response.json();
    console.log('[Shiprocket] Order created successfully:', data.order_id);
    return data;
  } catch (error) {
    console.error('[Shiprocket] Create order error:', error);
    throw error;
  }
}

/** Response from AWB generation */
export interface AWBResponse {
  awb_code: string;
  courier_company_id: number;
  courier_name: string;
  applied_weight: number;
  freight_charge?: number;
}

/**
 * Assigns a courier and generates an AWB (Air Way Bill) for a shipment.
 */
export async function generateAWB(shipmentId: number): Promise<AWBResponse> {
  try {
    const token = await getShiprocketToken();

    const response = await fetch(`${SHIPROCKET_BASE_URL}/courier/assign/awb`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ shipment_id: shipmentId }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Shiprocket AWB generation failed (${response.status}): ${errorBody}`);
    }

    const data = await response.json();
    const awbData = data.response?.data;

    if (!awbData?.awb_code) {
      throw new Error('AWB code not found in Shiprocket response');
    }

    console.log('[Shiprocket] AWB generated:', awbData.awb_code);
    return {
      awb_code: awbData.awb_code,
      courier_company_id: awbData.courier_company_id,
      courier_name: awbData.courier_name,
      applied_weight: awbData.applied_weight,
      freight_charge: awbData.freight_charge,
    };
  } catch (error) {
    console.error('[Shiprocket] AWB generation error:', error);
    throw error;
  }
}

/**
 * Gets the shipping label PDF URL for a shipment.
 */
export async function generateLabel(
  shipmentId: number
): Promise<{ label_url: string }> {
  try {
    const token = await getShiprocketToken();

    const response = await fetch(`${SHIPROCKET_BASE_URL}/courier/generate/label`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ shipment_id: [shipmentId] }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Shiprocket label generation failed (${response.status}): ${errorBody}`);
    }

    const data = await response.json();
    const labelUrl = data.label_url || data.response;

    console.log('[Shiprocket] Label generated for shipment:', shipmentId);
    return { label_url: labelUrl };
  } catch (error) {
    console.error('[Shiprocket] Label generation error:', error);
    throw error;
  }
}

/** Tracking data from Shiprocket */
export interface TrackingData {
  tracking_data: {
    track_status: number;
    shipment_status: number;
    shipment_track: {
      id: number;
      awb_code: string;
      courier_company_id: number;
      shipment_id: number;
      order_id: number;
      pickup_date: string | null;
      delivered_date: string | null;
      weight: string;
      packages: number;
      current_status: string;
      delivered_to: string;
      destination: string;
      consignee_name: string;
      origin: string;
      courier_agent_details: string | null;
      edd: string | null;
    }[];
    shipment_track_activities: {
      date: string;
      status: string;
      activity: string;
      location: string;
    }[];
    track_url: string;
    etd: string;
  };
}

/**
 * Gets tracking information for a shipment by order ID.
 */
export async function trackShipment(orderId: number): Promise<TrackingData> {
  try {
    const token = await getShiprocketToken();

    const response = await fetch(
      `${SHIPROCKET_BASE_URL}/courier/track/shipment/order/${orderId}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Shiprocket tracking failed (${response.status}): ${errorBody}`);
    }

    const data = await response.json();
    console.log('[Shiprocket] Tracking data retrieved for order:', orderId);
    return data;
  } catch (error) {
    console.error('[Shiprocket] Tracking error:', error);
    throw error;
  }
}

/**
 * Cancels an order on Shiprocket.
 */
export async function cancelOrder(orderId: number): Promise<{ status: string }> {
  try {
    const token = await getShiprocketToken();

    const response = await fetch(`${SHIPROCKET_BASE_URL}/orders/cancel`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ ids: [orderId] }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Shiprocket cancel order failed (${response.status}): ${errorBody}`);
    }

    const data = await response.json();
    console.log('[Shiprocket] Order cancelled:', orderId);
    return { status: data.status || 'cancelled' };
  } catch (error) {
    console.error('[Shiprocket] Cancel order error:', error);
    throw error;
  }
}
