import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import {
  sessionOptions,
  type SessionData,
} from "@/server/session-options";

export type { SessionData };
export { sessionOptions };

export async function getSession() {
  return getIronSession<SessionData>(await cookies(), sessionOptions);
}

export async function requireUserId(): Promise<string> {
  const session = await getSession();
  if (!session.isLoggedIn || !session.userId) {
    throw new Error("Unauthorized");
  }
  return session.userId;
}
