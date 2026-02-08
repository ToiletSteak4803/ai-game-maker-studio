import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(d);
}

export function generateId(): string {
  return crypto.randomUUID();
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length - 3) + "...";
}

export function debounce<T extends (...args: Parameters<T>) => ReturnType<T>>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function getFileExtension(path: string): string {
  const lastDot = path.lastIndexOf(".");
  if (lastDot === -1) return "";
  return path.slice(lastDot + 1).toLowerCase();
}

export function getFileName(path: string): string {
  const parts = path.split("/");
  return parts[parts.length - 1];
}

export function getFileLanguage(path: string): string {
  const ext = getFileExtension(path);
  const languageMap: Record<string, string> = {
    ts: "typescript",
    tsx: "typescript",
    js: "javascript",
    jsx: "javascript",
    json: "json",
    css: "css",
    scss: "scss",
    html: "html",
    md: "markdown",
    svg: "xml",
  };
  return languageMap[ext] || "plaintext";
}

export function buildFileTree(paths: string[]): FileTreeNode[] {
  const root: FileTreeNode = { name: "", path: "", children: [] };

  for (const path of paths) {
    const parts = path.split("/");
    let current = root;

    for (let i = 0; i < parts.length; i++) {
      const name = parts[i];
      const currentPath = parts.slice(0, i + 1).join("/");
      const isFile = i === parts.length - 1;

      let child = current.children?.find((c) => c.name === name);
      if (!child) {
        child = {
          name,
          path: currentPath,
          children: isFile ? undefined : [],
        };
        current.children = current.children || [];
        current.children.push(child);
      }
      current = child;
    }
  }

  // Sort: folders first, then files, alphabetically
  const sortTree = (nodes: FileTreeNode[]): FileTreeNode[] => {
    return nodes.sort((a, b) => {
      const aIsFolder = !!a.children;
      const bIsFolder = !!b.children;
      if (aIsFolder !== bIsFolder) return bIsFolder ? 1 : -1;
      return a.name.localeCompare(b.name);
    }).map((node) => ({
      ...node,
      children: node.children ? sortTree(node.children) : undefined,
    }));
  };

  return sortTree(root.children || []);
}

export interface FileTreeNode {
  name: string;
  path: string;
  children?: FileTreeNode[];
}
