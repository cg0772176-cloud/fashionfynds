import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/db";
import { brands } from "@/db/schema";
import { desc } from "drizzle-orm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import AdminPartnersClient from "./admin-partners-client";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "").split(",").map(s => s.trim()).filter(Boolean);

export default async function AdminPartnersPage() {
  const user = await getCurrentUser();
  if (!user || (ADMIN_EMAILS.length > 0 && !ADMIN_EMAILS.includes(user.email))) {
    redirect("/login");
  }

  const allBrands = await db.select().from(brands).orderBy(desc(brands.createdAt));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Partner Brands</h1>
        <p className="text-muted-foreground">Manage and vet marketplace brands.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Brands</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Brand Name</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Tier</TableHead>
                <TableHead>Commission</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {allBrands.map((brand) => (
                <TableRow key={brand.id}>
                  <TableCell className="font-medium">{brand.name}</TableCell>
                  <TableCell>{brand.slug}</TableCell>
                  <TableCell>
                    <Badge variant={
                      brand.status === 'approved' ? 'default' : 
                      brand.status === 'suspended' ? 'destructive' : 
                      'secondary'
                    }>
                      {brand.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="capitalize">{brand.subscriptionTier}</TableCell>
                  <TableCell>{brand.commissionRate}%</TableCell>
                  <TableCell className="text-right">
                    <AdminPartnersClient brandId={brand.id} currentStatus={brand.status || 'pending'} />
                  </TableCell>
                </TableRow>
              ))}
              {allBrands.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
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
