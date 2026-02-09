import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/tokens";

const MESHY_API_KEY = process.env.MESHY_API_KEY;

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const jobId = searchParams.get("id");

    if (!jobId) {
      return NextResponse.json({ error: "Job ID required" }, { status: 400 });
    }

    // Check if it's a demo job
    if (jobId.startsWith("demo_")) {
      // Check the asset status in DB
      const asset = await prisma.asset.findFirst({
        where: { meshyJobId: jobId },
      });

      if (!asset) {
        return NextResponse.json({ error: "Asset not found" }, { status: 404 });
      }

      return NextResponse.json({
        status: asset.status,
        glbUrl: asset.glbUrl,
        thumbnailUrl: asset.thumbnailUrl,
      });
    }

    if (!MESHY_API_KEY) {
      return NextResponse.json(
        { error: "Meshy API not configured" },
        { status: 500 }
      );
    }

    // Real Meshy API call (v2 endpoint)
    const response = await fetch(`https://api.meshy.ai/openapi/v2/text-to-3d/${jobId}`, {
      headers: {
        Authorization: `Bearer ${MESHY_API_KEY}`,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("[meshy/status] Meshy API error:", error);
      return NextResponse.json(
        { error: "Failed to get job status" },
        { status: 500 }
      );
    }

    const data = await response.json();

    // Map Meshy status to our status
    let status = "processing";
    if (data.status === "SUCCEEDED") {
      status = "completed";
    } else if (data.status === "FAILED") {
      status = "failed";
    }

    // Update asset in DB if completed
    if (status === "completed" || status === "failed") {
      await prisma.asset.updateMany({
        where: { meshyJobId: jobId },
        data: {
          status,
          glbUrl: data.model_url || null,
          thumbnailUrl: data.thumbnail_url || null,
        },
      });
    }

    return NextResponse.json({
      status,
      glbUrl: data.model_url,
      thumbnailUrl: data.thumbnail_url,
    });
  } catch (error) {
    console.error("[meshy/status] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
