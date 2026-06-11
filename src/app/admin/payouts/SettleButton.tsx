"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function SettleButton({ brandId, amount }: { brandId: number, amount: number }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSettle() {
    if (!confirm(`Are you sure you want to mark $${amount.toFixed(2)} as paid for this brand?`)) return;
    
    setLoading(true);
    try {
      const res = await fetch("/api/admin/payouts/settle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brandId }),
      });
      if (res.ok) {
        router.refresh();
      } else {
        alert("Failed to settle");
      }
    } catch (e) {
      alert("Error occurred");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button 
      size="sm" 
      onClick={handleSettle} 
      disabled={loading}
    >
      {loading ? "Processing..." : "Mark as Paid"}
    </Button>
  );
}
