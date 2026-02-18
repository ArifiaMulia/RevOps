import { nanoid } from "nanoid";
import { activityLogService } from "./activity-log-service";

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  team: "Presales" | "AfterSales" | "Delivery" | "IT";
  load: number; // Utilization %
  status: "Normal" | "Warning" | "Critical";
  avatarUrl?: string;
}

export interface WorkloadLog {
  id: string;
  memberId: string;
  memberName: string; // denormalized for easier display
  date: string;
  hours: number;
  activity: string;
}

const MEMBERS_KEY = "prasetia-team-members";
const LOGS_KEY = "prasetia-workload-logs";

const DEFAULT_MEMBERS: TeamMember[] = [
  { id: "M001", name: "Presales 1", role: "Solution Engineer", team: "Presales", load: 150, status: "Critical" },
  { id: "M002", name: "Presales 2", role: "Bid Specialist", team: "Presales", load: 135, status: "Critical" },
  { id: "M003", name: "Support 1", role: "L1 Support", team: "AfterSales", load: 60, status: "Normal" },
  { id: "M004", name: "Support 2", role: "L2 Support", team: "AfterSales", load: 70, status: "Normal" },
  { id: "M005", name: "Dev 1", role: "Developer", team: "Delivery", load: 85, status: "Warning" },
];

export const workloadService = {
  getMembers: (): TeamMember[] => {
    const stored = localStorage.getItem(MEMBERS_KEY);
    if (!stored) {
      localStorage.setItem(MEMBERS_KEY, JSON.stringify(DEFAULT_MEMBERS));
      return DEFAULT_MEMBERS;
    }
    return JSON.parse(stored);
  },

  getLogs: (): WorkloadLog[] => {
    const stored = localStorage.getItem(LOGS_KEY);
    return stored ? JSON.parse(stored) : [];
  },

  // Team Member CRUD
  createMember: (member: Omit<TeamMember, "id">) => {
    const members = workloadService.getMembers();
    const newMember = { ...member, id: nanoid() };
    localStorage.setItem(MEMBERS_KEY, JSON.stringify([newMember, ...members]));
    
    activityLogService.log("create", "team_member", newMember.id, `Created team member ${newMember.name}`, null, newMember);
    return newMember;
  },

  updateMember: (id: string, updates: Partial<TeamMember>) => {
    const members = workloadService.getMembers();
    const index = members.findIndex(m => m.id === id);
    if (index === -1) return null;

    const oldData = { ...members[index] };
    const newData = { ...oldData, ...updates };
    members[index] = newData;
    localStorage.setItem(MEMBERS_KEY, JSON.stringify(members));

    activityLogService.log("update", "team_member", id, `Updated team member ${newData.name}`, oldData, newData);
    return newData;
  },

  deleteMember: (id: string) => {
    const members = workloadService.getMembers();
    const deleted = members.find(m => m.id === id);
    if (!deleted) return;

    const updated = members.filter(m => m.id !== id);
    localStorage.setItem(MEMBERS_KEY, JSON.stringify(updated));

    activityLogService.log("delete", "team_member", id, `Deleted team member ${deleted.name}`, deleted, null);
  },

  // Workload Log CRUD
  createLog: (log: Omit<WorkloadLog, "id">) => {
    const logs = workloadService.getLogs();
    const newLog = { ...log, id: nanoid() };
    localStorage.setItem(LOGS_KEY, JSON.stringify([newLog, ...logs]));

    activityLogService.log("create", "workload_log", newLog.id, `Logged ${newLog.hours}h for ${newLog.memberName}`, null, newLog);
    return newLog;
  },
  
  // Specific restore/force methods (bypassing log generation to avoid loops during restore)
  forceSetMembers: (members: TeamMember[]) => {
    localStorage.setItem(MEMBERS_KEY, JSON.stringify(members));
  },
  forceSetLogs: (logs: WorkloadLog[]) => {
    localStorage.setItem(LOGS_KEY, JSON.stringify(logs));
  }
};
