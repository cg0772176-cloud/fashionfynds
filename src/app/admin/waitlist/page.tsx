import { db } from "@/db";
import { newsletterSubscribers } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default async function AdminWaitlistPage() {
  // Fetch only people who joined via the Waitlist Landing Page
  const waitlist = await db
    .select()
    .from(newsletterSubscribers)
    .where(eq(newsletterSubscribers.source, 'waitlist_landing_page'))
    .orderBy(desc(newsletterSubscribers.createdAt));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Pre-Launch Waitlist</h1>
          <p className="text-muted-foreground mt-1">
            Manage the people who signed up for early access.
          </p>
        </div>
        <Badge variant="secondary" className="text-sm px-3 py-1">
          {waitlist.length} {waitlist.length === 1 ? "Lead" : "Leads"} Captured
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Waitlist Leads</CardTitle>
          <CardDescription>All emails captured from the new landing page.</CardDescription>
        </CardHeader>
        <CardContent>
          {waitlist.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-lg">No one has joined the waitlist yet.</p>
              <p className="text-muted-foreground text-sm mt-1">Try entering an email on the homepage!</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email Address</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date Joined</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {waitlist.map((subscriber) => (
                  <TableRow key={subscriber.id}>
                    <TableCell className="font-medium">{subscriber.email}</TableCell>
                    <TableCell>
                      <Badge variant={subscriber.active ? "default" : "secondary"}>
                        {subscriber.active ? "Active" : "Unsubscribed"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(subscriber.createdAt).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit"
                      })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
