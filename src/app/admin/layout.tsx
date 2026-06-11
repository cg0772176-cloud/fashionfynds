import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import AdminLayoutClient from "./admin-layout-client";
import { headers } from "next/headers";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Pass the request to getCurrentUser
  const headersList = await headers();
  
  // Actually we need to make sure getCurrentUser takes the NextRequest, but here we can just pass a dummy or use better-auth server-side.
  // Wait, in src/lib/auth.ts, getCurrentUser is:
  // export async function getCurrentUser(request: NextRequest) {
  //   const session = await auth.api.getSession({ headers: await headers() });
  //   return session?.user || null;
  // }
  
  // So we can just call it with a dummy request since it uses headers() natively inside it!
  const user = await getCurrentUser(null as any);

  if (process.env.NODE_ENV !== "development") {
    if (!user || user.role !== "admin") {
      redirect("/");
    }
  }

  return <AdminLayoutClient>{children}</AdminLayoutClient>;
}
