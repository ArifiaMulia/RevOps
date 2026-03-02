// @ts-nocheck
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { 
  Plus, 
  TrendingUp, 
  Users, 
  Target, 
  FileText, 
  Download, 
  ArrowRight,
  Calculator,
  Briefcase,
  Activity,
  PieChart
} from "lucide-react";
import { useLocation } from "wouter";
import { useState, useEffect } from "react";
import { clientService } from "@/lib/client-service";
import { workloadService } from "@/lib/workload-service";
import { estimationService } from "@/lib/estimation-service";
import { downloadService } from "@/lib/download-service";
import { activityLogService } from "@/lib/activity-log-service";
import { toast } from "sonner";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend
} from 'recharts';

const CHART_DATA = [
  { month: 'Sep', revenue: 450, deals: 12, performance: 85 },
  { month: 'Oct', revenue: 520, deals: 15, performance: 88 },
  { month: 'Nov', revenue: 480, deals: 10, performance: 82 },
  { month: 'Dec', revenue: 610, deals: 18, performance: 92 },
  { month: 'Jan', revenue: 590, deals: 16, performance: 90 },
  { month: 'Feb', revenue: 720, deals: 22, performance: 95 },
];

export default function Home() {
  const [, setLocation] = useLocation();
  const [stats, setStats] = useState({
    clients: 0,
    team: 0,
    revenue: "Rp 0",
    winRate: "0%"
  });

  // Dynamic Chart State
  const [activeData, setActiveData] = useState(CHART_DATA);

  // New Proposal State
  const [newProposal, setNewProposal] = useState({
    title: "",
    client: "",
    value: ""
  });
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    const clients = clientService.getAll();
    const members = workloadService.getMembers();
    const ests = estimationService.getAll();
    
    const totalRev = (ests || []).reduce((acc, curr) => acc + (curr.cost || 0), 0);
    
    setStats({
      clients: clients.length,
      team: members.length,
      revenue: `Rp ${totalRev.toLocaleString('id-ID')}`,
      winRate: "68%" // Mock static for now
    });

    // Simulate real-time update every 10 seconds
    const interval = setInterval(() => {
      setActiveData(prev => prev.map(d => ({
        ...d,
        performance: Math.min(100, d.performance + (Math.random() * 4 - 2))
      })));
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const handleCreateProposal = () => {
    if (!newProposal.title || !newProposal.client) {
      toast.error("Please fill title and client");
      return;
    }
    
    activityLogService.log("create", "estimation", "new", `Created new proposal: ${newProposal.title} for ${newProposal.client}`);
    toast.success(`Proposal "${newProposal.title}" created and saved.`);
    setIsDialogOpen(false);
    setNewProposal({ title: "", client: "", value: "" });
  };

  const handleGenerateReport = () => {
    const reportContent = `
SUMMARY STATISTICS:
- Total Clients: ${stats.clients}
- Active Team Members: ${stats.team}
- Pipeline Revenue: ${stats.revenue}
- Average Win Rate: ${stats.winRate}

Generated for: Prasetia Dwidharma Group
    `;
    downloadService.downloadMockPDF("Executive RevOps Summary", reportContent, "RevOps_Executive_Report");
    toast.success("Executive report generated and downloading...");
  };

  return (
    <div className="space-y-8 pb-8">
      {/* Hero Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">RevOps Dashboard</h1>
          <p className="text-muted-foreground text-lg">Manage revenue operations, clients, and project workload in one place.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={handleGenerateReport}>
            <Download className="w-4 h-4 mr-2" /> Report
          </Button>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" /> New Proposal
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Create New Proposal</DialogTitle>
                <DialogDescription>
                  Draft a new proposal for a client. You can edit the details later in Tools.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="title" className="text-right">Title</Label>
                  <Input 
                    id="title" 
                    value={newProposal.title}
                    onChange={(e) => setNewProposal({...newProposal, title: e.target.value})}
                    placeholder="Project Name" 
                    className="col-span-3" 
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="client" className="text-right">Client</Label>
                  <Input 
                    id="client" 
                    value={newProposal.client}
                    onChange={(e) => setNewProposal({...newProposal, client: e.target.value})}
                    placeholder="Company Name" 
                    className="col-span-3" 
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="value" className="text-right">Value (Rp)</Label>
                  <Input 
                    id="value" 
                    type="number"
                    value={newProposal.value}
                    onChange={(e) => setNewProposal({...newProposal, value: e.target.value})}
                    placeholder="Estimated Value" 
                    className="col-span-3" 
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" onClick={handleCreateProposal}>Save Proposal</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Pipeline Revenue</CardTitle>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.revenue}</div>
            <p className="text-xs text-muted-foreground">+12.5% from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Active Clients</CardTitle>
            <Users className="w-4 h-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.clients}</div>
            <p className="text-xs text-muted-foreground">3 new acquired this week</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Win Rate</CardTitle>
            <Target className="w-4 h-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.winRate}</div>
            <p className="text-xs text-muted-foreground">Target: 75% (+7%)</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Team Load</CardTitle>
            <Briefcase className="w-4 h-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.team} Active</div>
            <p className="text-xs text-muted-foreground">Avg Capacity: 82%</p>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Section */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-emerald-500" />
              Real-time Team Performance
            </CardTitle>
            <CardDescription>Visualizing revenue trends and team efficiency across quarters.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={activeData}>
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="month" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fontSize: 12, fill: '#888'}} 
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fontSize: 12, fill: '#888'}}
                    tickFormatter={(value) => `Rp${value}M`}
                  />
                  <Tooltip 
                    contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#10b981" 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#colorRev)" 
                  />
                  <Area 
                    type="monotone" 
                    dataKey="performance" 
                    stroke="#3b82f6" 
                    strokeWidth={2}
                    fill="transparent"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center justify-center gap-6 mt-4">
              <div className="flex items-center gap-2 text-sm">
                <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                <span>Revenue (Millions)</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                <span>Team Efficiency (%)</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quarterly Deals</CardTitle>
            <CardDescription>Closed projects count.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={activeData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="month" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fontSize: 12, fill: '#888'}} 
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fontSize: 12, fill: '#888'}}
                  />
                  <Tooltip />
                  <Bar dataKey="deals" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Access */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-blue-500" onClick={() => setLocation("/client-360")}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-500" />
              Client 360
            </CardTitle>
            <CardDescription>Manage client relationship and performance.</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-end">
            <ArrowRight className="w-4 h-4 text-muted-foreground" />
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-emerald-500" onClick={() => setLocation("/tools")}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="w-5 h-5 text-emerald-500" />
              Revenue Tools
            </CardTitle>
            <CardDescription>Calculators and estimation builders.</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-end">
            <ArrowRight className="w-4 h-4 text-muted-foreground" />
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-purple-500" onClick={() => setLocation("/product-master")}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-purple-500" />
              Product Master
            </CardTitle>
            <CardDescription>Manage price lists and margins.</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-end">
            <ArrowRight className="w-4 h-4 text-muted-foreground" />
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-amber-500" onClick={() => setLocation("/customer-info")}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="w-5 h-5 text-amber-500" />
              Customer Info
            </CardTitle>
            <CardDescription>Product Lark dashboard & adoption trends.</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-end">
            <ArrowRight className="w-4 h-4 text-muted-foreground" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
