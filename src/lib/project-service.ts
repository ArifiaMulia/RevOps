import { nanoid } from "nanoid";
import { activityLogService } from "./activity-log-service";

export interface Project {
  id: string;
  name: string;
  productId: string; // Link to Product
  clientId: string; // Link to Client (optional for now, plain string)
  type: "Implementation" | "Optimization" | "Training" | "Migration";
  status: "Not Started" | "In Progress" | "On Hold" | "Completed";
  progress: number; // 0-100
  startDate: string;
  endDate: string;
  owner: string;
}

const PROJECT_KEY = "prasetia-projects";

const DEFAULT_PROJECTS: Project[] = [
  { id: "PRJ01", name: "Lark Implementation Phase 1", productId: "P001", clientId: "C001", type: "Implementation", status: "In Progress", progress: 45, startDate: "2026-01-10", endDate: "2026-03-30", owner: "Fajar" },
  { id: "PRJ02", name: "Netsuite Finance Rollout", productId: "P002", clientId: "C002", type: "Implementation", status: "In Progress", progress: 70, startDate: "2025-11-01", endDate: "2026-02-28", owner: "Fajar" },
  { id: "PRJ03", name: "SealSuite Pilot", productId: "P003", clientId: "C004", type: "Implementation", status: "Not Started", progress: 0, startDate: "2026-03-01", endDate: "2026-04-15", owner: "Andi" },
  { id: "PRJ04", name: "Jedox Reporting Optimization", productId: "P004", clientId: "C003", type: "Optimization", status: "Completed", progress: 100, startDate: "2025-12-01", endDate: "2026-01-15", owner: "Dewi" },
  { id: "PRJ05", name: "Lark Advanced Workflow Training", productId: "P001", clientId: "C001", type: "Training", status: "In Progress", progress: 20, startDate: "2026-02-15", endDate: "2026-02-28", owner: "Budi" },
];

export const projectService = {
  getAll: (): Project[] => {
    const stored = localStorage.getItem(PROJECT_KEY);
    if (!stored) {
      localStorage.setItem(PROJECT_KEY, JSON.stringify(DEFAULT_PROJECTS));
      return DEFAULT_PROJECTS;
    }
    return JSON.parse(stored);
  },

  create: (item: Omit<Project, "id">) => {
    const all = projectService.getAll();
    const newItem = { ...item, id: nanoid() };
    localStorage.setItem(PROJECT_KEY, JSON.stringify([newItem, ...all]));
    activityLogService.log("create", "project", newItem.id, `Created project ${newItem.name}`, null, newItem);
    return newItem;
  },

  update: (id: string, updates: Partial<Project>) => {
    const all = projectService.getAll();
    const idx = all.findIndex(p => p.id === id);
    if (idx === -1) return null;
    const oldData = { ...all[idx] };
    const newData = { ...oldData, ...updates };
    all[idx] = newData;
    localStorage.setItem(PROJECT_KEY, JSON.stringify(all));
    activityLogService.log("update", "project", id, `Updated project ${newData.name}`, oldData, newData);
    return newData;
  },

  delete: (id: string) => {
    const all = projectService.getAll();
    const deleted = all.find(p => p.id === id);
    if (deleted) {
      const updated = all.filter(p => p.id !== id);
      localStorage.setItem(PROJECT_KEY, JSON.stringify(updated));
      activityLogService.log("delete", "project", id, `Deleted project ${deleted.name}`, deleted, null);
    }
  },

  forceSet: (data: Project[]) => localStorage.setItem(PROJECT_KEY, JSON.stringify(data))
};
