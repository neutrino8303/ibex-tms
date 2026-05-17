import { redirect } from "next/navigation";
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
    redirect("/login");
  }

  const sections = getNavigationForUser(user);

  return (
    <div className="flex h-screen overflow-hidden">
      <AppSidebar sections={sections} />
      <div className="flex min-w-0 flex-1 flex-col">
        <AppHeader user={user} />
        <main className="flex-1 overflow-y-auto px-5 py-6 sm:px-8 sm:py-7">
          {children}
        </main>
      </div>
    </div>
  );
}
