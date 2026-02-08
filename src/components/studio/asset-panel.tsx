"use client";

import { useState } from "react";
import { useProjectStore } from "@/lib/store/project-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "@/components/ui/use-toast";
import { Box, Plus, Loader2, Trash2, Download, RefreshCw } from "lucide-react";

interface AssetPanelProps {
  projectId: string;
}

export function AssetPanel({ projectId }: AssetPanelProps) {
  const { project, addAsset, updateAsset, removeAsset } = useProjectStore();
  const assets = project?.assets || [];

  const [prompt, setPrompt] = useState("");
  const [style, setStyle] = useState("realistic");
  const [isGenerating, setIsGenerating] = useState(false);

  async function generateAsset() {
    if (!prompt.trim()) return;

    const assetId = crypto.randomUUID();
    const assetName = prompt.slice(0, 30) + (prompt.length > 30 ? "..." : "");

    // Add pending asset
    addAsset({
      id: assetId,
      name: assetName,
      prompt,
      status: "pending",
    });

    setIsGenerating(true);

    try {
      const res = await fetch("/api/meshy/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          assetId,
          prompt,
          style,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        updateAsset(assetId, { status: "failed" });
        toast({ title: data.error || "Failed to start generation", variant: "destructive" });
        return;
      }

      updateAsset(assetId, {
        status: "processing",
        meshyJobId: data.jobId,
      });

      // Start polling
      pollAssetStatus(assetId, data.jobId);

      setPrompt("");
      toast({ title: "Asset generation started" });
    } catch (error) {
      console.error("Failed to generate asset:", error);
      updateAsset(assetId, { status: "failed" });
      toast({ title: "Failed to generate asset", variant: "destructive" });
    } finally {
      setIsGenerating(false);
    }
  }

  async function pollAssetStatus(assetId: string, jobId: string) {
    const maxAttempts = 60; // 5 minutes with 5s intervals
    let attempts = 0;

    const poll = async () => {
      if (attempts >= maxAttempts) {
        updateAsset(assetId, { status: "failed" });
        return;
      }

      try {
        const res = await fetch(`/api/meshy/status?id=${jobId}`);
        const data = await res.json();

        if (data.status === "completed") {
          updateAsset(assetId, {
            status: "completed",
            glbUrl: data.glbUrl,
            thumbnailUrl: data.thumbnailUrl,
          });
          toast({ title: "Asset generation complete" });
          return;
        }

        if (data.status === "failed") {
          updateAsset(assetId, { status: "failed" });
          toast({ title: "Asset generation failed", variant: "destructive" });
          return;
        }

        // Still processing, poll again
        attempts++;
        setTimeout(poll, 5000);
      } catch (error) {
        console.error("Polling error:", error);
        attempts++;
        setTimeout(poll, 5000);
      }
    };

    poll();
  }

  async function retryAsset(asset: (typeof assets)[0]) {
    removeAsset(asset.id);

    const newAssetId = crypto.randomUUID();
    addAsset({
      id: newAssetId,
      name: asset.name,
      prompt: asset.prompt,
      status: "pending",
    });

    try {
      const res = await fetch("/api/meshy/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          assetId: newAssetId,
          prompt: asset.prompt,
          style: "realistic",
        }),
      });

      const data = await res.json();

      if (res.ok) {
        updateAsset(newAssetId, {
          status: "processing",
          meshyJobId: data.jobId,
        });
        pollAssetStatus(newAssetId, data.jobId);
      } else {
        updateAsset(newAssetId, { status: "failed" });
      }
    } catch {
      updateAsset(newAssetId, { status: "failed" });
    }
  }

  return (
    <div className="flex h-full flex-col">
      {/* Generation Form */}
      <div className="border-b border-zinc-800 p-4">
        <div className="space-y-3">
          <div>
            <Label htmlFor="prompt" className="text-xs text-zinc-400">
              Describe your 3D asset
            </Label>
            <Input
              id="prompt"
              placeholder="A medieval sword with ornate handle..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="mt-1 bg-zinc-800 text-sm"
              onKeyDown={(e) => {
                if (e.key === "Enter" && prompt.trim()) {
                  generateAsset();
                }
              }}
            />
          </div>
          <div className="flex gap-2">
            <div className="flex-1">
              <Select value={style} onValueChange={setStyle}>
                <SelectTrigger className="bg-zinc-800 text-sm">
                  <SelectValue placeholder="Style" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="realistic">Realistic</SelectItem>
                  <SelectItem value="cartoon">Cartoon</SelectItem>
                  <SelectItem value="low-poly">Low Poly</SelectItem>
                  <SelectItem value="sculpture">Sculpture</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={generateAsset}
              disabled={!prompt.trim() || isGenerating}
              size="sm"
            >
              {isGenerating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Asset List */}
      <ScrollArea className="flex-1">
        {assets.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <Box className="mb-4 h-12 w-12 text-zinc-700" />
            <p className="text-sm text-zinc-500">No assets yet</p>
            <p className="mt-1 text-xs text-zinc-600">
              Generate 3D models from text prompts
            </p>
          </div>
        ) : (
          <div className="space-y-2 p-4">
            {assets.map((asset) => (
              <div
                key={asset.id}
                className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-3"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-zinc-200">
                      {asset.name}
                    </h4>
                    <p className="mt-0.5 text-xs text-zinc-500 line-clamp-2">
                      {asset.prompt}
                    </p>
                  </div>
                  <div className="ml-2 flex items-center gap-1">
                    {asset.status === "processing" && (
                      <Loader2 className="h-4 w-4 animate-spin text-indigo-400" />
                    )}
                    {asset.status === "completed" && asset.glbUrl && (
                      <a
                        href={asset.glbUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded p-1 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
                      >
                        <Download className="h-4 w-4" />
                      </a>
                    )}
                    {asset.status === "failed" && (
                      <button
                        onClick={() => retryAsset(asset)}
                        className="rounded p-1 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
                      >
                        <RefreshCw className="h-4 w-4" />
                      </button>
                    )}
                    <button
                      onClick={() => removeAsset(asset.id)}
                      className="rounded p-1 text-zinc-400 hover:bg-zinc-800 hover:text-red-400"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Status Badge */}
                <div className="mt-2">
                  <span
                    className={`inline-block rounded-full px-2 py-0.5 text-xs ${
                      asset.status === "completed"
                        ? "bg-green-900/30 text-green-400"
                        : asset.status === "processing"
                        ? "bg-indigo-900/30 text-indigo-400"
                        : asset.status === "failed"
                        ? "bg-red-900/30 text-red-400"
                        : "bg-zinc-800 text-zinc-400"
                    }`}
                  >
                    {asset.status}
                  </span>
                </div>

                {/* Thumbnail */}
                {asset.thumbnailUrl && (
                  <div className="mt-2 overflow-hidden rounded">
                    <img
                      src={asset.thumbnailUrl}
                      alt={asset.name}
                      className="h-20 w-full object-cover"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
