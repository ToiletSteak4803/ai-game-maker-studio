import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "development-secret-change-in-production"
);

const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days

export async function createSession(userId: string): Promise<string> {
  const token = await new SignJWT({ userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(JWT_SECRET);

  const expiresAt = new Date(Date.now() + SESSION_DURATION);

  await prisma.session.create({
    data: {
      token,
      userId,
      expiresAt,
    },
  });

  return token;
}

export async function verifySession(token: string): Promise<string | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    const userId = payload.userId as string;

    const session = await prisma.session.findUnique({
      where: { token },
    });

    if (!session || session.expiresAt < new Date()) {
      return null;
    }

    return userId;
  } catch {
    return null;
  }
}

export async function getSessionFromCookies(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;
  if (!token) return null;
  return verifySession(token);
}

export async function getCurrentUser() {
  const userId = await getSessionFromCookies();
  if (!userId) return null;

  return prisma.user.findUnique({
    where: { id: userId },
  });
}

export async function deleteSession(token: string): Promise<void> {
  await prisma.session.delete({
    where: { token },
  }).catch(() => {
    // Session may already be deleted
  });
}
