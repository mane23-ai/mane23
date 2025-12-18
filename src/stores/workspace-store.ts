import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Tables } from '@/types/database';

type WorkspaceStore = {
  currentWorkspace: Tables<'workspaces'> | null;
  setCurrentWorkspace: (workspace: Tables<'workspaces'> | null) => void;
};

export const useWorkspaceStore = create<WorkspaceStore>()(
  persist(
    (set) => ({
      currentWorkspace: null,
      setCurrentWorkspace: (workspace) => set({ currentWorkspace: workspace }),
    }),
    {
      name: 'workspace-storage',
    }
  )
);
