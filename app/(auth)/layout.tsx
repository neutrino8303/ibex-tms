import { Plane } from "lucide-react";
import { APP_NAME } from "@/lib/app-config";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <div className="hidden w-1/2 flex-col justify-between bg-primary p-10 text-primary-foreground lg:flex">
        <div className="flex items-center gap-2">
          <Plane className="size-6" />
          <span className="text-lg font-semibold tracking-tight">
            {APP_NAME}
          </span>
        </div>
        <div>
          <h1 className="max-w-md text-3xl font-semibold leading-tight">
            Training records that stay current when checks are signed off.
          </h1>
          <p className="mt-4 max-w-md text-sm text-primary-foreground/80">
            Evaluation forms are the source of truth — linked pilot
            qualifications renew automatically after a successful sign-off.
          </p>
        </div>
        <p className="text-xs text-primary-foreground/60">
          MVP · Single organization · Lisbon & Porto bases
        </p>
      </div>
      <div className="flex flex-1 items-center justify-center overflow-y-auto bg-background p-6">
        {children}
      </div>
    </div>
  );
}
