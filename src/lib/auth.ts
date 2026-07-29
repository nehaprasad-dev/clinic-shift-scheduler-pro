import { SessionOptions, getIronSession } from "iron-session";
import { cookies } from "next/headers";
import type { AppRole, Profession } from "@prisma/client";

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  appRole: AppRole;
  profession: Profession | null;
};

export type SessionData = {
  user?: SessionUser;
};

export function getSessionOptions(): SessionOptions {
  const password = process.env.SESSION_SECRET;
  if (!password || password.length < 32) {
    throw new Error("SESSION_SECRET must be set to at least 32 characters");
  }

  return {
    password,
    cookieName: "clinic_shift_session",
    cookieOptions: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    },
  };
}

export async function getSession() {
  return getIronSession<SessionData>(await cookies(), getSessionOptions());
}

export async function requireUser(): Promise<SessionUser> {
  const session = await getSession();
  if (!session.user) {
    throw new AuthError("You must be signed in.");
  }
  return session.user;
}

export async function requireManager(): Promise<SessionUser> {
  const user = await requireUser();
  if (user.appRole !== "MANAGER") {
    throw new AuthError("Manager access required.");
  }
  return user;
}

export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthError";
  }
}
