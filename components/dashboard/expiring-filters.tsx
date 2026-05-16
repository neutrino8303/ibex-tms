import Link from "next/link";
import { QualCategory } from "@prisma/client";
import type { ExpiringQualFilters } from "@/server/dashboard";
import { qualCategoryLabel } from "@/lib/roles";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const selectClassName = cn(
  "flex h-9 w-full min-w-[140px] rounded-lg border border-input bg-background px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
);

type ExpiringFiltersProps = {
  bases: string[];
  filters: ExpiringQualFilters;
};

export function ExpiringFilters({ bases, filters }: ExpiringFiltersProps) {
  return (
    <form
      method="get"
      className="grid gap-4 rounded-xl border bg-card p-4 sm:grid-cols-2 lg:grid-cols-5"
    >
      <div className="space-y-2 sm:col-span-2 lg:col-span-2">
        <Label htmlFor="q">Search</Label>
        <Input
          id="q"
          name="q"
          defaultValue={filters.q ?? ""}
          placeholder="Pilot, employee #, qualification…"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="status">Status</Label>
        <select
          id="status"
          name="status"
          className={selectClassName}
          defaultValue={filters.status ?? "all"}
        >
          <option value="all">Expiring, expired & suspended</option>
          <option value="expiring">Expiring soon (≤30 days)</option>
          <option value="expired">Expired</option>
          <option value="suspended">Suspended</option>
        </select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="category">Category</Label>
        <select
          id="category"
          name="category"
          className={selectClassName}
          defaultValue={filters.category ?? "all"}
        >
          <option value="all">All categories</option>
          {Object.values(QualCategory).map((category) => (
            <option key={category} value={category}>
              {qualCategoryLabel[category]}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="base">Base</Label>
        <select
          id="base"
          name="base"
          className={selectClassName}
          defaultValue={filters.base ?? "all"}
        >
          <option value="all">All bases</option>
          {bases.map((base) => (
            <option key={base} value={base}>
              {base}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-end gap-2 sm:col-span-2 lg:col-span-5">
        <Button type="submit">Apply filters</Button>
        <Link
          href="/dashboard/expiring"
          className={cn(buttonVariants({ variant: "outline" }))}
        >
          Reset
        </Link>
      </div>
    </form>
  );
}
