"use client";

import { useCallback, useMemo } from "react";
import { useProjectStore } from "@/lib/store/project-store";
import { getFileName, getFileLanguage } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";

interface CodeEditorProps {
  file?: {
    path: string;
    content: string;
  };
}

export function CodeEditor({ file }: CodeEditorProps) {
  const { updateFile } = useProjectStore();

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      if (file) {
        updateFile(file.path, e.target.value);
      }
    },
    [file, updateFile]
  );

  const lineNumbers = useMemo(() => {
    if (!file) return [];
    const lines = file.content.split("\n");
    return Array.from({ length: lines.length }, (_, i) => i + 1);
  }, [file]);

  if (!file) {
    return null;
  }

  return (
    <div className="flex h-full flex-col bg-zinc-950">
      {/* File Tab */}
      <div className="flex h-9 shrink-0 items-center border-b border-zinc-800 bg-zinc-900">
        <div className="flex items-center gap-2 border-r border-zinc-800 bg-zinc-800 px-4 py-1.5">
          <span className="text-sm text-zinc-300">{getFileName(file.path)}</span>
        </div>
      </div>

      {/* Editor Area */}
      <ScrollArea className="flex-1">
        <div className="flex min-h-full">
          {/* Line Numbers */}
          <div className="shrink-0 select-none border-r border-zinc-800 bg-zinc-900/50 py-4 text-right font-mono text-xs text-zinc-600">
            {lineNumbers.map((n) => (
              <div key={n} className="px-3 leading-6">
                {n}
              </div>
            ))}
          </div>

          {/* Code Area */}
          <div className="flex-1 p-4">
            <textarea
              value={file.content}
              onChange={handleChange}
              className="code-editor h-full min-h-[calc(100vh-12rem)] w-full resize-none border-none bg-transparent text-zinc-100 outline-none"
              spellCheck={false}
              autoCapitalize="off"
              autoCorrect="off"
              data-language={getFileLanguage(file.path)}
            />
          </div>
        </div>
      </ScrollArea>

      {/* Status Bar */}
      <div className="flex h-6 shrink-0 items-center justify-between border-t border-zinc-800 bg-zinc-900 px-4 text-xs text-zinc-500">
        <span>{getFileLanguage(file.path)}</span>
        <span>
          {file.content.split("\n").length} lines, {file.content.length} chars
        </span>
      </div>
    </div>
  );
}
