"use client";

import { useTransition } from "react";
import { LogOut } from "lucide-react";
import { logoutAction } from "@/actions/auth";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";

export function LogoutMenuItem() {
  const [pending, startTransition] = useTransition();

  return (
    <DropdownMenuItem
      variant="destructive"
      disabled={pending}
      onClick={() => {
        startTransition(() => {
          void logoutAction();
        });
      }}
    >
      <LogOut className="size-4" />
      {pending ? "Signing out…" : "Sign out"}
    </DropdownMenuItem>
  );
}
