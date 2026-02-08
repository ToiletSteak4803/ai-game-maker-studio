import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/tokens";

export default async function StudioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/auth/login");
  }

  return <>{children}</>;
}
