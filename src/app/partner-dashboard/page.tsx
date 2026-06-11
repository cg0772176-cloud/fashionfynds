import { getCurrentUser } from "@/lib/auth";
import { db } from "@/db";
import { brands, products, payouts } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { Package, Clock, DollarSign, CheckCircle } from "lucide-react";

export default async function PartnerDashboardPage() {
  const user = await getCurrentUser(null as any);
  
  if (!user) return null;

  // Find their brand
  const brandRecord = await db.select().from(brands).where(eq(brands.ownerId, user.id)).limit(1);
  const brand = brandRecord[0];

  if (!brand) {
    return (
      <div className="p-8 text-center bg-white rounded-xl shadow-sm border border-gray-100">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome, {user.name}!</h2>
        <p className="text-gray-500">Your brand application has been approved, but your store is being configured. Please contact support if this persists.</p>
      </div>
    );
  }

  // Fetch some stats
  const productCountResult = await db.select({ count: sql`count(*)` }).from(products).where(eq(products.brandId, brand.id));
  const productCount = Number(productCountResult[0]?.count || 0);

  // Fetch payouts
  const allPayouts = await db.select().from(payouts).where(eq(payouts.brandId, brand.id));
  
  const pendingEscrow = allPayouts.filter(p => p.status === 'held').reduce((acc, p) => acc + p.amountDue, 0);
  const readyForPayout = allPayouts.filter(p => p.status === 'ready_for_payout').reduce((acc, p) => acc + p.amountDue, 0);
  const totalPaid = allPayouts.filter(p => p.status === 'paid').reduce((acc, p) => acc + p.amountDue, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Welcome back, {brand.name}</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-yellow-100 text-yellow-600 rounded-lg flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Pending Escrow (T+7)</p>
            <h3 className="text-2xl font-bold text-gray-900">${pendingEscrow.toFixed(2)}</h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-green-100 text-green-600 rounded-lg flex items-center justify-center">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Ready for Payout</p>
            <h3 className="text-2xl font-bold text-gray-900">${readyForPayout.toFixed(2)}</h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Total Paid</p>
            <h3 className="text-2xl font-bold text-gray-900">${totalPaid.toFixed(2)}</h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Active Products</p>
            <h3 className="text-2xl font-bold text-gray-900">{productCount}</h3>
          </div>
        </div>
      </div>
      
      <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Recent Orders</h2>
        <div className="text-center py-12 text-gray-500">
          No orders yet. Add some products to get started!
        </div>
      </div>
    </div>
  );
}
