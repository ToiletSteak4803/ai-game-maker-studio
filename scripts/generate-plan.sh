#!/usr/bin/env bash
set -euo pipefail

if [ ! -f src/content/intake.json ]; then
  echo "Missing src/content/intake.json"
  exit 1
fi

codex << 'PROMPT'
Read src/content/intake.json.

1) Normalize the client info.
2) Fill gaps with reasonable assumptions (do not invent prices).
3) Generate BUILDPLAN.md:
   - Site goals
   - Sections
   - CTA
   - Hosting choice notes (B vs C)
4) Generate TASKS.md:
   - Phase 1: UI implementation (file paths, stop condition)
   - Phase 2: Copy insertion
   - Phase 3: SEO/meta
   - Phase 4: QA checklist
Rules:
- Do NOT write code
- Reference exact files
- Keep each phase small
PROMPT
