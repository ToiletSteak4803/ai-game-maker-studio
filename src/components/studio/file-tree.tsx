"use client";

import { useState } from "react";
import { useProjectStore } from "@/lib/store/project-store";
import type { FileTreeNode } from "@/lib/utils";
import { cn, getFileExtension } from "@/lib/utils";
import {
  ChevronRight,
  ChevronDown,
  File,
  Folder,
  FolderOpen,
} from "lucide-react";

interface FileTreeProps {
  files: FileTreeNode[];
}

export function FileTree({ files }: FileTreeProps) {
  return (
    <div className="py-2">
      <div className="mb-2 px-3 text-xs font-medium uppercase tracking-wider text-zinc-500">
        Files
      </div>
      <div className="space-y-0.5">
        {files.map((node) => (
          <TreeNode key={node.path} node={node} depth={0} />
        ))}
      </div>
    </div>
  );
}

function TreeNode({ node, depth }: { node: FileTreeNode; depth: number }) {
  const [isOpen, setIsOpen] = useState(depth < 2);
  const { selectedFile, selectFile } = useProjectStore();
  const isFolder = !!node.children;
  const isSelected = selectedFile === node.path;

  const handleClick = () => {
    if (isFolder) {
      setIsOpen(!isOpen);
    } else {
      selectFile(node.path);
    }
  };

  return (
    <div>
      <button
        onClick={handleClick}
        className={cn(
          "flex w-full items-center gap-1 px-2 py-1 text-left text-sm hover:bg-zinc-800",
          isSelected && !isFolder && "bg-zinc-800 text-indigo-400"
        )}
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
      >
        {isFolder ? (
          <>
            {isOpen ? (
              <ChevronDown className="h-4 w-4 shrink-0 text-zinc-500" />
            ) : (
              <ChevronRight className="h-4 w-4 shrink-0 text-zinc-500" />
            )}
            {isOpen ? (
              <FolderOpen className="h-4 w-4 shrink-0 text-indigo-400" />
            ) : (
              <Folder className="h-4 w-4 shrink-0 text-zinc-400" />
            )}
          </>
        ) : (
          <>
            <span className="w-4" />
            <FileIcon ext={getFileExtension(node.path)} />
          </>
        )}
        <span className="truncate text-zinc-300">{node.name}</span>
      </button>
      {isFolder && isOpen && node.children && (
        <div>
          {node.children.map((child) => (
            <TreeNode key={child.path} node={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

function FileIcon({ ext }: { ext: string }) {
  const colorMap: Record<string, string> = {
    ts: "text-blue-400",
    tsx: "text-blue-400",
    js: "text-yellow-400",
    jsx: "text-yellow-400",
    json: "text-yellow-600",
    css: "text-pink-400",
    scss: "text-pink-400",
    html: "text-orange-400",
    md: "text-zinc-400",
  };

  return (
    <File className={cn("h-4 w-4 shrink-0", colorMap[ext] || "text-zinc-500")} />
  );
}
