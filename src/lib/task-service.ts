import { nanoid } from "nanoid";
import { activityLogService } from "./activity-log-service";

export interface Task {
  id: string;
  projectId: string;
  title: string;
  assignee: string;
  status: "Todo" | "In Progress" | "Done";
  priority: "Low" | "Medium" | "High";
  dueDate: string;
}

const TASK_KEY = "prasetia-tasks";

export const taskService = {
  getAll: (): Task[] => {
    const stored = localStorage.getItem(TASK_KEY);
    return stored ? JSON.parse(stored) : [];
  },

  getByProject: (projectId: string): Task[] => {
    return taskService.getAll().filter(t => t.projectId === projectId);
  },

  create: (item: Omit<Task, "id">) => {
    const all = taskService.getAll();
    const newItem = { ...item, id: nanoid() };
    localStorage.setItem(TASK_KEY, JSON.stringify([newItem, ...all]));
    activityLogService.log("create", "project_task", newItem.id, `Created task ${newItem.title}`, null, newItem);
    return newItem;
  },

  update: (id: string, updates: Partial<Task>) => {
    const all = taskService.getAll();
    const idx = all.findIndex(t => t.id === id);
    if (idx === -1) return null;
    const oldData = { ...all[idx] };
    const newData = { ...oldData, ...updates };
    all[idx] = newData;
    localStorage.setItem(TASK_KEY, JSON.stringify(all));
    activityLogService.log("update", "project_task", id, `Updated task ${newData.title}`, oldData, newData);
    return newData;
  },

  delete: (id: string) => {
    const all = taskService.getAll();
    const deleted = all.find(t => t.id === id);
    if (deleted) {
      const updated = all.filter(t => t.id !== id);
      localStorage.setItem(TASK_KEY, JSON.stringify(updated));
      activityLogService.log("delete", "project_task", id, `Deleted task ${deleted.title}`, deleted, null);
    }
  }
};
