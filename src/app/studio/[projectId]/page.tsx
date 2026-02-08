"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useProjectStore, selectFileTree } from "@/lib/store/project-store";
import { ChatPanel } from "@/components/studio/chat-panel";
import { FileTree } from "@/components/studio/file-tree";
import { CodeEditor } from "@/components/studio/code-editor";
import { PreviewPanel } from "@/components/studio/preview-panel";
import { AssetPanel } from "@/components/studio/asset-panel";
import { PatchReview } from "@/components/studio/patch-review";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "@/components/ui/use-toast";
import {
  Gamepad2,
  Save,
  Download,
  ArrowLeft,
  Loader2,
  Play,
  Code2,
  Box,
  Check,
  X,
} from "lucide-react";

export default function ProjectEditor() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectId as string;

  const {
    project,
    setProject,
    selectedFile,
    isSaving,
    setIsSaving,
    pendingPatch,
    setPendingPatch,
  } = useProjectStore();

  const fileTree = useProjectStore(selectFileTree);
  const [isLoading, setIsLoading] = useState(true);
  const [previewKey, setPreviewKey] = useState(0);

  // Fetch project
  useEffect(() => {
    async function fetchProject() {
      try {
        const res = await fetch(`/api/projects/${projectId}`);
        if (!res.ok) {
          router.push("/studio");
          return;
        }
        const data = await res.json();
        setProject({
          id: data.project.id,
          name: data.project.name,
          description: data.project.description,
          files: data.project.files.map((f: { path: string; content: string }) => ({
            path: f.path,
            content: f.content,
          })),
          assets: data.project.assets || [],
          chatHistory: data.project.chatHistory || [],
          createdAt: new Date(data.project.createdAt),
          updatedAt: new Date(data.project.updatedAt),
        });
      } catch (error) {
        console.error("Failed to fetch project:", error);
        router.push("/studio");
      } finally {
        setIsLoading(false);
      }
    }

    fetchProject();
  }, [projectId, router, setProject]);

  // Save project
  const saveProject = useCallback(async () => {
    if (!project || isSaving) return;

    setIsSaving(true);
    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          files: project.files,
        }),
      });

      if (res.ok) {
        toast({ title: "Project saved" });
      } else {
        toast({ title: "Failed to save", variant: "destructive" });
      }
    } catch (error) {
      console.error("Failed to save:", error);
      toast({ title: "Failed to save", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  }, [project, projectId, isSaving, setIsSaving]);

  // Keyboard shortcuts
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        saveProject();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [saveProject]);

  // Export project
  async function exportProject() {
    try {
      const res = await fetch(`/api/projects/${projectId}/export`);
      if (!res.ok) throw new Error("Export failed");

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${project?.name || "game"}.zip`;
      a.click();
      URL.revokeObjectURL(url);

      toast({ title: "Project exported" });
    } catch (error) {
      console.error("Export failed:", error);
      toast({ title: "Export failed", variant: "destructive" });
    }
  }

  // Refresh preview
  function refreshPreview() {
    setPreviewKey((k) => k + 1);
  }

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-zinc-900">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
      </div>
    );
  }

  if (!project) {
    return null;
  }

  return (
    <div className="flex h-screen flex-col bg-zinc-900 text-zinc-100">
      {/* Top Bar */}
      <header className="flex h-12 shrink-0 items-center justify-between border-b border-zinc-800 bg-zinc-900 px-4">
        <div className="flex items-center gap-4">
          <Link
            href="/studio"
            className="flex items-center gap-2 text-zinc-400 hover:text-zinc-100"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="flex items-center gap-2">
            <Gamepad2 className="h-5 w-5 text-indigo-500" />
            <span className="font-medium">{project.name}</span>
          </div>
          {isSaving && (
            <span className="flex items-center gap-1 text-xs text-zinc-500">
              <Loader2 className="h-3 w-3 animate-spin" />
              Saving...
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={saveProject}
                disabled={isSaving}
              >
                <Save className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Save (Cmd+S)</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="sm" onClick={refreshPreview}>
                <Play className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Refresh Preview</TooltipContent>
          </Tooltip>

          <Button variant="outline" size="sm" onClick={exportProject}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel - Chat */}
        <div className="flex w-80 shrink-0 flex-col border-r border-zinc-800">
          <ChatPanel projectId={projectId} />
        </div>

        {/* Middle Panel - Files & Code */}
        <div className="flex flex-1 flex-col overflow-hidden">
          <div className="flex flex-1 overflow-hidden">
            {/* File Tree */}
            <div className="w-56 shrink-0 overflow-y-auto border-r border-zinc-800 bg-zinc-900/50">
              <FileTree files={fileTree} />
            </div>

            {/* Code Editor */}
            <div className="flex-1 overflow-hidden">
              {selectedFile ? (
                <CodeEditor
                  file={project.files.find((f) => f.path === selectedFile)}
                />
              ) : (
                <div className="flex h-full items-center justify-center text-zinc-500">
                  <div className="text-center">
                    <Code2 className="mx-auto h-12 w-12 text-zinc-700" />
                    <p className="mt-2">Select a file to edit</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Panel - Preview & Assets */}
        <div className="flex w-96 shrink-0 flex-col border-l border-zinc-800">
          <Tabs defaultValue="preview" className="flex flex-1 flex-col">
            <TabsList className="mx-2 mt-2 justify-start">
              <TabsTrigger value="preview" className="gap-2">
                <Play className="h-3.5 w-3.5" />
                Preview
              </TabsTrigger>
              <TabsTrigger value="assets" className="gap-2">
                <Box className="h-3.5 w-3.5" />
                Assets
              </TabsTrigger>
            </TabsList>
            <TabsContent value="preview" className="flex-1 p-2">
              <PreviewPanel key={previewKey} project={project} />
            </TabsContent>
            <TabsContent value="assets" className="flex-1 overflow-hidden p-2">
              <AssetPanel projectId={projectId} />
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Patch Review Modal */}
      {pendingPatch && (
        <PatchReview
          patch={pendingPatch}
          onApply={() => {
            // Apply patch to project files
            const { project, addFile, updateFile, deleteFile } =
              useProjectStore.getState();
            if (!project) return;

            for (const file of pendingPatch.files) {
              if (file.action === "delete") {
                deleteFile(file.path);
              } else if (file.action === "create" || file.action === "update") {
                if (project.files.find((f) => f.path === file.path)) {
                  updateFile(file.path, file.content || "");
                } else {
                  addFile(file.path, file.content || "");
                }
              }
            }

            setPendingPatch(null);
            toast({ title: "Changes applied" });
            refreshPreview();
          }}
          onReject={() => {
            setPendingPatch(null);
            toast({ title: "Changes rejected" });
          }}
        />
      )}
    </div>
  );
}
