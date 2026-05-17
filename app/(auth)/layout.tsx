import { APP_TAGLINE } from "@/lib/app-config";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <div className="auth-grid-bg relative hidden w-[44%] flex-col justify-between overflow-hidden p-10 text-white lg:flex">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-black/25" />
        <div className="relative z-10">
          <p className="font-heading text-lg font-semibold uppercase tracking-wide">
            IBEX
          </p>
          <p className="text-[0.65rem] font-medium uppercase tracking-[0.16em] text-white/55">
            {APP_TAGLINE}
          </p>
        </div>

        <div className="relative z-10 max-w-md space-y-4">
          <p className="font-heading text-3xl font-semibold leading-[1.15] tracking-tight">
            Qualifications tied to signed evaluations.
          </p>
          <p className="text-sm leading-relaxed text-white/70">
            When an examiner signs off a check, linked pilot qualifications renew
            from the evaluation record — one source of truth for training
            compliance.
          </p>
        </div>

        <p className="relative z-10 text-[0.65rem] font-medium uppercase tracking-[0.14em] text-white/45">
          Lisbon & Porto · Single organization
        </p>
      </div>

      <div className="flex flex-1 items-center justify-center overflow-y-auto bg-background p-6 sm:p-10">
        {children}
      </div>
    </div>
  );
}
