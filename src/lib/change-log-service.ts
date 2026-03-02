import { nanoid } from "nanoid";

export interface ChangeLogEntry {
  id: string;
  filename: string;
  uploadedAt: string;
  uploadedBy: string;
  rowCount: number;
  status: "Completed" | "Pending" | "Error";
  fileData?: string; // Base64 data
}

const STORAGE_KEY = "revops-change-logs";

const INITIAL_LOGS: ChangeLogEntry[] = [
  {
    id: "log-1",
    filename: "Change Log (19022026).xlsx",
    uploadedAt: "2026-02-19T08:23:55Z",
    uploadedBy: "Arifia Mulia",
    rowCount: 1250,
    status: "Completed"
  }
];

export const changeLogService = {
  getAll: (): ChangeLogEntry[] => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored || stored === "undefined" || stored === "null") return INITIAL_LOGS;
      const parsed = JSON.parse(stored);
      return Array.isArray(parsed) ? parsed : INITIAL_LOGS;
    } catch (e) {
      return INITIAL_LOGS;
    }
  },

  add: (log: Omit<ChangeLogEntry, "id" | "uploadedAt" | "status">): ChangeLogEntry => {
    const all = changeLogService.getAll();
    const newEntry: ChangeLogEntry = {
      ...log,
      id: nanoid(),
      uploadedAt: new Date().toISOString(),
      status: "Completed"
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify([newEntry, ...all]));
    return newEntry;
  },

  delete: (id: string) => {
    const all = changeLogService.getAll();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all.filter(l => l.id !== id)));
  }
};
