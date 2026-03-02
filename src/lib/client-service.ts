import { nanoid } from "nanoid";
import { activityLogService } from "./activity-log-service";

export type ChurnRisk = "High" | "Mid" | "Low";

export interface Client {
  id: string;
  name: string;
  industry: string;
  licenses: number;
  arr: string; // Stored as string for display format like "$12,000"
  renewal: string; // YYYY-MM-DD
  health: number; // General health score (0-100)
  status: "Healthy" | "At Risk" | "Warning" | "Watch" | "Churned";
  // Advanced metrics
  dau?: number; // Daily Active Users
  adoption?: number; // %Adoption (calculated or stored)
  duration?: number; // Avg. time spent per user (mins)
  churnRisk?: ChurnRisk;
}

const STORAGE_KEY = "prasetia-clients-data";

/**
 * Calculate churn risk based on adoption and duration
 * High: %Adoption < 60% OR Duration < 50
 * Low: %Adoption > 90% AND Duration > 75
 * Mid: Neither
 */
export const calculateChurnRisk = (adoption: number, duration: number): ChurnRisk => {
  if (adoption < 60 || duration < 50) return "High";
  if (adoption > 90 && duration > 75) return "Low";
  return "Mid";
};

/**
 * Helper to update health metrics and churn risk
 */
export const enrichClientData = (client: any): Client => {
  const licenses = client.licenses || 0;
  const dau = client.dau || 0;
  const adoption = client.adoption ?? (licenses > 0 ? (dau / licenses) * 100 : 0);
  const duration = client.duration ?? 0;
  const churnRisk = calculateChurnRisk(adoption, duration);
  
  // Map churn risk to status for UI consistency if needed
  let status = client.status || "Watch";
  if (client.status !== "Churned") {
    if (churnRisk === "High") status = "At Risk";
    else if (churnRisk === "Low") status = "Healthy";
    else status = "Watch";
  }

  return {
    ...client,
    adoption,
    duration,
    churnRisk,
    status: status as any,
    health: Math.round(adoption * 0.7 + Math.min(100, (duration / 120) * 100) * 0.3)
  };
};

const DEFAULT_CLIENTS: any[] = [
  { id: "C001", name: "PT Global Teknologi", industry: "Tech", licenses: 450, arr: "$12,000", renewal: "2026-03-15", health: 35, status: "At Risk", dau: 180, duration: 45 },
  { id: "C002", name: "Indo Logistics Group", industry: "Logistics", licenses: 1200, arr: "$48,000", renewal: "2026-04-01", health: 42, status: "Warning", dau: 800, duration: 60 },
  { id: "C003", name: "Retail Maju Bersama", industry: "Retail", licenses: 80, arr: "$3,200", renewal: "2026-05-20", health: 88, status: "Healthy", dau: 75, duration: 90 },
  { id: "C004", name: "Bank Example Tbk", industry: "Finance", licenses: 2500, arr: "$110,000", renewal: "2026-02-28", health: 92, status: "Healthy", dau: 2350, duration: 85 },
  { id: "C005", name: "StartUp Unicorn", industry: "Tech", licenses: 300, arr: "$9,500", renewal: "2026-06-10", health: 65, status: "Watch", dau: 210, duration: 65 },
];

export const clientService = {
  getAll: (): Client[] => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_CLIENTS.map(enrichClientData)));
      return DEFAULT_CLIENTS.map(enrichClientData);
    }
    try {
      const data = JSON.parse(stored);
      return Array.isArray(data) ? data.map(enrichClientData) : DEFAULT_CLIENTS.map(enrichClientData);
    } catch (e) {
      return DEFAULT_CLIENTS.map(enrichClientData);
    }
  },

  create: (client: Omit<Client, "id">): Client => {
    const clients = clientService.getAll();
    const newClient = enrichClientData({ ...client, id: nanoid() });
    const updated = [newClient, ...clients];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    activityLogService.log("create", "client", newClient.id, `Created client ${newClient.name}`, null, newClient);
    return newClient;
  },

  update: (id: string, updates: Partial<Client>): Client | null => {
    const clients = clientService.getAll();
    const index = clients.findIndex((c) => c.id === id);
    if (index === -1) return null;

    const oldData = { ...clients[index] };
    const updatedClient = enrichClientData({ ...oldData, ...updates });
    clients[index] = updatedClient;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(clients));
    activityLogService.log("update", "client", id, `Updated client ${updatedClient.name}`, oldData, updatedClient);
    return updatedClient;
  },

  bulkUpsert: (data: Partial<Client>[]): void => {
    const clients = clientService.getAll();
    let addCount = 0;
    let updateCount = 0;

    data.forEach(item => {
      const existingIndex = clients.findIndex(c => c.name === item.name); // Using name as key if ID missing
      if (existingIndex !== -1) {
        clients[existingIndex] = enrichClientData({ ...clients[existingIndex], ...item });
        updateCount++;
      } else {
        const newClient = enrichClientData({
          id: nanoid(),
          name: item.name || "Unknown",
          industry: item.industry || "General",
          licenses: item.licenses || 0,
          arr: item.arr || "$0",
          renewal: item.renewal || new Date().toISOString().split('T')[0],
          health: 50,
          status: "Watch",
          ...item
        });
        clients.unshift(newClient);
        addCount++;
      }
    });

    localStorage.setItem(STORAGE_KEY, JSON.stringify(clients));
    activityLogService.log("update", "client", "bulk", `Bulk imported/updated ${data.length} clients (${addCount} new, ${updateCount} updated)`, null, null);
  },

  delete: (id: string): void => {
    const clients = clientService.getAll();
    const deleted = clients.find(c => c.id === id);
    const updated = clients.filter((c) => c.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    if (deleted) {
      activityLogService.log("delete", "client", id, `Deleted client ${deleted.name}`, deleted, null);
    }
  },
  
  reset: (): void => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_CLIENTS.map(enrichClientData)));
  },
  
  forceSet: (data: Client[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }
};
