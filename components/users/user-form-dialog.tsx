"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useActionState } from "react";
import { UserRole } from "@prisma/client";
import {
  createUserAction,
  updateUserAction,
} from "@/actions/users";
import { initialActionState } from "@/lib/action-state";
import { ALL_USER_ROLES, userRoleLabel } from "@/lib/roles";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export type UserRow = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  employeeNumber: string | null;
  licenseNumber: string | null;
  base: string | null;
  roles: UserRole[];
};

type UserFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user?: UserRow | null;
};

export function UserFormDialog({
  open,
  onOpenChange,
  user,
}: UserFormDialogProps) {
  const isEdit = Boolean(user);
  const router = useRouter();
  const [createState, createAction, createPending] = useActionState(
    createUserAction,
    initialActionState,
  );
  const [updateState, updateAction, updatePending] = useActionState(
    updateUserAction,
    initialActionState,
  );
  const state = isEdit ? updateState : createState;
  const formAction = isEdit ? updateAction : createAction;
  const pending = isEdit ? updatePending : createPending;
  const [selectedRoles, setSelectedRoles] = useState<UserRole[]>(
    user?.roles ?? [UserRole.PILOT],
  );

  useEffect(() => {
    if (open) {
      setSelectedRoles(user?.roles ?? [UserRole.PILOT]);
    }
  }, [open, user]);

  useEffect(() => {
    if (state.success) {
      onOpenChange(false);
      router.refresh();
    }
  }, [state.success, onOpenChange, router]);

  function toggleRole(role: UserRole, checked: boolean) {
    setSelectedRoles((current) => {
      if (checked) {
        return current.includes(role) ? current : [...current, role];
      }
      return current.filter((item) => item !== role);
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit user" : "New user"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update profile details and role assignments."
              : "Create a training system account with one or more roles."}
          </DialogDescription>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          {isEdit && user && (
            <input type="hidden" name="userId" value={user.id} />
          )}
          {state.error && (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {state.error}
            </p>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="firstName">First name</Label>
              <Input
                id="firstName"
                name="firstName"
                defaultValue={user?.firstName}
                required
              />
              {state.fieldErrors?.firstName?.map((message) => (
                <p key={message} className="text-sm text-destructive">
                  {message}
                </p>
              ))}
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last name</Label>
              <Input
                id="lastName"
                name="lastName"
                defaultValue={user?.lastName}
                required
              />
              {state.fieldErrors?.lastName?.map((message) => (
                <p key={message} className="text-sm text-destructive">
                  {message}
                </p>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              defaultValue={user?.email}
              required
            />
            {state.fieldErrors?.email?.map((message) => (
              <p key={message} className="text-sm text-destructive">
                {message}
              </p>
            ))}
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">
              {isEdit ? "New password (optional)" : "Password"}
            </Label>
            <Input
              id="password"
              name="password"
              type="password"
              required={!isEdit}
              autoComplete="new-password"
            />
            {state.fieldErrors?.password?.map((message) => (
              <p key={message} className="text-sm text-destructive">
                {message}
              </p>
            ))}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="employeeNumber">Employee number</Label>
              <Input
                id="employeeNumber"
                name="employeeNumber"
                defaultValue={user?.employeeNumber ?? ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="base">Base</Label>
              <Input
                id="base"
                name="base"
                placeholder="LPPT"
                defaultValue={user?.base ?? ""}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="licenseNumber">License number</Label>
            <Input
              id="licenseNumber"
              name="licenseNumber"
              defaultValue={user?.licenseNumber ?? ""}
            />
          </div>
          <fieldset className="space-y-3">
            <legend className="text-sm font-medium">Roles</legend>
            {ALL_USER_ROLES.map((role) => (
              <label
                key={role}
                className="flex cursor-pointer items-center gap-2 text-sm"
              >
                <Checkbox
                  checked={selectedRoles.includes(role)}
                  onCheckedChange={(checked) =>
                    toggleRole(role, checked === true)
                  }
                />
                <span>{userRoleLabel[role]}</span>
              </label>
            ))}
            {selectedRoles.map((role) => (
              <input key={role} type="hidden" name="roles" value={role} />
            ))}
            {state.fieldErrors?.roles?.map((message) => (
              <p key={message} className="text-sm text-destructive">
                {message}
              </p>
            ))}
          </fieldset>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Saving…" : isEdit ? "Save changes" : "Create user"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
