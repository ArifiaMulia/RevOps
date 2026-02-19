// @ts-nocheck
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Download, History, RotateCcw, FileSpreadsheet } from "lucide-react";
import { activityLogService, type LogEntry, type EntityType } from "@/lib/activity-log-service";
import { clientService } from "@/lib/client-service";
import { workloadService } from "@/lib/workload-service";
import { estimationService } from "@/lib/estimation-service";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useAuth, PERMISSIONS } from "@/contexts/AuthContext";
import { useLocation } from "wouter";

export default function ActivityLogs() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const { hasPermission } = useAuth();
  const [, setLocation] = useLocation();

  // Redirect if no permission
  useEffect(() => {
    if (!hasPermission("ACTIVITY_LOGS", "view")) {
      toast.error("Access Denied: You do not have permission to view Audit Logs.");
      setLocation("/");
    }
  }, [hasPermission, setLocation]);

  useEffect(() => {
    setLogs(activityLogService.getAll());
  }, []);

  const handleExportCSV = () => {
    activityLogService.exportCSV();
    toast.success("Activity logs exported to CSV");
  };

  const handleExportXLS = () => {
    activityLogService.exportXLS();
    toast.success("Activity logs exported to XLS");
  };

  const handleRestore = (log: LogEntry) => {
    if (!hasPermission("ACTIVITY_LOGS", "manage")) {
      toast.error("Permission Denied: Only administrators can restore system state.");
      return;
    }

    try {
      if (log.entityType === "client") {
        restoreEntity(log, clientService);
      } else if (log.entityType === "team_member") {
        const members = workloadService.getMembers();
        if (log.action === "update" && log.previousData) {
           const idx = members.findIndex(m => m.id === log.entityId);
           if (idx !== -1) members[idx] = log.previousData;
           workloadService.forceSetMembers(members);
        } else if (log.action === "delete" && log.previousData) {
           workloadService.forceSetMembers([...members, log.previousData]);
        } else if (log.action === "create") {
           workloadService.forceSetMembers(members.filter(m => m.id !== log.entityId));
        }
      } else if (log.entityType === "estimation") {
        const ests = estimationService.getAll();
        if (log.action === "delete" && log.previousData) {
          estimationService.forceSet([...ests, log.previousData]);
        } else if (log.action === "create") {
          estimationService.forceSet(ests.filter(e => e.id !== log.entityId));
        }
      }
      
      toast.success("State restored successfully");
      setTimeout(() => window.location.reload(), 500);
    } catch (e) {
      toast.error("Failed to restore state");
    }
  };

  const restoreEntity = (log: LogEntry, service: any) => {
    const all = service.getAll();
    if (log.action === "update" && log.previousData) {
      const idx = all.findIndex((i: any) => i.id === log.entityId);
      if (idx !== -1) all[idx] = log.previousData;
      service.forceSet(all);
    } else if (log.action === "delete" && log.previousData) {
      service.forceSet([...all, log.previousData]);
    } else if (log.action === "create") {
      service.forceSet(all.filter((i: any) => i.id !== log.entityId));
    }
  };

  if (!hasPermission("ACTIVITY_LOGS", "view")) return null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Audit Trail & Recovery</h1>
          <p className="text-muted-foreground">Track all system changes and restore previous states.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleExportCSV}>
            <Download className="w-4 h-4 mr-2" /> CSV
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportXLS}>
            <FileSpreadsheet className="w-4 h-4 mr-2 text-emerald-600" /> Excel (XLS)
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Activity History</CardTitle>
          <CardDescription>Recent actions performed by users.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Entity</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Restore</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No activity logs found.
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(log.timestamp).toLocaleString()}
                    </TableCell>
                    <TableCell className="font-medium">{log.user}</TableCell>
                    <TableCell>
                      <Badge 
                        variant="outline" 
                        className={
                          log.action === "create" ? "text-green-600 bg-green-50 border-green-200" :
                          log.action === "delete" ? "text-red-600 bg-red-50 border-red-200" :
                          "text-blue-600 bg-blue-50 border-blue-200"
                        }
                      >
                        {log.action.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell className="capitalize">{log.entityType.replace('_', ' ')}</TableCell>
                    <TableCell className="text-sm">{log.description}</TableCell>
                    <TableCell>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleRestore(log)}
                        title="Revert this action"
                        disabled={!hasPermission("ACTIVITY_LOGS", "manage")}
                        className={!hasPermission("ACTIVITY_LOGS", "manage") ? "opacity-50 cursor-not-allowed" : ""}
                      >
                        <RotateCcw className="w-4 h-4 text-muted-foreground hover:text-primary" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
