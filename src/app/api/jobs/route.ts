import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/tokens";

// Admin endpoint to view job queue status
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const jobs = await prisma.job.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        project: {
          select: { name: true },
        },
      },
    });

    const stats = {
      total: jobs.length,
      pending: jobs.filter((j) => j.status === "pending").length,
      running: jobs.filter((j) => j.status === "running").length,
      completed: jobs.filter((j) => j.status === "completed").length,
      failed: jobs.filter((j) => j.status === "failed").length,
    };

    return NextResponse.json({ jobs, stats });
  } catch (error) {
    console.error("[api/jobs] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
