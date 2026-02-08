import { describe, it, expect } from "vitest";
import {
  validateFilePath,
  validateFileContent,
  validatePatch,
  detectUnsafeCode,
  normalizePath,
} from "../patch";

describe("validateFilePath", () => {
  it("should reject path traversal attempts", () => {
    expect(validateFilePath("../etc/passwd")).toContain("forbidden pattern");
    expect(validateFilePath("src/../../../etc/passwd")).toContain("forbidden pattern");
    expect(validateFilePath("..")).toContain("forbidden pattern");
  });

  it("should reject absolute paths", () => {
    expect(validateFilePath("/etc/passwd")).toContain("forbidden pattern");
    expect(validateFilePath("C:\\Windows\\System32")).toContain("forbidden pattern");
  });

  it("should reject node_modules paths", () => {
    expect(validateFilePath("node_modules/package/index.js")).toContain("forbidden pattern");
  });

  it("should reject .env files", () => {
    expect(validateFilePath(".env")).toContain("forbidden pattern");
    expect(validateFilePath(".env.local")).toContain("forbidden pattern");
    expect(validateFilePath(".env.production")).toContain("forbidden pattern");
  });

  it("should reject .git paths", () => {
    expect(validateFilePath(".git/config")).toContain("forbidden pattern");
  });

  it("should reject non-allowed extensions", () => {
    expect(validateFilePath("src/script.exe")).toContain("not allowed");
    expect(validateFilePath("src/binary.bin")).toContain("not allowed");
    expect(validateFilePath("src/shell.sh")).toContain("not allowed");
  });

  it("should accept valid paths", () => {
    expect(validateFilePath("src/game/config.ts")).toBeNull();
    expect(validateFilePath("src/components/Button.tsx")).toBeNull();
    expect(validateFilePath("src/styles/main.css")).toBeNull();
    expect(validateFilePath("README.md")).toBeNull();
    expect(validateFilePath("package.json")).toBeNull();
  });

  it("should reject null bytes", () => {
    expect(validateFilePath("src/file\x00.ts")).toContain("null bytes");
  });

  it("should reject overly long paths", () => {
    const longPath = "a".repeat(300) + ".ts";
    expect(validateFilePath(longPath)).toContain("too long");
  });
});

describe("validateFileContent", () => {
  it("should require content for create/update actions", () => {
    expect(validateFileContent(undefined, "create")).toContain("required");
    expect(validateFileContent("", "update")).toContain("required");
  });

  it("should not require content for delete actions", () => {
    expect(validateFileContent(undefined, "delete")).toBeNull();
  });

  it("should reject oversized files", () => {
    const largeContent = "x".repeat(200 * 1024); // 200KB
    expect(validateFileContent(largeContent, "create")).toContain("exceeds");
  });

  it("should reject binary content", () => {
    const binaryContent = "Hello\x00World\x01Test";
    expect(validateFileContent(binaryContent, "create")).toContain("binary");
  });

  it("should accept valid content", () => {
    expect(validateFileContent("const x = 1;", "create")).toBeNull();
    expect(validateFileContent("function hello() {}", "update")).toBeNull();
  });
});

describe("validatePatch", () => {
  it("should reject invalid patch format", () => {
    const result = validatePatch({} as any);
    expect(result.valid).toBe(false);
    expect(result.errors[0].error).toContain("missing files array");
  });

  it("should reject too many files", () => {
    const files = Array.from({ length: 60 }, (_, i) => ({
      path: `src/file${i}.ts`,
      action: "create" as const,
      content: "x",
    }));
    const result = validatePatch({ files });
    expect(result.valid).toBe(false);
    expect(result.errors[0].error).toContain("Too many files");
  });

  it("should reject duplicate paths", () => {
    const result = validatePatch({
      files: [
        { path: "src/file.ts", action: "create", content: "x" },
        { path: "src/file.ts", action: "update", content: "y" },
      ],
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.error.includes("Duplicate"))).toBe(true);
  });

  it("should accept valid patches", () => {
    const result = validatePatch({
      files: [
        { path: "src/game/config.ts", action: "create", content: "export const x = 1;" },
        { path: "src/game/scene.ts", action: "update", content: "import x from './config';" },
        { path: "src/game/old.ts", action: "delete" },
      ],
    });
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });
});

describe("detectUnsafeCode", () => {
  it("should detect eval usage", () => {
    const warnings = detectUnsafeCode("const x = eval('1 + 1');");
    expect(warnings).toContain("Use of eval() detected");
  });

  it("should detect dynamic Function constructor", () => {
    const warnings = detectUnsafeCode("const fn = new Function('return 1');");
    expect(warnings).toContain("Dynamic Function constructor detected");
  });

  it("should detect child_process", () => {
    const warnings = detectUnsafeCode("import { exec } from 'child_process';");
    expect(warnings).toContain("child_process import detected");
  });

  it("should detect process.env access", () => {
    const warnings = detectUnsafeCode("const key = process.env.API_KEY;");
    expect(warnings).toContain("Environment variable access detected");
  });

  it("should detect dangerouslySetInnerHTML", () => {
    const warnings = detectUnsafeCode("<div dangerouslySetInnerHTML={{ __html: html }} />");
    expect(warnings).toContain("React dangerouslySetInnerHTML detected");
  });

  it("should return empty for safe code", () => {
    const warnings = detectUnsafeCode("const x = 1 + 2; console.log(x);");
    expect(warnings).toHaveLength(0);
  });
});

describe("normalizePath", () => {
  it("should remove leading slashes", () => {
    expect(normalizePath("/src/file.ts")).toBe("src/file.ts");
    expect(normalizePath("///src/file.ts")).toBe("src/file.ts");
  });

  it("should remove . and .. segments", () => {
    expect(normalizePath("src/./game/config.ts")).toBe("src/game/config.ts");
    // The function filters out .. but doesn't do full path resolution
    // This is safe because .. is blocked by validation anyway
    expect(normalizePath("../file.ts")).toBe("file.ts");
  });

  it("should handle empty parts", () => {
    expect(normalizePath("src//game//config.ts")).toBe("src/game/config.ts");
  });
});
