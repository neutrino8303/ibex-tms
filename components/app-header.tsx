"use client";

import { User } from "lucide-react";
import type { CurrentUser } from "@/lib/auth";
import { UtcNow } from "@/components/utc-now";
import { LogoutMenuItem } from "@/components/logout-button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

type AppHeaderProps = {
  user: CurrentUser;
};

function initials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

export function AppHeader({ user }: AppHeaderProps) {
  return (
    <header className="flex h-12 shrink-0 items-center justify-between border-b border-border bg-card/80 px-5 backdrop-blur-sm">
      <UtcNow
        compact
        className="hidden font-mono text-[0.7rem] text-muted-foreground sm:inline"
      />
      <DropdownMenu>
        <DropdownMenuTrigger
          className={cn(
            buttonVariants({ variant: "ghost", size: "sm" }),
            "gap-2 px-2 outline-none focus-visible:ring-2 focus-visible:ring-ring",
          )}
        >
          <Avatar className="size-7 rounded-md">
            <AvatarFallback className="rounded-md bg-primary text-[0.65rem] font-semibold text-primary-foreground">
              {initials(user.firstName, user.lastName)}
            </AvatarFallback>
          </Avatar>
          <span className="hidden text-sm font-medium sm:inline">
            {user.firstName} {user.lastName}
          </span>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuGroup>
            <DropdownMenuLabel>
              <div className="flex flex-col gap-0.5">
                <span>
                  {user.firstName} {user.lastName}
                </span>
                <span className="text-xs font-normal text-muted-foreground">
                  {user.email}
                </span>
              </div>
            </DropdownMenuLabel>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem disabled>
              <User className="size-4" />
              Profile (coming soon)
            </DropdownMenuItem>
            <LogoutMenuItem />
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
