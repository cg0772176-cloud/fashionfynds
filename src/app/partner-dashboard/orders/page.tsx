"use client";

import { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface OrderItem {
  id: number;
  orderId: number;
  productId: number | null;
  productName: string;
  productImage: string;
  quantity: number;
  price: number;
  selectedSize: string;
  selectedColor: string;
  createdAt: string;
}

interface Order {
  id: number;
  userId: string;
  orderNumber: string;
  status: string;
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
  shippingName: string;
  shippingEmail: string;
  shippingPhone: string;
  shippingAddress: string;
  shippingCity: string;
  shippingState: string;
  shippingZip: string;
  shippingCountry: string;
  paymentMethod: string;
  shiprocketOrderId: string | null;
  shiprocketShipmentId: string | null;
  awbCode: string | null;
  courierName: string | null;
  trackingUrl: string | null;
  shippingLabelUrl: string | null;
  estimatedDelivery: string | null;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
  brandItems: OrderItem[];
}

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending: { label: "Pending", variant: "outline" },
  processing: { label: "Processing", variant: "secondary" },
  shipped: { label: "Shipped", variant: "default" },
  delivered: { label: "Delivered", variant: "default" },
  cancelled: { label: "Cancelled", variant: "destructive" },
};

export default function PartnerOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchOrders() {
      try {
        const response = await fetch("/api/partner/orders");
        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "Failed to fetch orders");
        }
        const data = await response.json();
        setOrders(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchOrders();
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-muted-foreground text-sm">Loading orders...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-destructive font-medium mb-2">Error</p>
              <p className="text-muted-foreground text-sm">{error}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Orders</h1>
          <p className="text-muted-foreground mt-1">
            Manage and track orders for your brand&apos;s products
          </p>
        </div>
        <Badge variant="secondary" className="text-sm px-3 py-1">
          {orders.length} {orders.length === 1 ? "order" : "orders"}
        </Badge>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Orders</CardDescription>
            <CardTitle className="text-2xl">{orders.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Processing</CardDescription>
            <CardTitle className="text-2xl">
              {orders.filter((o) => o.status === "processing").length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Shipped</CardDescription>
            <CardTitle className="text-2xl">
              {orders.filter((o) => o.status === "shipped").length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Revenue</CardDescription>
            <CardTitle className="text-2xl">
              {formatCurrency(
                orders.reduce((sum, o) => sum + o.total, 0)
              )}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle>Order History</CardTitle>
          <CardDescription>
            All orders containing your brand&apos;s products with shipping details
          </CardDescription>
        </CardHeader>
        <CardContent>
          {orders.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-lg">No orders yet</p>
              <p className="text-muted-foreground text-sm mt-1">
                Orders will appear here when customers purchase your products
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order #</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Courier</TableHead>
                  <TableHead>AWB</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => {
                  const status = statusConfig[order.status] || {
                    label: order.status,
                    variant: "outline" as const,
                  };

                  return (
                    <TableRow key={order.id}>
                      {/* Order Number */}
                      <TableCell className="font-mono text-sm font-medium">
                        {order.orderNumber}
                      </TableCell>

                      {/* Customer */}
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium text-sm">
                            {order.shippingName}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {order.shippingCity}, {order.shippingState}
                          </span>
                        </div>
                      </TableCell>

                      {/* Items */}
                      <TableCell>
                        <div className="flex flex-col gap-0.5">
                          {order.brandItems.slice(0, 2).map((item) => (
                            <span
                              key={item.id}
                              className="text-xs text-muted-foreground"
                            >
                              {item.productName} ×{item.quantity}
                            </span>
                          ))}
                          {order.brandItems.length > 2 && (
                            <span className="text-xs text-muted-foreground">
                              +{order.brandItems.length - 2} more
                            </span>
                          )}
                        </div>
                      </TableCell>

                      {/* Total */}
                      <TableCell className="font-medium">
                        {formatCurrency(order.total)}
                      </TableCell>

                      {/* Status */}
                      <TableCell>
                        <Badge variant={status.variant}>{status.label}</Badge>
                      </TableCell>

                      {/* Courier */}
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {order.courierName || "—"}
                        </span>
                      </TableCell>

                      {/* AWB */}
                      <TableCell>
                        {order.awbCode ? (
                          <span className="font-mono text-xs bg-muted px-2 py-1 rounded">
                            {order.awbCode}
                          </span>
                        ) : (
                          <span className="text-sm text-muted-foreground">—</span>
                        )}
                      </TableCell>

                      {/* Date */}
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(order.createdAt)}
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {order.shippingLabelUrl && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                window.open(order.shippingLabelUrl!, "_blank")
                              }
                            >
                              Label
                            </Button>
                          )}
                          {order.trackingUrl && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                window.open(order.trackingUrl!, "_blank")
                              }
                            >
                              Track
                            </Button>
                          )}
                          {!order.trackingUrl && !order.shippingLabelUrl && (
                            <span className="text-xs text-muted-foreground">
                              Awaiting shipment
                            </span>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
