"use client";

import { User } from "lucide-react";
import type { CurrentUser } from "@/lib/auth";
import { LogoutMenuItem } from "@/components/logout-button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type AppHeaderProps = {
  user: CurrentUser;
};

function initials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

export function AppHeader({ user }: AppHeaderProps) {
  return (
    <header className="flex h-14 items-center justify-between border-b bg-card px-6">
      <div />
      <DropdownMenu>
        <DropdownMenuTrigger className="rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <Button variant="ghost" className="gap-2 px-2">
            <Avatar className="size-8">
              <AvatarFallback className="bg-primary text-xs text-primary-foreground">
                {initials(user.firstName, user.lastName)}
              </AvatarFallback>
            </Avatar>
            <span className="hidden text-sm font-medium sm:inline">
              {user.firstName} {user.lastName}
            </span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
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
          <DropdownMenuSeparator />
          <DropdownMenuItem disabled>
            <User className="size-4" />
            Profile (coming soon)
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <LogoutMenuItem />
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
