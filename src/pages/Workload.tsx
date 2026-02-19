// @ts-nocheck
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { 
  Users, 
  Calendar, 
  Clock, 
  AlertCircle, 
  CheckCircle2,
  Mail,
  ExternalLink,
  Plus,
  Settings2,
  BarChart4
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useState, useEffect } from "react";
import { workloadService, type TeamMember } from "@/lib/workload-service";
import { 
  Radar, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  ResponsiveContainer 
} from 'recharts';
import { toast } from "sonner";

interface Task {
  id: string;
  title: string;
  assignee: string;
  priority: 'high' | 'medium' | 'low';
  status: 'todo' | 'in_progress' | 'completed';
  dueDate: string;
  isLarkSynced?: boolean;
}

const INITIAL_TASKS: Task[] = [
  { id: "1", title: "Review Q1 Proposal", assignee: "Arifia Mulia", priority: "high", status: "in_progress", dueDate: "2026-02-25", isLarkSynced: true },
  { id: "2", title: "Update Client 360 Records", assignee: "Dedi Setiawan", priority: "medium", status: "todo", dueDate: "2026-02-28", isLarkSynced: false },
  { id: "3", title: "Generate Monthly Margin Report", assignee: "Budi Santoso", priority: "low", status: "completed", dueDate: "2026-02-15", isLarkSynced: true },
];

const PERFORMANCE_METRICS = [
  { subject: 'Capacity', fullMark: 100 },
  { subject: 'Productivity', fullMark: 100 },
  { subject: 'Accuracy', fullMark: 100 },
  { subject: 'Speed', fullMark: 100 },
  { subject: 'Collaboration', fullMark: 100 },
  { subject: 'Reliability', fullMark: 100 },
];

export default function Workload() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);
  const [selectedMember, setSelectedMember] = useState<string>("");
  const [isAutomationOpen, setIsAutomationOpen] = useState(false);
  const [automationSettings, setAutomationSettings] = useState({
    emailAlerts: true,
    weeklyReport: true,
    larkSync: true,
    threshold: 85
  });

  useEffect(() => {
    const team = workloadService.getMembers();
    setMembers(team);
    if (team.length > 0) {
      setSelectedMember(team[0].id);
    }
  }, []);

  const getCapacityColor = (capacity: number) => {
    if (capacity > 90) return "bg-red-500";
    if (capacity > 70) return "bg-orange-500";
    return "bg-emerald-500";
  };

  const handleLarkSync = (taskId: string) => {
    setTasks(tasks.map(t => t.id === taskId ? { ...t, isLarkSynced: true } : t));
    toast.success("Task synchronized with Lark");
  };

  const handleSaveAutomation = () => {
    toast.success("Automation settings updated");
    setIsAutomationOpen(false);
  };

  const getMemberPerformanceData = () => {
    const member = members.find(m => m.id === selectedMember);
    if (!member) return [];

    // Mock performance data based on member ID for variance
    const seed = member.id.length;
    return PERFORMANCE_METRICS.map(metric => {
      let value = 75;
      if (metric.subject === 'Capacity') value = member.capacity;
      else if (metric.subject === 'Productivity') value = 60 + (seed % 35);
      else if (metric.subject === 'Accuracy') value = 80 + (seed % 15);
      else if (metric.subject === 'Speed') value = 55 + (seed % 40);
      else if (metric.subject === 'Collaboration') value = 90 - (seed % 20);
      else if (metric.subject === 'Reliability') value = 85 - (seed % 10);
      
      return { ...metric, A: value };
    });
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Workload & Task Management</h1>
          <p className="text-muted-foreground">Monitor team capacity, manage tasks, and configure automations.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setIsAutomationOpen(true)}>
            <Settings2 className="w-4 h-4 mr-2" /> Automation Settings
          </Button>
          <Button size="sm">
            <Plus className="w-4 h-4 mr-2" /> New Task
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Team Capacity */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" /> Team Capacity
            </CardTitle>
            <CardDescription>Real-time availability based on active projects.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {members.map((member) => (
                <div 
                  key={member.id} 
                  className={`space-y-2 p-2 rounded-lg transition-colors cursor-pointer ${selectedMember === member.id ? 'bg-blue-50 ring-1 ring-blue-200' : 'hover:bg-slate-50'}`}
                  onClick={() => setSelectedMember(member.id)}
                >
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 font-medium">
                      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs">
                        {member.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      {member.name}
                      <span className="text-xs text-muted-foreground font-normal">({member.role})</span>
                    </div>
                    <span className={member.capacity > 90 ? "text-red-600 font-bold" : ""}>
                      {member.capacity}% Capacity
                    </span>
                  </div>
                  <Progress value={member.capacity} className={`h-2 ${getCapacityColor(member.capacity)}`} />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Individual Performance Radar */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <BarChart4 className="w-5 h-5 text-blue-500" />
              Member DNA
            </CardTitle>
            <CardDescription>Individual performance metrics.</CardDescription>
          </CardHeader>
          <CardContent>
            {selectedMember && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold truncate">
                    {members.find(m => m.id === selectedMember)?.name}
                  </span>
                  <Badge variant="outline" className="text-[10px] h-5">Selected</Badge>
                </div>
                
                <div className="h-[220px] w-full flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={getMemberPerformanceData()}>
                      <PolarGrid stroke="#e2e8f0" />
                      <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fill: '#64748b' }} />
                      <Radar
                        name="Performance"
                        dataKey="A"
                        stroke="#3b82f6"
                        fill="#3b82f6"
                        fillOpacity={0.5}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-2">
                  <div className="p-2 rounded bg-slate-50 border text-center">
                    <p className="text-[10px] text-muted-foreground uppercase">Efficiency</p>
                    <p className="text-lg font-bold text-blue-600">
                      {Math.round(getMemberPerformanceData().find(d => d.subject === 'Productivity')?.A || 0)}%
                    </p>
                  </div>
                  <div className="p-2 rounded bg-slate-50 border text-center">
                    <p className="text-[10px] text-muted-foreground uppercase">Reliability</p>
                    <p className="text-lg font-bold text-emerald-600">
                      {Math.round(getMemberPerformanceData().find(d => d.subject === 'Reliability')?.A || 0)}%
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Task List - Moved here for better layout */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Task List</CardTitle>
            <CardDescription>Detailed breakdown of ongoing activities.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Task Title</TableHead>
                  <TableHead>Assignee</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tasks.map((task) => (
                  <TableRow key={task.id}>
                    <TableCell className="font-medium">{task.title}</TableCell>
                    <TableCell className="text-sm">{task.assignee}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={
                        task.priority === 'high' ? 'border-red-200 text-red-700 bg-red-50' :
                        task.priority === 'medium' ? 'border-orange-200 text-orange-700 bg-orange-50' :
                        'border-slate-200 text-slate-700 bg-slate-50'
                      }>
                        {task.priority.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">{task.dueDate}</TableCell>
                    <TableCell>
                      <Badge variant={task.status === 'completed' ? 'default' : 'secondary'}>
                        {task.status.replace('_', ' ').toUpperCase()}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Task Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" /> Sprint Status
            </CardTitle>
            <CardDescription>Overall performance metrics.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-between">
              <div className="text-sm font-medium text-emerald-900">Completed Tasks</div>
              <div className="text-2xl font-bold text-emerald-700">24</div>
            </div>
            <div className="p-4 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-between">
              <div className="text-sm font-medium text-blue-900">In Progress</div>
              <div className="text-2xl font-bold text-blue-700">12</div>
            </div>
            <div className="p-4 rounded-lg bg-orange-50 border border-orange-100 flex items-center justify-between">
              <div className="text-sm font-medium text-orange-900">Overdue</div>
              <div className="text-2xl font-bold text-orange-700">2</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Automation Settings Dialog */}
      <Dialog open={isAutomationOpen} onOpenChange={setIsAutomationOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>Automation & Alerts</DialogTitle>
            <DialogDescription>
              Configure how the system notifies users and syncs with external tools.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Email Overload Alerts</Label>
                <p className="text-sm text-muted-foreground italic">Notify PM when capacity exceeds threshold.</p>
              </div>
              <Switch checked={automationSettings.emailAlerts} onCheckedChange={(v) => setAutomationSettings({...automationSettings, emailAlerts: v})} />
            </div>
            
            <div className="flex items-center justify-between border-t pt-4">
              <div className="space-y-0.5">
                <Label className="text-base">Lark Task Integration</Label>
                <p className="text-sm text-muted-foreground italic">Automatically create mirroring tasks in Lark.</p>
              </div>
              <Switch checked={automationSettings.larkSync} onCheckedChange={(v) => setAutomationSettings({...automationSettings, larkSync: v})} />
            </div>

            <div className="space-y-3 border-t pt-4">
              <Label className="text-base">Capacity Threshold (%)</Label>
              <div className="flex items-center gap-4">
                <Input 
                  type="number" 
                  value={automationSettings.threshold} 
                  onChange={(e) => setAutomationSettings({...automationSettings, threshold: parseInt(e.target.value)})} 
                  className="w-24"
                />
                <Progress value={automationSettings.threshold} className="flex-1 h-2" />
              </div>
            </div>

            <div className="flex items-center justify-between border-t pt-4">
              <div className="space-y-0.5">
                <Label className="text-base">Weekly Summary Email</Label>
                <p className="text-sm text-muted-foreground italic">Send workload overview every Friday.</p>
              </div>
              <Switch checked={automationSettings.weeklyReport} onCheckedChange={(v) => setAutomationSettings({...automationSettings, weeklyReport: v})} />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleSaveAutomation}>Save Automation Profile</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
