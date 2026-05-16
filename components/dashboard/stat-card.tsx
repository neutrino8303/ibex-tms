import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

type StatCardProps = {
  title: string;
  value: number | string;
  description?: string;
  icon?: LucideIcon;
  href?: string;
  tone?: "default" | "warning" | "danger" | "muted";
};

const toneStyles = {
  default: "text-foreground",
  warning: "text-amber-600 dark:text-amber-400",
  danger: "text-red-600 dark:text-red-400",
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
    <Card className={cn(href && "transition-colors hover:bg-muted/40")}>
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <div>
          <CardDescription>{title}</CardDescription>
          <CardTitle
            className={cn("text-3xl font-semibold tabular-nums", toneStyles[tone])}
          >
            {value}
          </CardTitle>
        </div>
        {Icon && (
          <Icon className="size-5 text-muted-foreground" aria-hidden />
        )}
      </CardHeader>
      {description && (
        <CardContent>
          <p className="text-sm text-muted-foreground">{description}</p>
        </CardContent>
      )}
    </Card>
  );

  if (href) {
    return (
      <Link href={href} className="block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
        {content}
      </Link>
    );
  }

  return content;
}
