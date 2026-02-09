"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Gamepad2,
  Plus,
  FolderOpen,
  Trash2,
  Clock,
  Loader2,
} from "lucide-react";
import { formatDate } from "@/lib/utils";

interface Project {
  id: string;
  name: string;
  description?: string;
  updatedAt: string;
  template?: {
    name: string;
    type: string;
  };
}

interface Template {
  id: string;
  name: string;
  description: string;
  type: string;
}

export default function StudioDashboard() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<string>("scratch");

  useEffect(() => {
    fetchProjects();
    fetchTemplates();
  }, []);

  async function fetchProjects() {
    try {
      const res = await fetch("/api/projects");
      if (res.ok) {
        const data = await res.json();
        setProjects(data.projects || []);
      }
    } catch (error) {
      console.error("Failed to fetch projects:", error);
    } finally {
      setIsLoading(false);
    }
  }

  async function fetchTemplates() {
    try {
      const res = await fetch("/api/templates");
      if (res.ok) {
        const data = await res.json();
        setTemplates(data.templates || []);
      }
    } catch (error) {
      console.error("Failed to fetch templates:", error);
    }
  }

  async function createProject() {
    if (!newProjectName.trim()) return;

    setIsCreating(true);
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newProjectName,
          templateId: selectedTemplate === "scratch" ? undefined : selectedTemplate,
        }),
      });

      if (res.ok) {
        const { project } = await res.json();
        router.push(`/studio/${project.id}`);
      }
    } catch (error) {
      console.error("Failed to create project:", error);
    } finally {
      setIsCreating(false);
    }
  }

  async function deleteProject(id: string) {
    if (!confirm("Are you sure you want to delete this project?")) return;

    try {
      const res = await fetch(`/api/projects/${id}`, { method: "DELETE" });
      if (res.ok) {
        setProjects(projects.filter((p) => p.id !== id));
      }
    } catch (error) {
      console.error("Failed to delete project:", error);
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      {/* Header */}
      <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2">
            <Gamepad2 className="h-7 w-7 text-indigo-600" />
            <span className="text-lg font-bold">AI Game Maker</span>
          </Link>
          <div className="flex items-center gap-4">
            <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  New Project
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Project</DialogTitle>
                  <DialogDescription>
                    Start a new game project from scratch or use a template.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Project Name</Label>
                    <Input
                      id="name"
                      placeholder="My Awesome Game"
                      value={newProjectName}
                      onChange={(e) => setNewProjectName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && newProjectName.trim()) {
                          createProject();
                        }
                      }}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Template (optional)</Label>
                    <Select
                      value={selectedTemplate}
                      onValueChange={setSelectedTemplate}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Start from scratch" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="scratch">Start from scratch</SelectItem>
                        {templates.map((template) => (
                          <SelectItem key={template.id} value={template.id}>
                            {template.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setShowNewDialog(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={createProject}
                    disabled={!newProjectName.trim() || isCreating}
                  >
                    {isCreating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      "Create Project"
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          Your Projects
        </h1>

        {isLoading ? (
          <div className="mt-8 flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
          </div>
        ) : projects.length === 0 ? (
          <div className="mt-8 rounded-xl border border-dashed border-zinc-300 bg-white p-12 text-center dark:border-zinc-700 dark:bg-zinc-900">
            <FolderOpen className="mx-auto h-12 w-12 text-zinc-400" />
            <h2 className="mt-4 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              No projects yet
            </h2>
            <p className="mt-2 text-zinc-600 dark:text-zinc-400">
              Create your first game project to get started.
            </p>
            <Button className="mt-6" onClick={() => setShowNewDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Project
            </Button>
          </div>
        ) : (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <div
                key={project.id}
                className="group relative rounded-xl border border-zinc-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900"
              >
                <Link href={`/studio/${project.id}`} className="block">
                  <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">
                    {project.name}
                  </h3>
                  {project.template && (
                    <span className="mt-1 inline-block rounded-full bg-indigo-100 px-2 py-0.5 text-xs text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300">
                      {project.template.name}
                    </span>
                  )}
                  <div className="mt-3 flex items-center gap-1 text-sm text-zinc-500 dark:text-zinc-400">
                    <Clock className="h-3.5 w-3.5" />
                    {formatDate(project.updatedAt)}
                  </div>
                </Link>
                <button
                  onClick={() => deleteProject(project.id)}
                  className="absolute right-4 top-4 rounded p-1 text-zinc-400 opacity-0 transition-opacity hover:bg-zinc-100 hover:text-red-600 group-hover:opacity-100 dark:hover:bg-zinc-800"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Templates Section */}
        {templates.length > 0 && (
          <section className="mt-12">
            <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
              Starter Templates
            </h2>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              Quick-start your project with these pre-built templates
            </p>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {templates.map((template) => (
                <div
                  key={template.id}
                  className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900"
                >
                  <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">
                    {template.name}
                  </h3>
                  <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                    {template.description}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-4"
                    onClick={() => {
                      setSelectedTemplate(template.id);
                      setNewProjectName(`My ${template.name}`);
                      setShowNewDialog(true);
                    }}
                  >
                    Use Template
                  </Button>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
