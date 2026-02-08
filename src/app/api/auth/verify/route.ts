import { NextRequest, NextResponse } from "next/server";
import { verifyMagicLink } from "@/lib/auth/tokens";
import { cookies } from "next/headers";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.redirect(new URL("/auth/login?error=missing_token", request.url));
    }

    const sessionToken = await verifyMagicLink(token);

    if (!sessionToken) {
      return NextResponse.redirect(new URL("/auth/login?error=invalid_token", request.url));
    }

    // Set session cookie
    const cookieStore = await cookies();
    cookieStore.set("session", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: "/",
    });

    console.log("[auth/verify] User authenticated successfully");

    return NextResponse.redirect(new URL("/studio", request.url));
  } catch (error) {
    console.error("[auth/verify] Error:", error);
    return NextResponse.redirect(new URL("/auth/login?error=server_error", request.url));
  }
}
