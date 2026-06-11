import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import PartnerLayoutClient from "./partner-layout-client";
import { headers } from "next/headers";

export default async function PartnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headersList = await headers();
  const user = await getCurrentUser(null as any);

  // Allow only partners or admins to view the partner dashboard
  if (!user || (user.role !== "partner" && user.role !== "admin")) {
    redirect("/");
  }

  return <PartnerLayoutClient user={user}>{children}</PartnerLayoutClient>;
}
