import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/db";
import { brands, marketingPayments, brandStories } from "@/db/schema";
import { eq } from "drizzle-orm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Megaphone, Activity, Play, Star } from "lucide-react";
import MarketingClient from "./marketing-client";

export default async function PartnerMarketingPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  // Get the brand for this user
  const brandList = await db.select().from(brands).where(eq(brands.ownerId, user.id));
  if (brandList.length === 0) redirect("/partner-dashboard");
  
  const brand = brandList[0];

  // Get past payments
  const payments = await db
    .select()
    .from(marketingPayments)
    .where(eq(marketingPayments.brandId, brand.id));

  // Get active stories
  const now = new Date().toISOString();
  const activeStoriesList = await db
    .select()
    .from(brandStories)
    .where(eq(brandStories.brandId, brand.id));
    
  // Filter for those where expiresAt > now
  const activeStories = activeStoriesList.filter(s => s.expiresAt > now);

  // Determine active tier
  const currentTier = brand.subscriptionTier || 'basic';

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Marketing & Subscriptions</h1>
        <p className="text-muted-foreground mt-1">
          Upgrade your brand tier to unlock premium placements, lower commissions, and unlimited products.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Basic Tier */}
        <Card className={`relative ${currentTier === 'basic' ? 'border-primary/50 shadow-md' : ''}`}>
          {currentTier === 'basic' && (
            <Badge className="absolute top-0 right-4 -translate-y-1/2">Current Plan</Badge>
          )}
          <CardHeader>
            <CardTitle className="text-xl">Basic</CardTitle>
            <CardDescription>Perfect for getting started</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-3xl font-bold">
              Free
            </div>
            <ul className="space-y-2 text-sm">
               <li className="flex items-center gap-2 text-muted-foreground"><Activity className="h-4 w-4" /> Up to 50 Products</li>
               <li className="flex items-center gap-2 text-muted-foreground"><Star className="h-4 w-4" /> 15% Commission Rate</li>
               <li className="flex items-center gap-2 text-muted-foreground line-through opacity-50"><Play className="h-4 w-4" /> Homepage Stories</li>
            </ul>
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full" disabled={currentTier === 'basic'}>
               {currentTier === 'basic' ? 'Active' : 'Downgrade'}
            </Button>
          </CardFooter>
        </Card>

        {/* Pro Tier */}
        <Card className={`relative border-primary shadow-lg ${currentTier === 'pro' ? 'bg-primary/5' : ''}`}>
          {currentTier === 'pro' && (
            <Badge className="absolute top-0 right-4 -translate-y-1/2">Current Plan</Badge>
          )}
          <CardHeader>
            <CardTitle className="text-xl text-primary">Pro</CardTitle>
            <CardDescription>Scale your brand visibility</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-3xl font-bold">
              ₹1,499 <span className="text-sm font-normal text-muted-foreground">/ month</span>
            </div>
            <ul className="space-y-2 text-sm">
               <li className="flex items-center gap-2"><Activity className="h-4 w-4 text-primary" /> Unlimited Products</li>
               <li className="flex items-center gap-2"><Star className="h-4 w-4 text-primary" /> 10% Commission Rate</li>
               <li className="flex items-center gap-2"><Play className="h-4 w-4 text-primary" /> 1 Brand Story per week</li>
               <li className="flex items-center gap-2"><Megaphone className="h-4 w-4 text-primary" /> Priority Ranking</li>
            </ul>
          </CardContent>
          <CardFooter>
            {currentTier === 'pro' || currentTier === 'elite' ? (
                <Button className="w-full" variant={currentTier === 'pro' ? 'outline' : 'secondary'} disabled>
                    {currentTier === 'pro' ? 'Active' : 'Downgrade'}
                </Button>
            ) : (
                <MarketingClient brandId={brand.id} tier="pro" amount={1499} />
            )}
          </CardFooter>
        </Card>

        {/* Elite Tier */}
        <Card className={`relative bg-gradient-to-br from-slate-900 to-black text-white ${currentTier === 'elite' ? 'ring-2 ring-yellow-500' : ''}`}>
          {currentTier === 'elite' && (
            <Badge className="absolute top-0 right-4 -translate-y-1/2 bg-yellow-500 hover:bg-yellow-600 text-black">Current Plan</Badge>
          )}
          <CardHeader>
            <CardTitle className="text-xl text-yellow-500 flex items-center gap-2">Elite <Star className="h-4 w-4 fill-yellow-500" /></CardTitle>
            <CardDescription className="text-slate-400">Market dominance & max margins</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-3xl font-bold">
              ₹4,999 <span className="text-sm font-normal text-slate-400">/ month</span>
            </div>
            <ul className="space-y-2 text-sm text-slate-300">
               <li className="flex items-center gap-2"><Activity className="h-4 w-4 text-yellow-500" /> Unlimited Products</li>
               <li className="flex items-center gap-2"><Star className="h-4 w-4 text-yellow-500" /> Lowest 5% Commission Rate</li>
               <li className="flex items-center gap-2"><Play className="h-4 w-4 text-yellow-500" /> Unlimited Daily Stories</li>
               <li className="flex items-center gap-2"><Megaphone className="h-4 w-4 text-yellow-500" /> Featured "Trending Brand"</li>
            </ul>
          </CardContent>
          <CardFooter>
            {currentTier === 'elite' ? (
                 <Button className="w-full bg-slate-800 text-white hover:bg-slate-700" disabled>Active</Button>
            ) : (
                 <MarketingClient brandId={brand.id} tier="elite" amount={4999} />
            )}
          </CardFooter>
        </Card>
      </div>

      {currentTier !== 'basic' && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
               <div>
                 <CardTitle>Your Active Stories</CardTitle>
                 <CardDescription>Stories currently live on the homepage</CardDescription>
               </div>
               <MarketingClient brandId={brand.id} tier="upload" amount={0} />
            </div>
          </CardHeader>
          <CardContent>
            {activeStories.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                 No active stories. Click upload to feature on the homepage!
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-4">
                {activeStories.map(story => (
                  <div key={story.id} className="relative aspect-[9/16] rounded-md overflow-hidden bg-muted border">
                    {story.mediaUrl.match(/\.(mp4|webm)$/i) ? (
                      <video src={story.mediaUrl} className="w-full h-full object-cover" />
                    ) : (
                      <img src={story.mediaUrl} className="w-full h-full object-cover" />
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
