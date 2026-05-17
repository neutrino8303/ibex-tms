import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type StatCardProps = {
  title: string;
  value: number | string;
  description?: string;
  icon?: LucideIcon;
  href?: string;
  tone?: "default" | "warning" | "danger" | "muted";
};

const toneBar = {
  default: "bg-primary",
  warning: "bg-amber-500",
  danger: "bg-destructive",
  muted: "bg-muted-foreground/40",
};

const toneValue = {
  default: "text-foreground",
  warning: "text-amber-700",
  danger: "text-destructive",
  muted: "text-muted-foreground",
};

export function StatCard({
  title,
  value,
  description,
  icon: Icon,
  href,
  tone = "default",
}: StatCardProps) {
  const content = (
    <article
      className={cn(
        "ops-panel relative overflow-hidden p-4 transition-colors",
        href && "hover:border-accent/40 hover:bg-card",
      )}
    >
      <div className={cn("absolute inset-x-0 top-0 h-0.5", toneBar[tone])} />
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
            {title}
          </p>
          <p
            className={cn(
              "mt-1 font-heading text-3xl font-semibold tabular-nums leading-none",
              toneValue[tone],
            )}
          >
            {value}
          </p>
        </div>
        {Icon && (
          <Icon
            className="mt-0.5 size-4 shrink-0 text-muted-foreground/60"
            aria-hidden
          />
        )}
      </div>
      {description && (
        <p className="mt-2 text-xs text-muted-foreground">{description}</p>
      )}
    </article>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="block rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {content}
      </Link>
    );
  }

  return content;
}
