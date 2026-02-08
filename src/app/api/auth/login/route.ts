import { NextRequest, NextResponse } from "next/server";
import { createMagicLink } from "@/lib/auth/tokens";
import { sendMagicLinkEmail } from "@/lib/auth/email";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    const token = await createMagicLink(email.toLowerCase());
    const sent = await sendMagicLinkEmail(email.toLowerCase(), token);

    if (!sent) {
      console.error("[auth/login] Failed to send magic link email to:", email);
      return NextResponse.json(
        { error: "Failed to send login email" },
        { status: 500 }
      );
    }

    console.log("[auth/login] Magic link sent to:", email);

    return NextResponse.json({
      success: true,
      message: "Check your email for the login link",
    });
  } catch (error) {
    console.error("[auth/login] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
