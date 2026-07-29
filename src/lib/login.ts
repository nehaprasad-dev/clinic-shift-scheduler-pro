import { hash, compare } from "bcryptjs";
import { prisma } from "./db";
import { getSession, type SessionUser } from "./auth";

export async function hashPassword(password: string): Promise<string> {
  return hash(password, 10);
}

export async function loginWithPassword(
  email: string,
  password: string,
): Promise<SessionUser> {
  const normalized = email.trim().toLowerCase();
  const user = await prisma.user.findUnique({ where: { email: normalized } });
  if (!user) {
    throw new Error("Invalid email or password.");
  }

  const ok = await compare(password, user.passwordHash);
  if (!ok) {
    throw new Error("Invalid email or password.");
  }

  const sessionUser: SessionUser = {
    id: user.id,
    email: user.email,
    name: user.name,
    appRole: user.appRole,
    profession: user.profession,
  };

  const session = await getSession();
  session.user = sessionUser;
  await session.save();
  return sessionUser;
}

export async function logout(): Promise<void> {
  const session = await getSession();
  session.destroy();
}
