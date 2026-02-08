import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { deleteSession } from "@/lib/auth/tokens";

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("session")?.value;

    if (sessionToken) {
      await deleteSession(sessionToken);
    }

    cookieStore.delete("session");

    console.log("[auth/logout] User logged out");

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[auth/logout] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
