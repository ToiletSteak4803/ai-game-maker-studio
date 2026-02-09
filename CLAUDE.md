You are working in a Next.js App Router project.

## Required Reading Order
1. BRAND.md
2. TASKS.md
3. workflow/intake.md

If BRAND.md defines assets, they MUST be used.

## Project Overview
AI Game Maker Studio - a web app for creating 2D/3D games via AI chat.

**Tech Stack:**
- Next.js 15 (App Router) + TypeScript + Tailwind
- Zustand for state management
- Prisma + Supabase PostgreSQL
- Phaser 3 for 2D games, Three.js for 3D games
- OpenAI API for code generation
- Meshy AI API (v2) for 3D asset generation

**Key Architecture:**
- `/src/app/api/` - API routes (auth, projects, codex, meshy)
- `/src/components/studio/` - Studio editor components
- `/src/lib/store/` - Zustand stores
- Preview panel transpiles TypeScript to JavaScript in-browser for iframe execution

## Global Rules
- Use TypeScript + Tailwind only
- Do NOT add dependencies
- Do NOT modify config files unless explicitly told
- Do NOT redesign layouts unless told
- Prefer small, surgical changes
- Stop when the task phase is complete and report what changed
