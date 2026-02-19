import { nanoid } from "nanoid";
import { toast } from "sonner";

export type ActionType = "create" | "update" | "delete";
export type EntityType = "client" | "team_member" | "workload_log" | "estimation" | "product" | "project" | "project_task";

export interface LogEntry {
  id: string;
  timestamp: string;
  user: string;
  action: ActionType;
  entityType: EntityType;
  entityId: string;
  description: string;
  previousData?: any;
  newData?: any;
}

const STORAGE_KEY = "prasetia-activity-logs";

export const activityLogService = {
  getAll: (): LogEntry[] => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  },

  log: (
    action: ActionType,
    entityType: EntityType,
    entityId: string,
    description: string,
    previousData?: any,
    newData?: any
  ) => {
    const logs = activityLogService.getAll();
    const currentUser = JSON.parse(localStorage.getItem("prasetia-user") || '{}');
    
    const newLog: LogEntry = {
      id: nanoid(),
      timestamp: new Date().toISOString(),
      user: currentUser.name || "System",
      action,
      entityType,
      entityId,
      description,
      previousData,
      newData
    };

    const updatedLogs = [newLog, ...logs];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedLogs));
    return newLog;
  },

  exportCSV: () => {
    const logs = activityLogService.getAll();
    if (logs.length === 0) {
      toast.error("No logs to export");
      return;
    }

    const headers = ["ID", "Timestamp", "User", "Action", "Entity Type", "Entity ID", "Description"];
    const csvContent = [
      headers.join(","),
      ...logs.map(log => [
        log.id,
        new Date(log.timestamp).toLocaleString(),
        `"${log.user}"`,
        log.action,
        log.entityType,
        log.entityId,
        `"${log.description}"`
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `activity_logs_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },

  exportXLS: () => {
    const logs = activityLogService.getAll();
    if (logs.length === 0) {
      toast.error("No logs to export");
      return;
    }

    // Using Tab Separated Values (TSV) which Excel opens natively and identifies correctly with .xls
    const headers = ["ID", "Timestamp", "User", "Action", "Entity Type", "Entity ID", "Description"];
    const tsvContent = [
      headers.join("\t"),
      ...logs.map(log => [
        log.id,
        new Date(log.timestamp).toLocaleString(),
        log.user,
        log.action,
        log.entityType,
        log.entityId,
        log.description
      ].join("\t"))
    ].join("\n");

    const blob = new Blob([tsvContent], { type: "application/vnd.ms-excel;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `activity_logs_${new Date().toISOString().split('T')[0]}.xls`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },

  getLogById: (id: string): LogEntry | undefined => {
    return activityLogService.getAll().find(l => l.id === id);
  }
};
