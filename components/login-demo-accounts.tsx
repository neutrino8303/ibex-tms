"use client";

import { useState } from "react";
import { DEMO_PASSWORD, demoUsers } from "@/lib/demo-users";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

type LoginDemoAccountsProps = {
  formId: string;
};

export function LoginDemoAccounts({ formId }: LoginDemoAccountsProps) {
  const [selectedEmail, setSelectedEmail] = useState<string | null>(null);

  function fillAccount(email: string) {
    const form = document.getElementById(formId) as HTMLFormElement | null;
    const emailInput = form?.elements.namedItem("email") as HTMLInputElement | null;
    const passwordInput = form?.elements.namedItem(
      "password",
    ) as HTMLInputElement | null;

    if (emailInput) {
      emailInput.value = email;
    }
    if (passwordInput) {
      passwordInput.value = DEMO_PASSWORD;
    }

    setSelectedEmail(email);
    emailInput?.focus();
  }

  return (
    <Card className="w-full max-w-md border-dashed">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Demo accounts</CardTitle>
        <CardDescription>
          Click an account to fill the form, then sign in. Password:{" "}
          <span className="font-mono">{DEMO_PASSWORD}</span>
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-2">
        {demoUsers.map((user) => (
          <Button
            key={user.email}
            type="button"
            variant={selectedEmail === user.email ? "secondary" : "outline"}
            className={cn(
              "h-auto w-full justify-start px-3 py-2 text-left",
              selectedEmail === user.email && "ring-2 ring-ring",
            )}
            onClick={() => fillAccount(user.email)}
          >
            <span className="flex flex-col gap-0.5">
              <span className="font-medium">{user.name}</span>
              <span className="text-xs text-muted-foreground">
                {user.role} · {user.email}
              </span>
            </span>
          </Button>
        ))}
      </CardContent>
    </Card>
  );
}
