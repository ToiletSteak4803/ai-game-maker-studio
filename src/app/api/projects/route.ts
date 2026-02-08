import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/tokens";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const projects = await prisma.project.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: "desc" },
      include: {
        template: {
          select: { name: true, type: true },
        },
      },
    });

    console.log(`[api/projects] Fetched ${projects.length} projects for user ${user.id}`);

    return NextResponse.json({ projects });
  } catch (error) {
    console.error("[api/projects] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, templateId } = body;

    if (!name || typeof name !== "string") {
      return NextResponse.json(
        { error: "Project name is required" },
        { status: 400 }
      );
    }

    // Get template files if specified
    let templateFiles: Array<{ path: string; content: string }> = [];
    if (templateId) {
      const template = await prisma.template.findUnique({
        where: { id: templateId },
      });
      if (template) {
        templateFiles = JSON.parse(template.files);
      }
    }

    // Create project with files
    const project = await prisma.project.create({
      data: {
        name,
        userId: user.id,
        templateId: templateId || null,
        files: {
          create: templateFiles.map((f) => ({
            path: f.path,
            content: f.content,
          })),
        },
      },
      include: {
        files: true,
        template: true,
      },
    });

    console.log(`[api/projects] Created project ${project.id} for user ${user.id}`);

    return NextResponse.json({ project });
  } catch (error) {
    console.error("[api/projects] Error creating project:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
