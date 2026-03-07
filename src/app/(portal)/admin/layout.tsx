import { AdminShell } from "@/components/shell/admin-shell";
import { requireAdmin } from "@/lib/auth";

export default async function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const user = await requireAdmin();

  return (
    <AdminShell user={user}>
      {children}
    </AdminShell>
  );
}
