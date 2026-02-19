import { nanoid } from "nanoid";
import { activityLogService } from "./activity-log-service";

export interface Estimation {
  id: string;
  projectName: string;
  product: string;
  type: string;
  mandays: number;
  cost: number;
  createdAt: string;
}

const ESTIMATION_KEY = "prasetia-estimations";

export const estimationService = {
  getAll: (): Estimation[] => {
    const stored = localStorage.getItem(ESTIMATION_KEY);
    return stored ? JSON.parse(stored) : [];
  },

  create: (est: Omit<Estimation, "id" | "createdAt">) => {
    const all = estimationService.getAll();
    const newEst = { 
      ...est, 
      id: nanoid(), 
      createdAt: new Date().toISOString().split('T')[0] 
    };
    localStorage.setItem(ESTIMATION_KEY, JSON.stringify([newEst, ...all]));

    activityLogService.log("create", "estimation", newEst.id, `Created estimation for ${newEst.projectName}`, null, newEst);
    return newEst;
  },

  delete: (id: string) => {
    const all = estimationService.getAll();
    const deleted = all.find(e => e.id === id);
    if (!deleted) return;

    const updated = all.filter(e => e.id !== id);
    localStorage.setItem(ESTIMATION_KEY, JSON.stringify(updated));

    activityLogService.log("delete", "estimation", id, `Deleted estimation for ${deleted.projectName}`, deleted, null);
  },

  forceSet: (data: Estimation[]) => {
    localStorage.setItem(ESTIMATION_KEY, JSON.stringify(data));
  }
};
