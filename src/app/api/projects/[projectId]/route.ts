import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/tokens";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { projectId } = await params;

    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId: user.id,
      },
      include: {
        files: {
          orderBy: { path: "asc" },
        },
        assets: true,
        chatHistory: {
          orderBy: { createdAt: "asc" },
        },
        template: true,
      },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    return NextResponse.json({ project });
  } catch (error) {
    console.error("[api/projects/[id]] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { projectId } = await params;
    const body = await request.json();
    const { name, files } = body;

    // Verify project ownership
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId: user.id,
      },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Update project
    const updates: Record<string, unknown> = { updatedAt: new Date() };
    if (name) updates.name = name;

    // Update files if provided
    if (files && Array.isArray(files)) {
      // Delete existing files
      await prisma.projectFile.deleteMany({
        where: { projectId },
      });

      // Create new files
      await prisma.projectFile.createMany({
        data: files.map((f: { path: string; content: string }) => ({
          projectId,
          path: f.path,
          content: f.content,
        })),
      });
    }

    const updatedProject = await prisma.project.update({
      where: { id: projectId },
      data: updates,
      include: { files: true },
    });

    console.log(`[api/projects/[id]] Updated project ${projectId}`);

    return NextResponse.json({ project: updatedProject });
  } catch (error) {
    console.error("[api/projects/[id]] Error updating:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { projectId } = await params;

    // Verify project ownership
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId: user.id,
      },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Delete project (cascades to files, assets, etc.)
    await prisma.project.delete({
      where: { id: projectId },
    });

    console.log(`[api/projects/[id]] Deleted project ${projectId}`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[api/projects/[id]] Error deleting:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
