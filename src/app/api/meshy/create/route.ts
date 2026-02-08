import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/tokens";
import { checkRateLimit, getRateLimitHeaders } from "@/lib/security/rate-limit";

const MESHY_API_KEY = process.env.MESHY_API_KEY;

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check rate limit
    const rateLimit = await checkRateLimit(user.id, "meshy");
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Please try again later." },
        {
          status: 429,
          headers: getRateLimitHeaders(rateLimit),
        }
      );
    }

    const body = await request.json();
    const { projectId, assetId, prompt, style } = body;

    if (!projectId || !assetId || !prompt) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Verify project ownership
    const project = await prisma.project.findFirst({
      where: { id: projectId, userId: user.id },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    if (!MESHY_API_KEY) {
      // Demo mode - return a fake job ID
      console.log("[meshy/create] No API key - using demo mode");

      const demoJobId = `demo_${Date.now()}`;

      // Create asset record
      await prisma.asset.create({
        data: {
          id: assetId,
          projectId,
          name: prompt.slice(0, 50),
          prompt,
          meshyJobId: demoJobId,
          status: "processing",
        },
      });

      // Simulate completion after 5 seconds
      setTimeout(async () => {
        try {
          await prisma.asset.update({
            where: { id: assetId },
            data: {
              status: "completed",
              glbUrl: "https://example.com/demo-model.glb",
              thumbnailUrl: "https://via.placeholder.com/200",
            },
          });
        } catch (e) {
          console.error("Demo update failed:", e);
        }
      }, 5000);

      return NextResponse.json(
        { jobId: demoJobId },
        { headers: getRateLimitHeaders(rateLimit) }
      );
    }

    // Real Meshy API call
    const response = await fetch("https://api.meshy.ai/v1/text-to-3d", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${MESHY_API_KEY}`,
      },
      body: JSON.stringify({
        prompt,
        art_style: style || "realistic",
        negative_prompt: "low quality, blurry, distorted",
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("[meshy/create] Meshy API error:", error);
      return NextResponse.json(
        { error: "Failed to start 3D generation" },
        { status: 500 }
      );
    }

    const data = await response.json();
    const jobId = data.result;

    // Create asset record
    await prisma.asset.create({
      data: {
        id: assetId,
        projectId,
        name: prompt.slice(0, 50),
        prompt,
        meshyJobId: jobId,
        status: "processing",
      },
    });

    console.log(`[meshy/create] Started job ${jobId} for project ${projectId}`);

    return NextResponse.json(
      { jobId },
      { headers: getRateLimitHeaders(rateLimit) }
    );
  } catch (error) {
    console.error("[meshy/create] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
