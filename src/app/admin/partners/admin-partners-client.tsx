"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2, CheckCircle, Ban } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function AdminPartnersClient({ brandId, currentStatus }: { brandId: number, currentStatus: string }) {
  const [loading, setLoading] = useState(false);

  const updateStatus = async (status: string) => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/partners", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: brandId, status }),
      });
      if (!res.ok) throw new Error("Failed to update status");
      toast.success(`Brand marked as ${status}`);
      window.location.reload();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Manage"}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {currentStatus !== 'approved' && (
          <DropdownMenuItem onClick={() => updateStatus("approved")}>
            <CheckCircle className="h-4 w-4 mr-2 text-green-500" /> Approve
          </DropdownMenuItem>
        )}
        {currentStatus !== 'suspended' && (
          <DropdownMenuItem onClick={() => updateStatus("suspended")}>
            <Ban className="h-4 w-4 mr-2 text-red-500" /> Suspend
          </DropdownMenuItem>
        )}
        {currentStatus !== 'pending' && (
          <DropdownMenuItem onClick={() => updateStatus("pending")}>
             Mark as Pending
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
