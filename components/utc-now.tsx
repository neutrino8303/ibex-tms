"use client";

import { format } from "date-fns";
import { useEffect, useState } from "react";

export function UtcNow() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
  }, []);

  if (!now) {
    return (
      <>
        <p className="text-2xl font-semibold tabular-nums text-muted-foreground">
          —
        </p>
        <p className="text-sm text-muted-foreground">Loading UTC…</p>
      </>
    );
  }

  return (
    <>
      <p className="text-2xl font-semibold tabular-nums">
        {format(now, "dd MMM yyyy")}
      </p>
      <p className="text-sm text-muted-foreground">
        {format(now, "HH:mm")} UTC
      </p>
    </>
  );
}
