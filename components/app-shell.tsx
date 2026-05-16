import { getCurrentUser } from "@/lib/auth";
import { getNavigationForUser } from "@/lib/navigation";
import { AppHeader } from "@/components/app-header";
import { AppSidebar } from "@/components/app-sidebar";

type AppShellProps = {
  children: React.ReactNode;
};

export async function AppShell({ children }: AppShellProps) {
  const user = await getCurrentUser();
  if (!user) {
    return null;
  }

  const sections = getNavigationForUser(user);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <AppSidebar sections={sections} />
      <div className="flex min-w-0 flex-1 flex-col">
        <AppHeader user={user} />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
