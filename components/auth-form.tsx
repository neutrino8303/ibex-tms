"use client";

import Link from "next/link";
import { useActionState } from "react";
import type { AuthActionState } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type AuthFormProps = {
  id?: string;
  title: string;
  description: string;
  submitLabel: string;
  alternateHref: string;
  alternateLabel: string;
  action: (
    prev: AuthActionState,
    formData: FormData,
  ) => Promise<AuthActionState>;
  fields: Array<{
    name: string;
    label: string;
    type?: string;
    autoComplete?: string;
  }>;
};

const initialState: AuthActionState = {};

export function AuthForm({
  id = "auth-form",
  title,
  description,
  submitLabel,
  alternateHref,
  alternateLabel,
  action,
  fields,
}: AuthFormProps) {
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <div className="w-full max-w-[22rem]">
      <div className="mb-6">
        <h1 className="page-title text-xl">{title}</h1>
        <p className="page-subtitle">{description}</p>
      </div>

      <form
        id={id}
        action={formAction}
        className="ops-panel space-y-4 p-5"
      >
        {state.error && (
          <p
            className="border border-destructive/25 bg-destructive/8 px-3 py-2 text-sm text-destructive"
            role="alert"
          >
            {state.error}
          </p>
        )}
        {fields.map((field) => (
          <div key={field.name} className="space-y-1.5">
            <Label htmlFor={field.name} className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {field.label}
            </Label>
            <Input
              id={field.name}
              name={field.name}
              type={field.type ?? "text"}
              autoComplete={field.autoComplete}
              required
              className="bg-card"
            />
            {state.fieldErrors?.[field.name]?.map((message) => (
              <p key={message} className="text-sm text-destructive">
                {message}
              </p>
            ))}
          </div>
        ))}
        <Button type="submit" className="mt-1 w-full" disabled={pending}>
          {pending ? "Please wait…" : submitLabel}
        </Button>
      </form>

      <p className="mt-4 text-center text-sm text-muted-foreground">
        <Link
          href={alternateHref}
          className={cn("font-medium text-accent hover:underline")}
        >
          {alternateLabel}
        </Link>
      </p>
    </div>
  );
}
