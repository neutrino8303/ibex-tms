import { QualStatus } from "@prisma/client";
import {
  qualStatusBadgeVariant,
  qualStatusLabel,
} from "@/lib/qualifications";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const statusStyles: Record<
  ReturnType<typeof qualStatusBadgeVariant>,
  string
> = {
  valid: "border-emerald-200 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300",
  expiring:
    "border-amber-200 bg-amber-50 text-amber-900 dark:bg-amber-950/40 dark:text-amber-300",
  expired:
    "border-red-200 bg-red-50 text-red-800 dark:bg-red-950/40 dark:text-red-300",
  suspended:
    "border-slate-200 bg-slate-100 text-slate-600 dark:bg-slate-800/60 dark:text-slate-300",
};

type QualStatusBadgeProps = {
  status: QualStatus;
  className?: string;
};

export function QualStatusBadge({ status, className }: QualStatusBadgeProps) {
  const variant = qualStatusBadgeVariant(status);
  return (
    <Badge
      variant="outline"
      className={cn(statusStyles[variant], className)}
    >
      {qualStatusLabel[status]}
    </Badge>
  );
}
