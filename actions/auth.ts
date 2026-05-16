"use server";

import { redirect } from "next/navigation";
import { UserRole } from "@prisma/client";
import { z } from "zod";
import { hashPassword, verifyPassword } from "@/lib/auth";
import { prisma } from "@/server/db";
import { getSession } from "@/server/session";

const loginSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

const signupSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
});

export type AuthActionState = {
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

export async function loginAction(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const user = await prisma.user.findUnique({
    where: { email: parsed.data.email.toLowerCase() },
  });

  if (!user || !(await verifyPassword(parsed.data.password, user.passwordHash))) {
    return { error: "Invalid email or password" };
  }

  const session = await getSession();
  session.userId = user.id;
  session.isLoggedIn = true;
  await session.save();

  redirect("/");
}

export async function signupAction(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = signupSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
  });

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const email = parsed.data.email.toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { error: "An account with this email already exists" };
  }

  const passwordHash = await hashPassword(parsed.data.password);
  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      firstName: parsed.data.firstName,
      lastName: parsed.data.lastName,
      roles: {
        create: { role: UserRole.PILOT },
      },
    },
  });

  const session = await getSession();
  session.userId = user.id;
  session.isLoggedIn = true;
  await session.save();

  redirect("/");
}

export async function logoutAction(): Promise<void> {
  const session = await getSession();
  session.destroy();
  redirect("/login");
}
