// Patch format for code generation
export interface FilePatch {
  path: string;
  action: "create" | "update" | "delete";
  content?: string;
}

export interface PatchResult {
  files: FilePatch[];
}

// Forbidden patterns for path traversal and dangerous writes
const FORBIDDEN_PATTERNS = [
  /\.\./,                    // Path traversal
  /^\/|^[A-Za-z]:\\/,        // Absolute paths
  /^node_modules\//,         // node_modules
  /^\.env/,                  // .env files
  /^\.git\//,                // .git directory
  /^\.next\//,               // Next.js build
  /^prisma\/migrations\//,   // Prisma migrations
];

const ALLOWED_EXTENSIONS = [
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".json",
  ".css",
  ".scss",
  ".md",
  ".txt",
  ".html",
  ".svg",
];

const MAX_FILE_SIZE = 100 * 1024; // 100KB max per file
const MAX_FILES_PER_PATCH = 50;

export interface ValidationError {
  path: string;
  error: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

/**
 * Validate a single file path for security issues
 */
export function validateFilePath(path: string): string | null {
  // Check for forbidden patterns
  for (const pattern of FORBIDDEN_PATTERNS) {
    if (pattern.test(path)) {
      return `Path "${path}" contains forbidden pattern`;
    }
  }

  // Check extension
  const ext = path.substring(path.lastIndexOf("."));
  if (!ALLOWED_EXTENSIONS.includes(ext.toLowerCase())) {
    return `File extension "${ext}" is not allowed`;
  }

  // Check for null bytes
  if (path.includes("\0")) {
    return `Path contains null bytes`;
  }

  // Check path length
  if (path.length > 256) {
    return `Path too long (max 256 characters)`;
  }

  return null;
}

/**
 * Validate file content
 */
export function validateFileContent(
  content: string | undefined,
  action: string
): string | null {
  if (action === "delete") {
    return null; // No content needed for delete
  }

  if (!content && action !== "delete") {
    return `Content is required for ${action} action`;
  }

  if (content && content.length > MAX_FILE_SIZE) {
    return `File content exceeds maximum size (${MAX_FILE_SIZE} bytes)`;
  }

  // Check for binary content (simple heuristic)
  if (content && /[\x00-\x08\x0B\x0C\x0E-\x1F]/.test(content)) {
    return `File appears to contain binary content`;
  }

  return null;
}

/**
 * Validate an entire patch
 */
export function validatePatch(patch: PatchResult): ValidationResult {
  const errors: ValidationError[] = [];

  if (!patch.files || !Array.isArray(patch.files)) {
    return { valid: false, errors: [{ path: "", error: "Invalid patch format: missing files array" }] };
  }

  if (patch.files.length > MAX_FILES_PER_PATCH) {
    return {
      valid: false,
      errors: [{ path: "", error: `Too many files in patch (max ${MAX_FILES_PER_PATCH})` }],
    };
  }

  const seenPaths = new Set<string>();

  for (const file of patch.files) {
    // Check for required fields
    if (!file.path) {
      errors.push({ path: "", error: "File entry missing path" });
      continue;
    }

    if (!file.action || !["create", "update", "delete"].includes(file.action)) {
      errors.push({ path: file.path, error: `Invalid action: ${file.action}` });
      continue;
    }

    // Check for duplicates
    if (seenPaths.has(file.path)) {
      errors.push({ path: file.path, error: "Duplicate path in patch" });
      continue;
    }
    seenPaths.add(file.path);

    // Validate path
    const pathError = validateFilePath(file.path);
    if (pathError) {
      errors.push({ path: file.path, error: pathError });
    }

    // Validate content
    const contentError = validateFileContent(file.content, file.action);
    if (contentError) {
      errors.push({ path: file.path, error: contentError });
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Check if generated code contains potentially unsafe patterns
 */
export function detectUnsafeCode(content: string): string[] {
  const warnings: string[] = [];

  const unsafePatterns = [
    { pattern: /eval\s*\(/, message: "Use of eval() detected" },
    { pattern: /new\s+Function\s*\(/, message: "Dynamic Function constructor detected" },
    { pattern: /child_process/, message: "child_process import detected" },
    { pattern: /fs\.(write|unlink|rmdir|rm)/, message: "File system write operations detected" },
    { pattern: /process\.env/, message: "Environment variable access detected" },
    { pattern: /require\s*\(\s*['"][^'"]+['"]\s*\)/, message: "Dynamic require detected" },
    { pattern: /import\s*\(\s*[^)]+\)/, message: "Dynamic import detected" },
    { pattern: /__dirname|__filename/, message: "Node.js path globals detected" },
    { pattern: /\.exec\s*\(|\.spawn\s*\(/, message: "Process execution detected" },
    { pattern: /dangerouslySetInnerHTML/, message: "React dangerouslySetInnerHTML detected" },
    { pattern: /innerHTML\s*=/, message: "Direct innerHTML assignment detected" },
  ];

  for (const { pattern, message } of unsafePatterns) {
    if (pattern.test(content)) {
      warnings.push(message);
    }
  }

  return warnings;
}

/**
 * Normalize path to prevent directory traversal
 */
export function normalizePath(path: string): string {
  // Remove any leading slashes
  let normalized = path.replace(/^\/+/, "");

  // Split and filter out . and ..
  const parts = normalized.split("/").filter((p) => p && p !== "." && p !== "..");

  return parts.join("/");
}
