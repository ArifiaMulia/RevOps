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
  Upload,
  Search,
  MoreVertical,
  ChevronDown,
  ChevronRight,
  Layers
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
import { cn } from "@/lib/utils";
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
  const [isTaskDetailOpen, setIsTaskDetailOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [taskSearchTerm, setTaskSearchTerm] = useState("");
  const [taskGroupBy, setTaskGroupBy] = useState<'assignee' | 'creator' | 'dueDate'>('assignee');
  const [expandedOwners, setExpandedOwners] = useState<Record<string, boolean>>({});
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

  const loadTasks = () => {
    const savedTasks = workloadService.getTasks();
    if (savedTasks.length > 0) {
      setTasks(savedTasks);
    }
  };

  const handleUploadTasks = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    toast.info("Reading and decompressing file...");
    
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        let rawJson;
        try {
           rawJson = JSON.parse(text);
        } catch (e) {
           throw new Error("File is not a valid JSON. Please check if it's a real .base file.");
        }

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

        // Access the schema and data - adjust based on actual .base structure observed
        const schema = content[0]?.schema || content?.schema;
        const dataBlock = schema?.data;
        
        if (!dataBlock) {
           throw new Error("Structure mismatch: data block not found in decompressed content.");
        }

        const fieldMap = dataBlock?.table?.fieldMap || {};
        const recordMap = dataBlock?.recordMap || {};

        if (Object.keys(recordMap).length === 0) {
           throw new Error("No tasks found in the file.");
        }

        const fieldIdToName = {};
        Object.entries(fieldMap).forEach(([id, f]: [string, any]) => {
          fieldIdToName[id] = f.name;
        });

        const formattedTasks = Object.entries(recordMap).map(([rid, rec]: [string, any]) => {
          const clean: any = { id: rid, raw: rec };
          Object.entries(rec).forEach(([fid, cell]: [string, any]) => {
            if (fid === 'id' || !cell) return;
            const fname = fieldIdToName[fid] || fid;
            const val = cell.value;
            
            let cleanVal = val;
            if (Array.isArray(val) && val.length > 0 && val[0].text) {
              cleanVal = val.map((v: any) => v.text).join("");
            } else if (val && val.users) {
              cleanVal = val.users.map((u: any) => u.name).join(", ");
              clean[fname + "_avatars"] = val.users.map((u: any) => u.avatarUrl);
            } else if (val && val.name) {
              cleanVal = val.name;
            }
            clean[fname] = cleanVal;
          });

          return {
            id: clean.id,
            title: clean['Task title'] || "Untitled Task",
            assignee: clean['Owner'] || "Unassigned",
            assignee_avatars: clean['Owner_avatars'] || [],
            priority: (clean['Priority'] || 'medium').toLowerCase() as any,
            status: clean['Completion status'] === 'Completed' ? 'completed' : 'todo',
            dueDate: clean['Due date'] || clean['Deadline'] || clean['Created on'] || "2026-02-20",
            description: clean['Task list'] || clean['Description'] || "",
            milestone: clean['Milestone'] || clean['Phase'] || "",
            creator: clean['Created by'] || clean['Creator'] || clean['Created By'] || "Admin",
            isLarkSynced: true,
            fullData: clean
          };
        });

        const allTasks = [...formattedTasks, ...tasks];
        setTasks(allTasks);
        workloadService.saveTasks(allTasks);
        toast.success(`Successfully imported ${formattedTasks.length} tasks!`);
        setIsUploadModalOpen(false);
        // Clear input value so same file can be uploaded again
        e.target.value = "";
      } catch (err: any) {
        console.error("Upload error details:", err);
        toast.error(`Error: ${err.message || "Failed to process .base file"}`);
      }
    };

    reader.onerror = () => toast.error("Failed to read file from disk.");
    reader.readAsText(file);
  };

  useEffect(() => {
    loadMembers();
    loadLogs();
    loadTasks();
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

  const toggleOwner = (owner: string) => {
    setExpandedOwners(prev => ({
      ...prev,
      [owner]: !prev[owner]
    }));
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
        {/* Task List - Expanded with search and clickable rows */}
        <Card className="md:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Task List</CardTitle>
              <CardDescription>Detailed breakdown of ongoing activities.</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Select value={taskGroupBy} onValueChange={(v: any) => setTaskGroupBy(v)}>
                <SelectTrigger className="w-[140px] h-8 text-xs">
                  <span className="text-muted-foreground mr-1">Group:</span>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="assignee">Owner</SelectItem>
                  <SelectItem value="creator">Created By</SelectItem>
                  <SelectItem value="dueDate">Due Date</SelectItem>
                </SelectContent>
              </Select>
              <div className="relative w-48">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <Input 
                  placeholder="Search tasks..." 
                  className="pl-8 h-8 text-xs" 
                  value={taskSearchTerm}
                  onChange={(e) => setTaskSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="max-h-[600px] overflow-auto border rounded-lg">
              {tasks.length === 0 ? (
                <div className="text-center py-20 text-muted-foreground italic">
                  No tasks found. Please upload a .base file.
                </div>
              ) : (
                <div className="divide-y">
                  {Object.entries(
                    tasks
                      .filter(t => 
                        t.title.toLowerCase().includes(taskSearchTerm.toLowerCase()) || 
                        t.assignee.toLowerCase().includes(taskSearchTerm.toLowerCase()) ||
                        (t.creator && t.creator.toLowerCase().includes(taskSearchTerm.toLowerCase()))
                      )
                      .reduce((acc, task) => {
                        let groupKey = "Unassigned";
                        if (taskGroupBy === 'assignee') groupKey = task.assignee || "Unassigned";
                        else if (taskGroupBy === 'creator') groupKey = task.creator || "Anonymous";
                        else if (taskGroupBy === 'dueDate') {
                          groupKey = task.dueDate || "No Date";
                          if (typeof groupKey === 'number') groupKey = new Date(groupKey).toLocaleDateString();
                        }
                        
                        if (!acc[groupKey]) acc[groupKey] = [];
                        acc[groupKey].push(task);
                        return acc;
                      }, {} as Record<string, Task[]>)
                  ).map(([groupKey, groupTasks]) => {
                    const isExpanded = expandedOwners[groupKey] !== false; // Default expanded
                    const completedCount = groupTasks.filter(t => t.status === 'completed').length;
                    
                    return (
                      <div key={groupKey} className="bg-white">
                        <div 
                          className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-slate-50 bg-slate-50/30 transition-colors border-b"
                          onClick={() => toggleOwner(groupKey)}
                        >
                          <div className="flex items-center gap-3">
                            {isExpanded ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
                            <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-[10px] font-bold text-blue-700">
                              {groupKey.substring(0, 1)}
                            </div>
                            <span className="font-semibold text-sm text-slate-700">{groupKey}</span>
                            <Badge variant="secondary" className="text-[10px] h-5 bg-slate-100">
                              {groupTasks.length} Tasks
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span className="hidden sm:inline">Progress: {completedCount}/{groupTasks.length}</span>
                            <Progress value={(completedCount / groupTasks.length) * 100} className="w-20 h-1.5" />
                          </div>
                        </div>
                        
                        {isExpanded && (
                          <div className="animate-in fade-in slide-in-from-top-1 duration-200">
                            <Table>
                              <TableBody>
                                {groupTasks.map((task) => (
                                  <TableRow 
                                    key={task.id} 
                                    className="cursor-pointer hover:bg-slate-50/80 transition-colors border-l-4 border-l-transparent hover:border-l-blue-400"
                                    onClick={() => {
                                      setSelectedTask(task);
                                      setIsTaskDetailOpen(true);
                                    }}
                                  >
                                    <TableCell className="font-medium text-[11px] py-2.5 pl-10 w-[40%]">
                                      {task.title}
                                    </TableCell>
                                    <TableCell>
                                      <Badge variant="outline" className={cn(
                                        "text-[9px] px-1.5 h-4.5 font-bold",
                                        task.priority === 'high' ? 'border-red-200 text-red-700 bg-red-50' :
                                        task.priority === 'medium' ? 'border-orange-200 text-orange-700 bg-orange-50' :
                                        'border-slate-200 text-slate-700 bg-slate-50'
                                      )}>
                                        {task.priority.toUpperCase()}
                                      </Badge>
                                    </TableCell>
                                    <TableCell className="text-[10px] text-muted-foreground">
                                      {typeof task.dueDate === 'number' ? new Date(task.dueDate).toLocaleDateString() : task.dueDate}
                                    </TableCell>
                                    <TableCell className="text-right pr-6">
                                      <Badge variant={task.status === 'completed' ? 'default' : 'secondary'} className="text-[9px] px-1.5 h-4.5 bg-opacity-80">
                                        {task.status.replace('_', ' ').toUpperCase()}
                                      </Badge>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
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

      {/* Lark Style Task Detail Modal */}
      <Dialog open={isTaskDetailOpen} onOpenChange={setIsTaskDetailOpen}>
        <DialogContent className="sm:max-w-[700px] p-0 overflow-hidden border-none shadow-2xl rounded-xl">
          <div className="flex flex-col h-[85vh] bg-white">
            {/* Modal Header Actions */}
            <div className="flex items-center justify-between px-6 py-3 border-b bg-slate-50/50">
              <Button 
                variant="outline" 
                size="sm" 
                className={cn(
                  "rounded-full gap-2 text-xs font-bold",
                  selectedTask?.status === 'completed' ? "bg-emerald-50 text-emerald-700 border-emerald-200" : ""
                )}
                onClick={() => {
                  const newStatus = selectedTask?.status === 'completed' ? 'todo' : 'completed';
                  setTasks(tasks.map(t => t.id === selectedTask.id ? { ...t, status: newStatus } : t));
                  setSelectedTask({ ...selectedTask, status: newStatus });
                  toast.success(`Task marked as ${newStatus}`);
                }}
              >
                <CheckCircle2 className={cn("w-4 h-4", selectedTask?.status === 'completed' ? "fill-emerald-500 text-white" : "")} />
                {selectedTask?.status === 'completed' ? "Completed" : "Mark Complete"}
              </Button>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" className="h-8 w-8"><ExternalLink className="w-4 h-4 text-slate-400" /></Button>
                <Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="w-4 h-4 text-slate-400" /></Button>
              </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto px-10 py-8 space-y-8">
              {/* Title Section */}
              <div className="space-y-4">
                <h2 className="text-2xl font-bold leading-tight text-slate-900">
                  {selectedTask?.title}
                </h2>
                {selectedTask?.milestone && (
                  <Badge className="bg-blue-50 text-blue-600 border-blue-100 hover:bg-blue-100 font-medium">
                    Created in: {selectedTask.milestone}
                  </Badge>
                )}
              </div>

              {/* Attributes Grid */}
              <div className="space-y-6">
                <div className="flex items-start gap-12">
                  <div className="flex items-center gap-4 w-32 shrink-0">
                    <Users className="w-4 h-4 text-slate-400" />
                    <span className="text-sm text-slate-500">Owners</span>
                  </div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="flex -space-x-2">
                       {selectedTask?.assignee_avatars?.length > 0 ? (
                         selectedTask.assignee_avatars.map((url, i) => (
                           <div key={i} className="w-7 h-7 rounded-full border-2 border-white overflow-hidden bg-slate-100">
                             <img src={url} alt="avatar" className="w-full h-full object-cover" />
                           </div>
                         ))
                       ) : (
                        <div className="w-7 h-7 rounded-full border-2 border-white bg-blue-500 flex items-center justify-center text-[10px] text-white font-bold">
                          {selectedTask?.assignee?.substring(0,1)}
                        </div>
                       )}
                    </div>
                    <span className="text-sm font-medium text-slate-700">{selectedTask?.assignee}</span>
                    <Badge variant="outline" className="text-[10px] font-bold text-slate-400">{selectedTask?.assignee_avatars?.length || 1} owners</Badge>
                    <div className="h-4 w-[1px] bg-slate-200 mx-1" />
                    <Button variant="ghost" size="sm" className="h-7 text-xs font-medium text-slate-600 gap-1 px-2">
                      Default Group <ChevronDown className="w-3 h-3" />
                    </Button>
                  </div>
                </div>

                <div className="flex items-start gap-12">
                  <div className="flex items-center gap-4 w-32 shrink-0">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <span className="text-sm text-slate-500">Due Date</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="secondary" size="sm" className="h-8 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-bold gap-2">
                       <Calendar className="w-3.5 h-3.5" /> Today
                    </Button>
                    <Button variant="outline" size="sm" className="h-8 rounded-lg text-xs font-medium gap-2">
                       Tomorrow
                    </Button>
                    <Button variant="outline" size="sm" className="h-8 rounded-lg text-xs font-medium gap-2">
                       Other
                    </Button>
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t">
                  <button className="flex items-center gap-3 w-full text-slate-400 hover:text-slate-600 transition-colors py-1 group">
                    <Plus className="w-4 h-4 group-hover:scale-110 transition-transform" />
                    <span className="text-sm">Add to Task List</span>
                  </button>
                  <button className="flex items-center gap-3 w-full text-slate-400 hover:text-slate-600 transition-colors py-1 group">
                    <Settings2 className="w-4 h-4 group-hover:scale-110 transition-transform" />
                    <span className="text-sm">Add Description</span>
                  </button>
                  <div className="pl-7 text-sm text-slate-600 leading-relaxed">
                    {selectedTask?.description}
                  </div>
                  <button className="flex items-center gap-3 w-full text-slate-400 hover:text-slate-600 transition-colors py-1 group">
                    <Layers className="w-4 h-4 group-hover:scale-110 transition-transform" />
                    <span className="text-sm">Add Sub-task</span>
                  </button>
                  <button className="flex items-center gap-3 w-full text-slate-400 hover:text-slate-600 transition-colors py-1 group">
                    <ExternalLink className="w-4 h-4 group-hover:scale-110 transition-transform" />
                    <span className="text-sm">Add Attachment</span>
                  </button>
                </div>
              </div>

              {/* Comment Section Mockup */}
              <div className="pt-10 space-y-4">
                 <h3 className="text-sm font-bold text-slate-900">Comment</h3>
                 <div className="relative border rounded-xl p-3 focus-within:ring-2 ring-blue-100 bg-slate-50/30">
                    <textarea 
                      placeholder="Add a comment"
                      className="w-full bg-transparent border-none outline-none text-sm resize-none min-h-[60px]"
                    />
                    <div className="flex items-center justify-between mt-2 pt-2 border-t">
                       <div className="flex items-center gap-3">
                          <Button variant="ghost" size="icon" className="h-7 w-7"><Mail className="w-4 h-4 text-slate-400" /></Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-xs font-bold text-slate-400 underline">Aa</Button>
                       </div>
                       <Button size="sm" className="h-8 rounded-full px-5 bg-blue-600 hover:bg-blue-700">Send</Button>
                    </div>
                 </div>
              </div>
            </div>
            
            {/* Modal Footer / Subscribers */}
            <div className="px-10 py-4 border-t flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex -space-x-1.5">
                  <div className="w-6 h-6 rounded-full bg-slate-200 border border-white" />
                  <div className="w-6 h-6 rounded-full bg-slate-300 border border-white" />
                </div>
                <span className="text-xs text-slate-500 font-medium">3 subscribers</span>
                <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full border"><Plus className="w-3 h-3 text-slate-400" /></Button>
              </div>
              <Button variant="ghost" className="text-xs text-slate-400 font-medium" onClick={() => setIsTaskDetailOpen(false)}>Close</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
