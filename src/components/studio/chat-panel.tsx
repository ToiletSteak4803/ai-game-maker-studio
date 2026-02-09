"use client";

import { useState, useRef, useEffect } from "react";
import { useProjectStore } from "@/lib/store/project-store";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Loader2, User, Bot, Sparkles } from "lucide-react";

interface ChatPanelProps {
  projectId: string;
}

export function ChatPanel({ projectId }: ChatPanelProps) {
  const [input, setInput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const project = useProjectStore((state) => state.project);
  const messages = project?.chatHistory || [];

  const addMessage = useProjectStore((state) => state.addMessage);
  const setPendingPatch = useProjectStore((state) => state.setPendingPatch);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  async function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault();

    const trimmedInput = input.trim();
    if (!trimmedInput || isGenerating) return;

    // Add user message
    addMessage({ role: "user", content: trimmedInput });
    setInput("");
    setIsGenerating(true);

    try {
      const res = await fetch("/api/codex/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          prompt: trimmedInput,
          files: project?.files || [],
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        addMessage({
          role: "assistant",
          content: `Error: ${data.error || "Failed to generate code"}`,
        });
        return;
      }

      // Add assistant response
      addMessage({
        role: "assistant",
        content: data.explanation || "Here are the changes I made:",
      });

      // Set pending patch for review
      if (data.patch?.files?.length > 0) {
        setPendingPatch(data.patch);
      }
    } catch (error) {
      console.error("Generation failed:", error);
      addMessage({
        role: "assistant",
        content: "Sorry, I encountered an error. Please try again.",
      });
    } finally {
      setIsGenerating(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex h-10 shrink-0 items-center border-b border-zinc-800 px-4">
        <Sparkles className="mr-2 h-4 w-4 text-indigo-500" />
        <span className="text-sm font-medium">Game Chat</span>
      </div>

      {/* Messages */}
      <ScrollArea ref={scrollRef} className="flex-1 p-4">
        {messages.length === 0 ? (
          <div className="text-center text-sm text-zinc-500">
            <p className="mb-2">Describe what you want to create!</p>
            <p className="text-xs text-zinc-600">
              Example: &quot;Add a double jump to the player&quot;
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 ${
                  msg.role === "user" ? "justify-end" : ""
                }`}
              >
                {msg.role === "assistant" && (
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-600">
                    <Bot className="h-4 w-4 text-white" />
                  </div>
                )}
                <div
                  className={`rounded-lg px-3 py-2 text-sm ${
                    msg.role === "user"
                      ? "bg-indigo-600 text-white"
                      : "bg-zinc-800 text-zinc-100"
                  }`}
                  style={{ maxWidth: "85%" }}
                >
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                </div>
                {msg.role === "user" && (
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-zinc-700">
                    <User className="h-4 w-4 text-zinc-300" />
                  </div>
                )}
              </div>
            ))}
            {isGenerating && (
              <div className="flex gap-3">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-600">
                  <Bot className="h-4 w-4 text-white" />
                </div>
                <div className="flex items-center gap-2 rounded-lg bg-zinc-800 px-3 py-2 text-sm">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-zinc-400">Generating code...</span>
                </div>
              </div>
            )}
          </div>
        )}
      </ScrollArea>

      {/* Input */}
      <div className="border-t border-zinc-800 p-4">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Describe what you want..."
            className="flex-1 resize-none rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            rows={2}
            disabled={isGenerating}
          />
          <Button
            type="submit"
            size="sm"
            disabled={!input.trim() || isGenerating}
            className="self-end"
          >
            {isGenerating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
