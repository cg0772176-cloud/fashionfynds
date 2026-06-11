import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { brands, payouts } from "@/db/schema";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import SettleButton from "./SettleButton";

export default async function AdminPayoutsPage() {
  const user = await getCurrentUser(null as any);
  if (!user || user.role !== "admin") {
    redirect("/");
  }

  const allBrands = await db.select().from(brands);
  const allPayouts = await db.select().from(payouts);

  // Group payouts by brand
  const payoutsByBrand = allBrands.map(brand => {
    const brandPayouts = allPayouts.filter(p => p.brandId === brand.id);
    const pendingEscrow = brandPayouts.filter(p => p.status === 'held').reduce((acc, p) => acc + p.amountDue, 0);
    const readyForPayout = brandPayouts.filter(p => p.status === 'ready_for_payout').reduce((acc, p) => acc + p.amountDue, 0);
    const totalPaid = brandPayouts.filter(p => p.status === 'paid').reduce((acc, p) => acc + p.amountDue, 0);

    return {
      ...brand,
      pendingEscrow,
      readyForPayout,
      totalPaid
    };
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Payouts Ledger</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Brand Balances</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Brand</TableHead>
                <TableHead>Pending Escrow</TableHead>
                <TableHead>Ready for Payout</TableHead>
                <TableHead>Total Paid</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payoutsByBrand.map((brand) => (
                <TableRow key={brand.id}>
                  <TableCell className="font-medium">{brand.name}</TableCell>
                  <TableCell>${brand.pendingEscrow.toFixed(2)}</TableCell>
                  <TableCell>
                    {brand.readyForPayout > 0 ? (
                      <Badge variant="default" className="bg-green-600 hover:bg-green-700">
                        ${brand.readyForPayout.toFixed(2)}
                      </Badge>
                    ) : (
                      <span className="text-gray-500">${brand.readyForPayout.toFixed(2)}</span>
                    )}
                  </TableCell>
                  <TableCell>${brand.totalPaid.toFixed(2)}</TableCell>
                  <TableCell>
                    {brand.readyForPayout > 0 ? (
                      <SettleButton brandId={brand.id} amount={brand.readyForPayout} />
                    ) : (
                      <span className="text-gray-400 text-sm">No pending</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {payoutsByBrand.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-6">
                    No brands found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
