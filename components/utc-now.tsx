"use client";

import { format } from "date-fns";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

type UtcNowProps = {
  className?: string;
  compact?: boolean;
};

export function UtcNow({ className, compact = false }: UtcNowProps) {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  if (!now) {
    return (
      <span className={cn("text-muted-foreground", className)}>UTC —</span>
    );
  }

  if (compact) {
    return (
      <span className={cn("tabular-nums", className)}>
        {format(now, "dd MMM yyyy · HH:mm")} UTC
      </span>
    );
  }

  return (
    <div className={className}>
      <p className="text-2xl font-semibold tabular-nums">
        {format(now, "dd MMM yyyy")}
      </p>
      <p className="text-sm text-muted-foreground">
        {format(now, "HH:mm")} UTC
      </p>
    </div>
  );
}
