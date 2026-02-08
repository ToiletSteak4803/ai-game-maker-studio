import { create } from "zustand";
import type { FileTreeNode } from "@/lib/utils";

export interface ProjectFile {
  path: string;
  content: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: Date;
}

export interface Asset {
  id: string;
  name: string;
  prompt: string;
  status: "pending" | "processing" | "completed" | "failed";
  glbUrl?: string;
  thumbnailUrl?: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  files: ProjectFile[];
  assets: Asset[];
  chatHistory: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
}

interface ProjectState {
  // Current project
  project: Project | null;
  setProject: (project: Project | null) => void;

  // File management
  selectedFile: string | null;
  selectFile: (path: string | null) => void;
  updateFile: (path: string, content: string) => void;
  addFile: (path: string, content: string) => void;
  deleteFile: (path: string) => void;

  // Chat
  addMessage: (message: Omit<ChatMessage, "id" | "createdAt">) => void;

  // Assets
  addAsset: (asset: Asset) => void;
  updateAsset: (id: string, updates: Partial<Asset>) => void;
  removeAsset: (id: string) => void;

  // UI State
  isSaving: boolean;
  setIsSaving: (isSaving: boolean) => void;
  isGenerating: boolean;
  setIsGenerating: (isGenerating: boolean) => void;

  // Pending patch for review
  pendingPatch: PatchResult | null;
  setPendingPatch: (patch: PatchResult | null) => void;
}

interface PatchResult {
  files: Array<{
    path: string;
    action: "create" | "update" | "delete";
    content?: string;
  }>;
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  project: null,
  setProject: (project) => set({ project }),

  selectedFile: null,
  selectFile: (path) => set({ selectedFile: path }),

  updateFile: (path, content) => {
    const { project } = get();
    if (!project) return;

    const files = project.files.map((f) =>
      f.path === path ? { ...f, content } : f
    );
    set({
      project: { ...project, files, updatedAt: new Date() },
    });
  },

  addFile: (path, content) => {
    const { project } = get();
    if (!project) return;

    const existing = project.files.find((f) => f.path === path);
    if (existing) {
      get().updateFile(path, content);
      return;
    }

    set({
      project: {
        ...project,
        files: [...project.files, { path, content }],
        updatedAt: new Date(),
      },
    });
  },

  deleteFile: (path) => {
    const { project, selectedFile } = get();
    if (!project) return;

    set({
      project: {
        ...project,
        files: project.files.filter((f) => f.path !== path),
        updatedAt: new Date(),
      },
      selectedFile: selectedFile === path ? null : selectedFile,
    });
  },

  addMessage: (message) => {
    const { project } = get();
    if (!project) return;

    const newMessage: ChatMessage = {
      ...message,
      id: crypto.randomUUID(),
      createdAt: new Date(),
    };

    set({
      project: {
        ...project,
        chatHistory: [...project.chatHistory, newMessage],
      },
    });
  },

  addAsset: (asset) => {
    const { project } = get();
    if (!project) return;

    set({
      project: {
        ...project,
        assets: [...project.assets, asset],
      },
    });
  },

  updateAsset: (id, updates) => {
    const { project } = get();
    if (!project) return;

    set({
      project: {
        ...project,
        assets: project.assets.map((a) =>
          a.id === id ? { ...a, ...updates } : a
        ),
      },
    });
  },

  removeAsset: (id) => {
    const { project } = get();
    if (!project) return;

    set({
      project: {
        ...project,
        assets: project.assets.filter((a) => a.id !== id),
      },
    });
  },

  isSaving: false,
  setIsSaving: (isSaving) => set({ isSaving }),

  isGenerating: false,
  setIsGenerating: (isGenerating) => set({ isGenerating }),

  pendingPatch: null,
  setPendingPatch: (patch) => set({ pendingPatch: patch }),
}));

// Selectors
export const selectFileTree = (state: ProjectState): FileTreeNode[] => {
  if (!state.project) return [];

  const paths = state.project.files.map((f) => f.path);
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

  const sortTree = (nodes: FileTreeNode[]): FileTreeNode[] => {
    return nodes
      .sort((a, b) => {
        const aIsFolder = !!a.children;
        const bIsFolder = !!b.children;
        if (aIsFolder !== bIsFolder) return bIsFolder ? 1 : -1;
        return a.name.localeCompare(b.name);
      })
      .map((node) => ({
        ...node,
        children: node.children ? sortTree(node.children) : undefined,
      }));
  };

  return sortTree(root.children || []);
};
