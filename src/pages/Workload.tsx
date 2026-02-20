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
  BarChart4,
  Trash2,
  Pencil,
  Upload
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
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [logForm, setLogForm] = useState({
    memberId: "",
    date: new Date().toISOString().split('T')[0],
    hours: 8,
    activity: ""
  });
  const [memberForm, setMemberForm] = useState({
    name: "",
    role: "",
    team: "Presales",
    load: 0,
    status: "Normal"
  });
  const [automationSettings, setAutomationSettings] = useState({
    emailAlerts: true,
    weeklyReport: true,
    larkSync: true,
    threshold: 85,
    recipientEmail: "arifia.mulia@prasetia.co.id"
  });

  const loadMembers = () => {
    const team = workloadService.getMembers();
    setMembers(team);
    if (team.length > 0 && !selectedMember) {
      setSelectedMember(team[0].id);
    }
  };

  const loadLogs = () => {
    const data = workloadService.getLogs();
    setLogs(data);
  };

  const handleUploadTasks = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    toast.info("Reading and decompressing file...");
    
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const rawJson = JSON.parse(event.target?.result as string);
        if (!rawJson.gzipSnapshot) {
          throw new Error("Invalid .base file format (missing snapshot)");
        }

        // Decode Base64 to binary
        const binaryString = atob(rawJson.gzipSnapshot);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }

        // Decompress GZIP using browser API
        const stream = new Blob([bytes]).stream();
        const decompressedStream = stream.pipeThrough(new DecompressionStream('gzip'));
        const response = new Response(decompressedStream);
        const decompressedText = await response.text();
        const content = JSON.parse(decompressedText);

        // Access the schema and data
        const schema = content[0]?.schema;
        if (!schema) throw new Error("Could not find data schema in file");

        const dataBlock = schema.data;
        const fieldMap = dataBlock?.table?.fieldMap || {};
        const recordMap = dataBlock?.recordMap || {};

        const fieldIdToName = {};
        Object.entries(fieldMap).forEach(([id, f]: [string, any]) => {
          fieldIdToName[id] = f.name;
        });

        const formattedTasks = Object.entries(recordMap).map(([rid, rec]: [string, any]) => {
          const clean: any = { id: rid };
          Object.entries(rec).forEach(([fid, cell]: [string, any]) => {
            if (fid === 'id' || !cell) return;
            const fname = fieldIdToName[fid] || fid;
            const val = cell.value;
            
            let cleanVal = val;
            if (Array.isArray(val) && val.length > 0 && val[0].text) {
              cleanVal = val.map((v: any) => v.text).join("");
            } else if (val && val.users) {
              cleanVal = val.users.map((u: any) => u.name).join(", ");
            } else if (val && val.name) {
              cleanVal = val.name;
            }
            clean[fname] = cleanVal;
          });

          return {
            id: clean.id,
            title: clean['Task title'] || "Untitled Task",
            assignee: clean['Owner'] || "Unassigned",
            priority: (clean['Priority']?.toLowerCase() || 'medium') as any,
            status: clean['Completion status'] === 'Completed' ? 'completed' : 'todo',
            dueDate: clean['Due date'] || "2025-11-12",
            isLarkSynced: true
          };
        });

        setTasks(prev => [...formattedTasks.slice(0, 100), ...prev]);
        toast.success(`Successfully imported ${formattedTasks.length} tasks!`);
        setIsUploadModalOpen(false);
      } catch (err: any) {
        console.error("Upload error:", err);
        toast.error(`Error: ${err.message || "Unknown processing error"}`);
      }
    };

    reader.onerror = () => toast.error("Failed to read file");
    reader.readAsText(file);
  };

  useEffect(() => {
    loadMembers();
    loadLogs();
  }, []);

  const openAddMember = () => {
    setEditingMember(null);
    setMemberForm({
      name: "",
      role: "",
      team: "Presales",
      load: 0,
      status: "Normal"
    });
    setIsMemberModalOpen(true);
  };

  const openEditMember = (member: TeamMember) => {
    setEditingMember(member);
    setMemberForm({
      name: member.name,
      role: member.role,
      team: member.team,
      load: member.load,
      status: member.status
    });
    setIsMemberModalOpen(true);
  };

  const handleSaveMember = () => {
    if (!memberForm.name || !memberForm.role) {
      toast.error("Please fill in name and role");
      return;
    }

    if (editingMember) {
      workloadService.updateMember(editingMember.id, memberForm);
      toast.success("Member updated");
    } else {
      workloadService.createMember(memberForm);
      toast.success("Member added");
    }
    loadMembers();
    setIsMemberModalOpen(false);
  };

  const handleSaveLog = () => {
    if (!logForm.memberId || !logForm.activity) {
      toast.error("Please fill in all fields");
      return;
    }

    const member = members.find(m => m.id === logForm.memberId);
    workloadService.createLog({
      ...logForm,
      memberName: member?.name || "Unknown"
    });

    toast.success("Work log saved");
    loadLogs();
    setIsLogModalOpen(false);
    setLogForm({ ...logForm, activity: "" });
  };

  const handleDeleteMember = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this member?")) {
      workloadService.deleteMember(id);
      toast.success("Member deleted");
      loadMembers();
    }
  };

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
      if (metric.subject === 'Capacity') value = member.load || 0;
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
          <Button size="sm" variant="outline" onClick={() => {
            setLogForm(prev => ({ ...prev, memberId: selectedMember }));
            setIsLogModalOpen(true);
          }}>
            <Clock className="w-4 h-4 mr-2" /> Log Work
          </Button>
          <Button size="sm" variant="secondary" onClick={() => setIsUploadModalOpen(true)}>
            <Upload className="w-4 h-4 mr-2" /> Upload Lark Data
          </Button>
          <Button size="sm" variant="secondary" onClick={openAddMember}>
            <Plus className="w-4 h-4 mr-2" /> Add Member
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
                  className={`space-y-2 p-2 rounded-lg transition-colors cursor-pointer group ${selectedMember === member.id ? 'bg-blue-50 ring-1 ring-blue-200' : 'hover:bg-slate-50'}`}
                  onClick={() => setSelectedMember(member.id)}
                >
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 font-medium">
                      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs">
                        {member.name ? member.name.split(' ').map(n => n[0]).join('') : '?'}
                      </div>
                      {member.name}
                      <span className="text-xs text-muted-foreground font-normal">({member.role})</span>
                    </div>
                    <div className="flex gap-1">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => openEditMember(member)}
                      >
                        <Pencil className="w-3 h-3" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-600 hover:bg-red-50"
                        onClick={(e) => handleDeleteMember(member.id, e)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                    <span className={(member.load || 0) > 90 ? "text-red-600 font-bold" : ""}>
                      {member.load || 0}% Capacity
                    </span>
                  </div>
                  <Progress value={member.load || 0} className={`h-2 ${getCapacityColor(member.load || 0)}`} />
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

        {/* Recent Work Logs */}
        <Card className="md:col-span-3">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-indigo-500" /> Recent Work Logs
              </CardTitle>
              <CardDescription>Daily activity tracking for team members.</CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={loadLogs}>Refresh</Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Member</TableHead>
                  <TableHead>Hours</TableHead>
                  <TableHead>Activity Description</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground italic">
                      No activities logged yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  logs.slice(0, 5).map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="text-xs font-mono">{log.date}</TableCell>
                      <TableCell className="font-medium text-xs">{log.memberName}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="bg-indigo-50 text-indigo-700">
                          {log.hours}h
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-slate-600 italic">
                        {log.activity}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Task Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" /> Sprint Status
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

            {automationSettings.weeklyReport && (
              <div className="space-y-2 pt-2">
                <Label htmlFor="recipient-email" className="text-xs">Recipient Email</Label>
                <Input 
                  id="recipient-email" 
                  type="email" 
                  placeholder="name@prasetia.co.id"
                  value={automationSettings.recipientEmail}
                  onChange={(e) => setAutomationSettings({...automationSettings, recipientEmail: e.target.value})}
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button onClick={handleSaveAutomation}>Save Automation Profile</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add/Edit Member Dialog */}
      <Dialog open={isMemberModalOpen} onOpenChange={setIsMemberModalOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>{editingMember ? "Edit Team Member" : "Add Team Member"}</DialogTitle>
            <DialogDescription>
              {editingMember ? "Update details for this team member." : "Register a new member to the workload tracking system."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" value={memberForm.name} onChange={(e) => setMemberForm({...memberForm, name: e.target.value})} placeholder="e.g. John Doe" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Role / Position</Label>
              <Input id="role" value={memberForm.role} onChange={(e) => setMemberForm({...memberForm, role: e.target.value})} placeholder="e.g. Senior Developer" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="team">Team</Label>
                <Select value={memberForm.team} onValueChange={(v) => setMemberForm({...memberForm, team: v})}>
                  <SelectTrigger id="team">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Presales">Presales</SelectItem>
                    <SelectItem value="AfterSales">AfterSales</SelectItem>
                    <SelectItem value="Delivery">Delivery</SelectItem>
                    <SelectItem value="IT">IT</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={memberForm.status} onValueChange={(v) => setMemberForm({...memberForm, status: v})}>
                  <SelectTrigger id="status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Normal">Normal</SelectItem>
                    <SelectItem value="Warning">Warning</SelectItem>
                    <SelectItem value="Critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="load">Capacity Load (%)</Label>
              <div className="flex items-center gap-4">
                <Input 
                  id="load"
                  type="number" 
                  value={memberForm.load} 
                  onChange={(e) => setMemberForm({...memberForm, load: parseInt(e.target.value) || 0})} 
                  className="w-24"
                />
                <Progress value={memberForm.load} className="flex-1 h-2" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsMemberModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveMember}>{editingMember ? "Update Member" : "Add Member"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Upload Data Dialog */}
      <Dialog open={isUploadModalOpen} onOpenChange={setIsUploadModalOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Upload Task List Data</DialogTitle>
            <DialogDescription>
              Upload your .base or Excel file to synchronize task lists for all team members.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-10 hover:bg-slate-50 transition-colors cursor-pointer relative">
            <Upload className="w-10 h-10 text-muted-foreground mb-4" />
            <p className="text-sm font-medium text-center">Click or drag file to upload</p>
            <p className="text-xs text-muted-foreground mt-1">Supports .base, .xlsx, .json</p>
            <input 
              type="file" 
              className="absolute inset-0 opacity-0 cursor-pointer" 
              onChange={handleUploadTasks}
              accept=".base,.json,.xlsx"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsUploadModalOpen(false)}>Cancel</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Log Work Dialog */}
      <Dialog open={isLogModalOpen} onOpenChange={setIsLogModalOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>Log Daily Activity</DialogTitle>
            <DialogDescription>
              Record your hours and tasks performed for the day.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="log-member">Team Member</Label>
              <Select value={logForm.memberId} onValueChange={(v) => setLogForm({...logForm, memberId: v})}>
                <SelectTrigger id="log-member">
                  <SelectValue placeholder="Select member" />
                </SelectTrigger>
                <SelectContent>
                  {members.map(m => (
                    <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="log-date">Date</Label>
                <Input id="log-date" type="date" value={logForm.date} onChange={(e) => setLogForm({...logForm, date: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="log-hours">Hours Spent</Label>
                <Input id="log-hours" type="number" step="0.5" value={logForm.hours} onChange={(e) => setLogForm({...logForm, hours: parseFloat(e.target.value) || 0})} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="log-activity">Activity Description</Label>
              <textarea 
                id="log-activity"
                className="flex min-h-[100px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="What did you work on today?"
                value={logForm.activity}
                onChange={(e) => setLogForm({...logForm, activity: e.target.value})}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsLogModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveLog} className="bg-indigo-600 hover:bg-indigo-700">Save Log</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
