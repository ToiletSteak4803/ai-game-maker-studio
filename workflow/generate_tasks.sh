#!/usr/bin/env bash
set -euo pipefail

MODEL=""
if [[ "${1:-}" == "--model" ]]; then
  MODEL="${2:-gpt-5-mini}"
fi

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
IN="$ROOT/workflow/intake.md"
OUT="$ROOT/TASKS.md"

if [[ ! -f "$IN" ]]; then
  echo "Missing: $IN"
  exit 1
fi

PROMPT_FILE="$(mktemp)"
trap 'rm -f "$PROMPT_FILE"' EXIT

cat > "$PROMPT_FILE" <<'SYS'
You are in a Next.js + Tailwind + Supabase-ready template project.

Read BRAND.md and workflow/intake.md and generate a project execution plan for Claude Code.

TASKS.md must include:
1) A 1-paragraph summary of the business and goal.
2) A list of required pages/sections (assume a one-page site unless intake requests more).
3) Concrete copy blocks (headlines, subheadlines, CTAs, service blurbs) with NO lorem ipsum.
4)Brand color plan: if intake provides hex, use them;
5) A strict set of rules for Claude:
   - Do not add dependencies.
   - Do not modify config files unless explicitly required.
   - Use Tailwind only.
   - Prefer minimal edits and reuse existing structure.
   - Stop after Phase 1 unless told otherwise.
6) Phased prompts:
   Phase 1: implement UI + copy on src/app/page.tsx (and src/components if needed) + Favicon implementation: copy the png into Next’s App Router icon path.
   Phase 2: metadata + SEO basics (layout metadata, sitemap/robots if present)
   Phase 3: QA pass checklist
Each phase should specify exactly which files may be edited.

Write the final TASKS.md content only (no extra commentary).
SYS

{
  echo
  echo "---- workflow/intake.md ----"
  cat "$IN"
  echo
  echo "---- end ----"
  echo
} >> "$PROMPT_FILE"

echo "Generating TASKS.md from workflow/intake.md using codex exec..."
# codex exec reads the prompt from args; we pass the file content as the prompt.
if [[ -n "$MODEL" ]]; then
  codex exec -m "$MODEL" "$(cat "$PROMPT_FILE")" > "$OUT"
else
  codex exec "$(cat "$PROMPT_FILE")" > "$OUT"
fi


echo "Wrote: $OUT"
