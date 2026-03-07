import { MemberShell } from "@/components/shell/member-shell";
import { requireUser } from "@/lib/auth";

export default async function AppLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const user = await requireUser();

  return (
    <MemberShell user={user}>
      {children}
    </MemberShell>
  );
}
