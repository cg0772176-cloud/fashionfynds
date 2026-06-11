"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Upload } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";

export default function MarketingClient({ brandId, tier, amount }: { brandId: number, tier: "pro" | "elite" | "upload", amount: number }) {
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    // Load Razorpay script
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);
    return () => { document.body.removeChild(script); };
  }, []);

  const handleSubscribe = async () => {
    setLoading(true);
    try {
      // 1. Init order
      const res = await fetch("/api/checkout/razorpay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: amount,
          receipt: `brand_sub_${tier}_${brandId}_${Date.now()}`,
        }),
      });
      const order = await res.json();

      if (order.error) throw new Error(order.error);

      // 2. Open Razorpay Checkout
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "rzp_test_placeholder",
        amount: order.amount,
        currency: order.currency,
        name: "FashionFynds Subscriptions",
        description: `${tier.toUpperCase()} Tier Upgrade`,
        order_id: order.id,
        handler: async function (response: any) {
          // Verify
          const verifyRes = await fetch("/api/partner/marketing/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...response, brandId, tier, amount }),
          });
          if (verifyRes.ok) {
            toast.success(`Upgraded to ${tier.toUpperCase()} successfully!`);
            window.location.reload();
          } else {
            toast.error("Verification failed.");
          }
        },
        theme: { color: "#0f172a" },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();

    } catch (err: any) {
      toast.error(err.message || "Failed to initialize payment");
    } finally {
      setLoading(false);
    }
  };

  const handleUploadStory = async () => {
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("brandId", String(brandId));
      
      const res = await fetch("/api/partner/stories/upload", {
        method: "POST",
        body: formData,
      });
      
      if (!res.ok) throw new Error("Upload failed");
      toast.success("Story uploaded successfully!");
      setFile(null);
      window.location.reload();
    } catch (err) {
      toast.error("Failed to upload story");
    } finally {
      setUploading(false);
    }
  };

  if (tier === "upload") {
    return (
      <div className="flex items-center gap-2">
        <Input type="file" accept="image/*,video/*" onChange={e => setFile(e.target.files?.[0] || null)} className="max-w-[200px]" />
        <Button onClick={handleUploadStory} disabled={!file || uploading}>
           {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
           Upload
        </Button>
      </div>
    );
  }

  return (
    <Button className="w-full" variant={tier === "pro" ? "default" : "secondary"} onClick={handleSubscribe} disabled={loading}>
      {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : `Subscribe to ${tier.charAt(0).toUpperCase() + tier.slice(1)}`}
    </Button>
  );
}
