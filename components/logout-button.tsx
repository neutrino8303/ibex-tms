"use client";

import { LogOut } from "lucide-react";
import { logoutAction } from "@/actions/auth";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";

export function LogoutMenuItem() {
  return (
    <DropdownMenuItem
      variant="destructive"
      onClick={() => {
        void logoutAction();
      }}
    >
      <LogOut className="size-4" />
      Sign out
    </DropdownMenuItem>
  );
}
