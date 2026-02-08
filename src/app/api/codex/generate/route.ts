import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/tokens";
import { checkRateLimit, getRateLimitHeaders } from "@/lib/security/rate-limit";
import { validatePatch, detectUnsafeCode } from "@/lib/security/patch";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

interface FileInput {
  path: string;
  content: string;
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check rate limit
    const rateLimit = await checkRateLimit(user.id, "codex");
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
    const { projectId, prompt, files } = body as {
      projectId: string;
      prompt: string;
      files: FileInput[];
    };

    if (!prompt || !projectId) {
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

    // Build the prompt for the AI
    const systemPrompt = `You are an expert game developer assistant. You help users create and modify games.

You are working on a game project. The user will describe what they want, and you should respond with:
1. A brief explanation of what you're going to do
2. A JSON patch object containing the file changes

IMPORTANT RULES:
- Only modify files in the src/game directory
- Keep exports stable (don't rename exported functions/classes)
- Don't break the build
- Use Phaser for 2D games or Three.js for 3D games
- Keep code clean and well-organized

Response format:
{
  "explanation": "Brief explanation of changes",
  "patch": {
    "files": [
      { "path": "src/game/file.ts", "action": "create|update|delete", "content": "file content" }
    ]
  }
}

Current project files:
${files.map((f) => `--- ${f.path} ---\n${f.content.slice(0, 500)}${f.content.length > 500 ? "..." : ""}`).join("\n\n")}`;

    const userPrompt = `User request: ${prompt}

Remember to respond with JSON containing "explanation" and "patch" fields.`;

    // Call OpenAI API
    if (!OPENAI_API_KEY) {
      // Demo mode - return a sample response
      console.log("[codex/generate] No API key - using demo mode");

      const demoResponse = {
        explanation: `I'll help you with "${prompt}". Since we're in demo mode, here's a sample change that adds a comment to the config file.`,
        patch: {
          files: [
            {
              path: "src/game/config.ts",
              action: "update" as const,
              content:
                files.find((f) => f.path === "src/game/config.ts")?.content ||
                `// ${prompt}\n// Demo mode - add your game config here\nexport const gameConfig = {};\n`,
            },
          ],
        },
      };

      // Save chat message
      await prisma.chatMessage.create({
        data: {
          projectId,
          role: "assistant",
          content: demoResponse.explanation,
        },
      });

      return NextResponse.json(demoResponse, {
        headers: getRateLimitHeaders(rateLimit),
      });
    }

    // Real OpenAI API call
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 4000,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("[codex/generate] OpenAI API error:", error);
      return NextResponse.json(
        { error: "Failed to generate code" },
        { status: 500 }
      );
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    if (!content) {
      return NextResponse.json(
        { error: "No response from AI" },
        { status: 500 }
      );
    }

    // Parse the response
    let parsed;
    try {
      // Try to extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      } else {
        parsed = { explanation: content, patch: { files: [] } };
      }
    } catch {
      parsed = { explanation: content, patch: { files: [] } };
    }

    // Validate the patch
    if (parsed.patch?.files?.length > 0) {
      const validation = validatePatch(parsed.patch);
      if (!validation.valid) {
        console.warn("[codex/generate] Patch validation failed:", validation.errors);
        return NextResponse.json(
          {
            explanation: parsed.explanation,
            patch: { files: [] },
            error: "Generated code failed security validation",
            validationErrors: validation.errors,
          },
          { headers: getRateLimitHeaders(rateLimit) }
        );
      }

      // Check for unsafe code
      for (const file of parsed.patch.files) {
        if (file.content) {
          const warnings = detectUnsafeCode(file.content);
          if (warnings.length > 0) {
            parsed.warnings = warnings;
          }
        }
      }
    }

    // Save chat message
    await prisma.chatMessage.create({
      data: {
        projectId,
        role: "assistant",
        content: parsed.explanation || "Here are the changes:",
      },
    });

    console.log(
      `[codex/generate] Generated ${parsed.patch?.files?.length || 0} file changes for project ${projectId}`
    );

    return NextResponse.json(parsed, {
      headers: getRateLimitHeaders(rateLimit),
    });
  } catch (error) {
    console.error("[codex/generate] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
