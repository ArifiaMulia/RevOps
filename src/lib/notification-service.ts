import { nanoid } from "nanoid";

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  timestamp: string;
  read: boolean;
}

const STORAGE_KEY = "revops-notifications";

const INITIAL_NOTIFICATIONS: Notification[] = [
  {
    id: "n1",
    title: "System Update",
    message: "RevOps Hub v3.1 is now live with new Client 360 features.",
    type: "info",
    timestamp: new Date().toISOString(),
    read: false
  },
  {
    id: "n2",
    title: "Low Health Score Alert",
    message: "PT Global Teknologi health score dropped below 40.",
    type: "warning",
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    read: false
  },
  {
    id: "n3",
    title: "New Client Added",
    message: "Arifia Mulia added 'StartUp Unicorn' to Client 360.",
    type: "success",
    timestamp: new Date(Date.now() - 86400000).toISOString(),
    read: true
  }
];

export const notificationService = {
  getAll: (): Notification[] => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_NOTIFICATIONS));
      return INITIAL_NOTIFICATIONS;
    }
    try {
      const data = JSON.parse(stored);
      return Array.isArray(data) ? data : INITIAL_NOTIFICATIONS;
    } catch (e) {
      return INITIAL_NOTIFICATIONS;
    }
  },

  add: (notif: Omit<Notification, "id" | "timestamp" | "read">): Notification => {
    const all = notificationService.getAll();
    const newNotif: Notification = {
      ...notif,
      id: nanoid(),
      timestamp: new Date().toISOString(),
      read: false
    };
    const updated = [newNotif, ...all];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated.slice(0, 50))); // Keep last 50
    return newNotif;
  },

  markAsRead: (id: string): void => {
    const all = notificationService.getAll();
    const index = all.findIndex(n => n.id === id);
    if (index !== -1) {
      all[index].read = true;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
    }
  },

  markAllAsRead: (): void => {
    const all = notificationService.getAll();
    all.forEach(n => n.read = true);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  },

  delete: (id: string): void => {
    const all = notificationService.getAll();
    const updated = all.filter(n => n.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  }
};
