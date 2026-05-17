"use client";

import { useState } from "react";
import { DEMO_PASSWORD, demoUsers } from "@/lib/demo-users";
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
    <div className="w-full max-w-[22rem] border-t border-border pt-5">
      <p className="text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
        Demo access
      </p>
      <p className="mt-1 text-xs text-muted-foreground">
        Select a role to fill credentials. Password:{" "}
        <span className="font-mono text-foreground">{DEMO_PASSWORD}</span>
      </p>
      <ul className="mt-3 divide-y divide-border rounded-md border border-border bg-card">
        {demoUsers.map((user) => (
          <li key={user.email}>
            <button
              type="button"
              className={cn(
                "flex w-full flex-col items-start gap-0.5 px-3 py-2.5 text-left text-sm transition-colors hover:bg-muted/60",
                selectedEmail === user.email &&
                  "bg-accent/8 ring-1 ring-inset ring-accent/30",
              )}
              onClick={() => fillAccount(user.email)}
            >
              <span className="font-medium text-foreground">{user.name}</span>
              <span className="text-xs text-muted-foreground">
                {user.role} · {user.email}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
