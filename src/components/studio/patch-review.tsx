"use client";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Check, X, Plus, Pencil, Trash2, AlertTriangle } from "lucide-react";
import { detectUnsafeCode } from "@/lib/security/patch";

interface FilePatch {
  path: string;
  action: "create" | "update" | "delete";
  content?: string;
}

interface PatchReviewProps {
  patch: {
    files: FilePatch[];
  };
  onApply: () => void;
  onReject: () => void;
}

export function PatchReview({ patch, onApply, onReject }: PatchReviewProps) {
  // Check for unsafe code in the patch
  const warnings = patch.files.flatMap((file) => {
    if (!file.content) return [];
    const fileWarnings = detectUnsafeCode(file.content);
    return fileWarnings.map((w) => ({ path: file.path, warning: w }));
  });

  return (
    <Dialog open={true} onOpenChange={() => onReject()}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Review Changes</DialogTitle>
          <DialogDescription>
            Review the proposed changes before applying them to your project.
          </DialogDescription>
        </DialogHeader>

        {/* Warnings */}
        {warnings.length > 0 && (
          <div className="rounded-lg border border-yellow-500/50 bg-yellow-500/10 p-3">
            <div className="flex items-center gap-2 text-yellow-500">
              <AlertTriangle className="h-4 w-4" />
              <span className="font-medium">Potential Issues Detected</span>
            </div>
            <ul className="mt-2 space-y-1 text-sm text-yellow-400">
              {warnings.map((w, i) => (
                <li key={i}>
                  <span className="font-mono text-xs">{w.path}</span>: {w.warning}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* File Changes */}
        <ScrollArea className="max-h-[400px]">
          <div className="space-y-4">
            {patch.files.map((file, index) => (
              <div
                key={index}
                className="rounded-lg border border-zinc-200 dark:border-zinc-800"
              >
                <div className="flex items-center gap-2 border-b border-zinc-200 bg-zinc-50 px-3 py-2 dark:border-zinc-800 dark:bg-zinc-900">
                  {file.action === "create" && (
                    <Plus className="h-4 w-4 text-green-500" />
                  )}
                  {file.action === "update" && (
                    <Pencil className="h-4 w-4 text-yellow-500" />
                  )}
                  {file.action === "delete" && (
                    <Trash2 className="h-4 w-4 text-red-500" />
                  )}
                  <span className="font-mono text-sm">{file.path}</span>
                  <span
                    className={`ml-auto rounded-full px-2 py-0.5 text-xs ${
                      file.action === "create"
                        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                        : file.action === "update"
                        ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                        : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                    }`}
                  >
                    {file.action}
                  </span>
                </div>

                {file.action !== "delete" && file.content && (
                  <div className="max-h-48 overflow-auto bg-zinc-950 p-3">
                    <pre className="font-mono text-xs text-zinc-300">
                      {file.content.slice(0, 2000)}
                      {file.content.length > 2000 && (
                        <span className="text-zinc-500">
                          {"\n"}... truncated ({file.content.length - 2000} more
                          chars)
                        </span>
                      )}
                    </pre>
                  </div>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={onReject}>
            <X className="mr-2 h-4 w-4" />
            Reject
          </Button>
          <Button onClick={onApply}>
            <Check className="mr-2 h-4 w-4" />
            Apply Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
