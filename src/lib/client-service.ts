import { nanoid } from "nanoid";
import { activityLogService } from "./activity-log-service";

export interface Client {
  id: string;
  name: string;
  industry: string;
  licenses: number;
  arr: string; // Stored as string for display format like "$12,000" or number if strictly typed
  renewal: string; // YYYY-MM-DD
  health: number;
  status: "Healthy" | "At Risk" | "Warning" | "Watch" | "Churned";
}

const STORAGE_KEY = "prasetia-clients-data";

const DEFAULT_CLIENTS: Client[] = [
  { id: "C001", name: "PT Global Teknologi", industry: "Tech", licenses: 450, arr: "$12,000", renewal: "2026-03-15", health: 35, status: "At Risk" },
  { id: "C002", name: "Indo Logistics Group", industry: "Logistics", licenses: 1200, arr: "$48,000", renewal: "2026-04-01", health: 42, status: "Warning" },
  { id: "C003", name: "Retail Maju Bersama", industry: "Retail", licenses: 80, arr: "$3,200", renewal: "2026-05-20", health: 88, status: "Healthy" },
  { id: "C004", name: "Bank Example Tbk", industry: "Finance", licenses: 2500, arr: "$110,000", renewal: "2026-02-28", health: 92, status: "Healthy" },
  { id: "C005", name: "StartUp Unicorn", industry: "Tech", licenses: 300, arr: "$9,500", renewal: "2026-06-10", health: 65, status: "Watch" },
];

export const clientService = {
  getAll: (): Client[] => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_CLIENTS));
      return DEFAULT_CLIENTS;
    }
    return JSON.parse(stored);
  },

  create: (client: Omit<Client, "id">): Client => {
    const clients = clientService.getAll();
    const newClient = { ...client, id: nanoid() };
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
    const updatedClient = { ...oldData, ...updates };
    clients[index] = updatedClient;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(clients));
    activityLogService.log("update", "client", id, `Updated client ${updatedClient.name}`, oldData, updatedClient);
    return updatedClient;
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
    localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_CLIENTS));
  },
  
  forceSet: (data: Client[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }
};
