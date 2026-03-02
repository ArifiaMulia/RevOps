// @ts-nocheck
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Legend,
  LineChart,
  Line,
  AreaChart,
  Area
} from 'recharts';
import { 
  Download, 
  PieChart as PieIcon, 
  LayoutGrid, 
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  ExternalLink,
  Table as TableIcon,
  MoreVertical,
  Settings2,
  Filter,
  Search,
  Users,
  Plus
} from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { cn } from "@/lib/utils";
import { larkService } from "@/lib/lark-service";
import { toast } from "sonner";

export default function CustomerInfo() {
  const [rawData, setRawData] = useState({ 
    summary: { total_arr: 0, total_accounts: 0, kpis: {} }, 
    top_accounts: [], 
    q4_top: [],
    risk_history: [], 
    trends: [], 
    details: [], 
    target_accounts: [] 
  });
  
  const [selectedCustomer, setSelectedCustomer] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [displayLimit, setDisplayLimit] = useState(50);
  const [sortConfig, setSortConfig] = useState({ key: 'ARR (USD)', direction: 'desc' });
  
  // States for Modal and Configuration
  const [selectedSegment, setSelectedSegment] = useState(null);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [activeConfigTab, setActiveConfigTab] = useState("general");
  
  const [chartConfig, setChartConfig] = useState({
    title: "%ARR By Churn Risk",
    type: "100% stacked column chart",
    gradientFill: false
  });
  const [hiddenBars, setHiddenBars] = useState(["N/A"]);
  const [modalSearchTerm, setModalSearchTerm] = useState("");

  useEffect(() => {
    const fetchLarkData = () => {
      const currentData = larkService.getData();
      setRawData(currentData);
    };

    fetchLarkData();
    window.addEventListener('storage', fetchLarkData);
    return () => window.removeEventListener('storage', fetchLarkData);
  }, []);

  // Filter Logic based on Selected Customer
  const data = useMemo(() => {
    if (selectedCustomer === "all") return rawData;
    
    // 1. Details (latest snapshot)
    const filteredDetails = rawData.details.filter(d => d.account_name === selectedCustomer);
    
    // 2. All records for this customer (history)
    const filteredAllRecords = (rawData.all_records || []).filter(r => r.account_name === selectedCustomer);
    
    // 3. Risk History (Grouped by date for THIS customer)
    const historyMap = {};
    filteredAllRecords.forEach(r => {
       if (!historyMap[r.date_str]) {
          historyMap[r.date_str] = {
             date_str: r.date_str,
             "High Churn Risk": 0, "Mid Churn Risk": 0, "Low Churn Risk": 0, "N/A": 0, total_arr: 0
          };
       }
       const riskKey = r["Churn Risk"] || "N/A";
       historyMap[r.date_str][riskKey] = (historyMap[r.date_str][riskKey] || 0) + r["ARR (USD)"];
       historyMap[r.date_str].total_arr += r["ARR (USD)"];
    });
    const risk_history = Object.values(historyMap).sort((a, b) => a.date_str.localeCompare(b.date_str));
    
    // 4. Trends (Personalized Adoption/Duration)
    const trends = risk_history.map(h => {
       const dayRecord = filteredAllRecords.find(r => r.date_str === h.date_str);
       return {
          date: h.date_str,
          [`${selectedCustomer}_adoption`]: dayRecord?.["% Adoption"] || 0,
          [`${selectedCustomer}_duration`]: dayRecord?.["Duration"] || 0,
       };
    });

    // 5. KPIs (Local calculation)
    const sortedDaily = [...risk_history].reverse();
    const l7d = sortedDaily.slice(0, 7);
    const prevL7d = sortedDaily.slice(7, 14);
    
    const l7dArr = l7d.reduce((sum, d) => sum + d.total_arr, 0) / (l7d.length || 1);
    const prevL7dArr = prevL7d.reduce((sum, d) => sum + d.total_arr, 0) / (prevL7d.length || 1);
    const arrWow = prevL7dArr > 0 ? ((l7dArr - prevL7dArr) / prevL7dArr) * 100 : 0;

    return {
      ...rawData,
      details: filteredDetails || [],
      risk_history: risk_history || [],
      trends: trends || [],
      target_accounts: [selectedCustomer],
      summary: {
        ...(rawData.summary || {}),
        total_arr: filteredDetails[0]?.["ARR (USD)"] || 0,
        total_accounts: filteredDetails.length,
        total_users: filteredDetails.reduce((sum, d) => sum + (d.total_users || 0), 0) || 6373,
        kpis: {
           ...(rawData.summary?.kpis || {}),
           l7d_arr_avg: l7dArr || 0,
           arr_wow: arrWow || 0,
           l7d_acc_avg: filteredDetails.length,
           acc_wow: 0
        }
      }
    };
  }, [rawData, selectedCustomer]);

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'USD', 
      maximumFractionDigits: 0 
    }).format(val || 0);
  };

  const getPercentData = () => {
    return (data.risk_history || []).map(entry => {
      const activeKeys = ["High Churn Risk", "Mid Churn Risk", "Low Churn Risk", "N/A"]
        .filter(key => !hiddenBars.includes(key));
      
      const total = activeKeys.reduce((sum, key) => sum + (entry[key] || 0), 0);
      
      return {
        ...entry,
        "High Churn Risk %": total > 0 ? (entry["High Churn Risk"] / total) * 100 : 0,
        "Mid Churn Risk %": total > 0 ? (entry["Mid Churn Risk"] / total) * 100 : 0,
        "Low Churn Risk %": total > 0 ? (entry["Low Churn Risk"] / total) * 100 : 0,
        "N/A %": total > 0 ? (entry["N/A"] / total) * 100 : 0,
      };
    });
  };

  const handleBarClick = (clickData) => {
     if (!clickData || !clickData.activePayload || clickData.activePayload.length === 0) return;
     
     const payload = clickData.activePayload[0].payload;
     const date = payload.date_str;
     const barDataKey = clickData.activePayload[0].dataKey || "";
     const cleanRiskKey = barDataKey.replace(' %', '');

     const filtered = data.details?.filter(d => d["Churn Risk"] === cleanRiskKey).slice(0, 20);
     
     setSelectedSegment({
        date,
        risk: cleanRiskKey,
        accounts: filtered || []
     });
  };

  const handleSort = (key) => {
    let direction = 'desc';
    if (sortConfig.key === key && sortConfig.direction === 'desc') {
      direction = 'asc';
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return <ChevronsUpDown className="w-3 h-3 ml-1 opacity-30" />;
    return sortConfig.direction === 'asc' 
      ? <ChevronUp className="w-3 h-3 ml-1 text-primary" /> 
      : <ChevronDown className="w-3 h-3 ml-1 text-primary" />;
  };

  const KPICard = ({ title, value, growth, type = "wow" }) => (
    <Card className="shadow-sm border-none bg-slate-50/50">
       <CardContent className="p-5">
          <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">{title}</p>
          <div className="flex items-end justify-between">
             <h2 className="text-2xl font-bold tracking-tight">
                {typeof value === 'number' && title?.includes('ARR') ? formatCurrency(value) : (value || 0)}
             </h2>
             <div className="flex flex-col items-end">
                <div className={cn(
                   "flex items-center text-[10px] font-bold",
                   (growth || 0) >= 0 ? "text-emerald-600" : "text-rose-600"
                )}>
                   {(growth || 0) >= 0 ? <ArrowUpRight className="w-3 h-3 mr-0.5" /> : <ArrowDownRight className="w-3 h-3 mr-0.5" />}
                   {Math.abs(growth || 0).toFixed(2)}%
                </div>
                <span className="text-[9px] text-muted-foreground uppercase">{type}</span>
             </div>
          </div>
          <div className="h-10 w-full mt-2 opacity-30">
             <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={(data?.risk_history || []).slice(-10)}>
                   <Area type="monotone" dataKey="total_arr" stroke={(growth || 0) >= 0 ? "#10b981" : "#ef4444"} fill={(growth || 0) >= 0 ? "#10b981" : "#ef4444"} fillOpacity={0.1} />
                </AreaChart>
             </ResponsiveContainer>
          </div>
       </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-500 flex relative min-h-screen bg-slate-50/20 px-8 pt-8">
      <div className="flex-1 space-y-8 overflow-hidden">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tighter">Customer Info</h1>
        </div>
        <Button 
           variant="outline" 
           size="sm" 
           className="text-xs"
           onClick={() => {
              larkService.resetData();
              window.location.reload();
           }}
        >
           Clear Cache
        </Button>
      </div>

      {/* Top Filter & Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
         <Card className="bg-white shadow-sm border">
            <CardContent className="p-6">
               <p className="text-[10px] font-bold text-muted-foreground uppercase mb-2">Customer</p>
               <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
                  <SelectTrigger className="w-full h-10">
                     <SelectValue placeholder="Select Customer" />
                  </SelectTrigger>
                  <SelectContent>
                     <SelectItem value="all">All Customers</SelectItem>
                     {rawData.details.slice(0, 20).map(d => (
                        <SelectItem key={d.account_name} value={d.account_name}>{d.account_name}</SelectItem>
                     ))}
                  </SelectContent>
               </Select>
            </CardContent>
         </Card>
         <Card className="bg-white shadow-sm border">
            <CardContent className="p-6">
               <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">Total ARR</p>
               <h2 className="text-3xl font-bold tracking-tight">{formatCurrency(data.summary?.total_arr)}</h2>
            </CardContent>
         </Card>
         <Card className="bg-white shadow-sm border">
            <CardContent className="p-6">
               <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">Total Account</p>
               <h2 className="text-3xl font-bold tracking-tight">{data.summary?.total_accounts}</h2>
            </CardContent>
         </Card>
         <Card className="bg-white shadow-sm border">
            <CardContent className="p-6">
               <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">Total Users</p>
               <h2 className="text-3xl font-bold tracking-tight">{data.summary?.total_users?.toLocaleString()}</h2>
            </CardContent>
         </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Sidebar Lists */}
        <div className="lg:col-span-3 space-y-6">
           <Card className="shadow-sm border-none bg-transparent shadow-none">
              <CardHeader className="px-0 py-2">
                 <CardTitle className="text-sm font-bold">Top Accounts by ARR</CardTitle>
              </CardHeader>
              <CardContent className="px-0 space-y-3">
                 {rawData.top_accounts.slice(0, 6).map((acc, i) => (
                    <div key={i} className="flex items-center justify-between text-xs bg-white p-2 rounded-lg border shadow-sm">
                       <div className="flex items-center gap-2 overflow-hidden">
                          <span className={cn(
                             "w-5 h-5 flex items-center justify-center rounded-full text-[10px] font-bold shrink-0",
                             i === 0 ? "bg-amber-100 text-amber-600" : "bg-slate-100 text-slate-500"
                          )}>{i + 1}</span>
                          <span className="truncate font-medium">{acc.account_name.split(' (')[0]}</span>
                       </div>
                       <span className="font-mono font-bold text-slate-500">{formatCurrency(acc['ARR (USD)'])}</span>
                    </div>
                 ))}
              </CardContent>
           </Card>

           <Card className="shadow-sm border-none bg-transparent shadow-none">
              <CardHeader className="px-0 py-2">
                 <CardTitle className="text-sm font-bold">Q4 Top Accounts</CardTitle>
              </CardHeader>
              <CardContent className="px-0 space-y-3">
                 {rawData.q4_top.map((acc, i) => (
                    <div key={i} className="flex items-center justify-between text-xs bg-white p-2 rounded-lg border shadow-sm">
                       <div className="flex items-center gap-2 overflow-hidden">
                          <span className="w-5 h-5 flex items-center justify-center rounded-full text-[10px] font-bold shrink-0 bg-amber-50 text-amber-600">{i + 1}</span>
                          <span className="truncate font-medium">{acc.account_name.split(' (')[0]}</span>
                       </div>
                       <span className="font-mono font-bold text-slate-500">{formatCurrency(acc['ARR (USD)'])}</span>
                    </div>
                 ))}
              </CardContent>
           </Card>
        </div>

        {/* Center Column: Main Charts */}
        <div className="lg:col-span-6 space-y-6">
          <Card className="shadow-md border-none group relative overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between pb-2 bg-slate-50/30">
              <CardTitle className="text-lg text-rose-800/70">{chartConfig.title}</CardTitle>
              <Button 
                variant="ghost" 
                size="icon" 
                className="opacity-0 group-hover:opacity-100 transition-opacity bg-white border shadow-sm"
                onClick={() => setIsConfigOpen(true)}
              >
                <MoreVertical className="w-4 h-4" />
              </Button>
            </CardHeader>
            <CardContent className="p-6">
              <div className="flex items-center gap-4 mb-6 text-[9px] font-bold text-slate-500 flex-wrap select-none">
                  {[
                    { label: "High Churn Risk", color: "bg-rose-500" },
                    { label: "Mid Churn Risk", color: "bg-amber-500" },
                    { label: "Low Churn Risk", color: "bg-emerald-500" },
                    { label: "N/A", color: "bg-slate-300" }
                  ].map(item => (
                    <div 
                      key={item.label}
                      className={cn(
                        "flex items-center gap-1.5 cursor-pointer transition-opacity",
                        hiddenBars.includes(item.label) ? "opacity-30" : "opacity-100"
                      )}
                      onClick={() => {
                        setHiddenBars(prev => 
                          prev.includes(item.label) 
                            ? prev.filter(b => b !== item.label) 
                            : [...prev, item.label]
                        );
                      }}
                    >
                      <div className={cn(
                        "w-3 h-3 rounded flex items-center justify-center border transition-all",
                        hiddenBars.includes(item.label) ? "border-slate-300 bg-transparent" : cn("border-transparent", item.color)
                      )}>
                        {!hiddenBars.includes(item.label) && (
                          <div className="w-1.5 h-1.5 rounded-full bg-white" />
                        )}
                      </div> 
                      <span className={hiddenBars.includes(item.label) ? "text-slate-400" : "text-slate-700"}>
                        {item.label}
                      </span>
                    </div>
                  ))}
              </div>
              <div className="h-[380px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart 
                    data={getPercentData()} 
                    margin={{ top: 10, right: 10, left: -20, bottom: 40 }}
                    onClick={(e) => handleBarClick(e)}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis 
                      dataKey="date_str" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{fontSize: 8, fill: '#94a3b8'}} 
                      angle={-45}
                      textAnchor="end"
                      height={60}
                      interval={Math.floor(getPercentData().length / 8)}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{fontSize: 10, fill: '#64748b'}}
                      tickFormatter={(val) => `${Math.round(val)}%`}
                      domain={[0, 100]}
                      ticks={[0, 25, 50, 75, 100]}
                      width={40}
                    />
                    <Tooltip 
                      cursor={{fill: '#f8fafc', opacity: 0.3}}
                      contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: '11px'}}
                      formatter={(val) => `${val.toFixed(2)}%`}
                    />
                    <Bar 
                      dataKey="High Churn Risk %" 
                      stackId="a" 
                      fill="#ef4444" 
                      name="High Churn Risk" 
                      className="cursor-pointer"
                      hide={hiddenBars.includes("High Churn Risk")} 
                    />
                    <Bar 
                      dataKey="Mid Churn Risk %" 
                      stackId="a" 
                      fill="#f59e0b" 
                      name="Mid Churn Risk" 
                      className="cursor-pointer"
                      hide={hiddenBars.includes("Mid Churn Risk")} 
                    />
                    <Bar 
                      dataKey="Low Churn Risk %" 
                      stackId="a" 
                      fill="#10b981" 
                      name="Low Churn Risk" 
                      className="cursor-pointer"
                      hide={hiddenBars.includes("Low Churn Risk")} 
                    />
                    <Bar 
                      dataKey="N/A %" 
                      stackId="a" 
                      fill="#cbd5e1" 
                      name="N/A" 
                      radius={[2, 2, 0, 0]} 
                      className="cursor-pointer"
                      hide={hiddenBars.includes("N/A")} 
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Bottom Trends */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <Card className="shadow-md border-none">
                <CardHeader className="pb-2 border-b bg-slate-900 text-white rounded-t-xl">
                   <CardTitle className="text-xs font-bold uppercase">L7D %Adoption of Top ARR Accounts (&gt;7K)</CardTitle>
                </CardHeader>
                <CardContent className="pt-4 h-[250px]">
                   <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={data.trends} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                         <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                         <XAxis dataKey="date" hide />
                         <YAxis axisLine={false} tickLine={false} tick={{fontSize: 9, fill: '#888'}} tickFormatter={(v) => `${(v*100).toFixed(0)}%`} />
                         <Tooltip contentStyle={{fontSize: '10px'}} formatter={(v) => `${(v*100).toFixed(2)}%`} />
                         {data.target_accounts.map((acc, i) => (
                            <Line key={acc} type="monotone" dataKey={`${acc}_adoption`} stroke={['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'][i % 5]} strokeWidth={1.5} dot={false} name={acc.split(' ')[0]} />
                         ))}
                      </LineChart>
                   </ResponsiveContainer>
                </CardContent>
             </Card>

             <Card className="shadow-md border-none">
                <CardHeader className="pb-2 border-b bg-slate-900 text-white rounded-t-xl">
                   <CardTitle className="text-xs font-bold uppercase">L7D Duration of Top ARR Accounts (&gt;7K)</CardTitle>
                </CardHeader>
                <CardContent className="pt-4 h-[250px]">
                   <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={data.trends} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                         <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                         <XAxis dataKey="date" hide />
                         <YAxis axisLine={false} tickLine={false} tick={{fontSize: 9, fill: '#888'}} />
                         <Tooltip contentStyle={{fontSize: '10px'}} formatter={(v) => `${v.toFixed(2)}m`} />
                         {data.target_accounts.map((acc, i) => (
                            <Line key={acc} type="monotone" dataKey={`${acc}_duration`} stroke={['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'][i % 5]} strokeWidth={1.5} dot={false} name={acc.split(' ')[0]} />
                         ))}
                      </LineChart>
                   </ResponsiveContainer>
                </CardContent>
             </Card>
          </div>
        </div>

        {/* Right Column: KPI Cards & Legends */}
        <div className="lg:col-span-3 space-y-6">
           <div className="grid grid-cols-1 gap-4">
              <KPICard title="[$ARR L7D Avg.] High Churn Risk" value={data.summary?.kpis?.l7d_arr_avg} growth={data.summary?.kpis?.arr_wow} />
              <KPICard title="[#Accounts L7D Avg.] Total Account" value={data.summary?.kpis?.l7d_acc_avg?.toFixed(0)} growth={data.summary?.kpis?.acc_wow} />
              <KPICard title="[$ARR L30D Avg.] High Churn Risk" value={data.summary?.kpis?.l30d_arr_avg} growth={data.summary?.kpis?.arr_mom} type="mom" />
              <KPICard title="[#Accounts L30D Avg.] High Churn Risk" value={data.summary?.kpis?.l30d_acc_avg?.toFixed(0)} growth={data.summary?.kpis?.acc_mom} type="mom" />
           </div>

           <div className="p-4 bg-white border rounded-xl space-y-4">
              <div className="flex items-center gap-3">
                 <div className="w-2 h-2 rounded-full bg-rose-500" />
                 <span className="text-[10px] font-bold leading-tight">High: %Adoption &lt;60% OR Duration &lt;50</span>
              </div>
              <div className="flex items-center gap-3">
                 <div className="w-2 h-2 rounded-full bg-emerald-500" />
                 <span className="text-[10px] font-bold leading-tight">Low: %Adoption &gt;90% AND Duration &gt;75</span>
              </div>
              <div className="flex items-center gap-3">
                 <div className="w-2 h-2 rounded-full bg-amber-500" />
                 <span className="text-[10px] font-bold leading-tight">Mid: Neither of the above conditions is met</span>
              </div>
              <div className="pt-4 border-t">
                 <p className="text-[9px] text-muted-foreground"><strong>%Adoption</strong> = #Avg. Last 7 Weekdays Daily Active Users (DAU) / #Total Licenses Purchased</p>
                 <p className="text-[9px] text-muted-foreground mt-1"><strong>Duration</strong> = Avg. Last 7 Weekdays Time Spent Per User Per Day (mins)</p>
              </div>
           </div>
        </div>
      </div>

      {/* Global Toolbar */}
      <div className="flex items-center justify-between py-4 border-t border-b mt-12 bg-white px-6 rounded-xl shadow-sm border sticky bottom-4 z-10">
          <div className="flex gap-4">
            <Button variant="ghost" size="sm" className="text-xs font-bold gap-2"><Filter className="w-3 h-3" /> Filter</Button>
            <Button variant="ghost" size="sm" className="text-xs font-bold gap-2"><Layers className="w-3 h-3" /> Group By</Button>
            <Button variant="ghost" size="sm" className="text-xs font-bold gap-2"><MoreVertical className="w-3 h-3" /> Sort</Button>
            <Button variant="ghost" size="sm" className="text-xs font-bold gap-2"><Search className="w-3 h-3" /> Search</Button>
          </div>
          <Button onClick={() => toast.success("Feature to add blocks coming soon!")} className="bg-primary text-white hover:bg-primary/90 border-none rounded-lg px-6 gap-2"><Plus className="w-4 h-4" /> Add Block</Button>
      </div>

      </div>

      {/* Configuration Sidebar (Dialog-based) */}
      <Dialog open={isConfigOpen} onOpenChange={setIsConfigOpen}>
         <DialogContent className="sm:max-w-[400px] h-screen fixed right-0 top-0 m-0 rounded-none overflow-y-auto translate-x-0 slide-in-from-right duration-300">
            <DialogHeader className="border-b pb-4">
               <DialogTitle className="text-xl font-bold">Column chart</DialogTitle>
               <DialogDescription className="text-xs">Configure the visual parameters of this block.</DialogDescription>
            </DialogHeader>
            
            <div className="py-4">
            <Tabs value={activeConfigTab} onValueChange={setActiveConfigTab}>
               <TabsList className="w-full bg-slate-100">
                  <TabsTrigger value="general" className="flex-1 text-xs">General</TabsTrigger>
                  <TabsTrigger value="custom" className="flex-1 text-xs">Custom</TabsTrigger>
                  <TabsTrigger value="analysis" className="flex-1 text-xs">Analysis</TabsTrigger>
               </TabsList>
               
               <TabsContent value="general" className="pt-6 space-y-6">
                  <div className="space-y-2">
                     <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Title</label>
                     <input 
                        type="text" 
                        className="w-full border rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-primary outline-none"
                        value={chartConfig.title}
                        onChange={(e) => setChartConfig({...chartConfig, title: e.target.value})}
                     />
                  </div>
                  
                  <div className="space-y-2">
                     <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">Base <Layers className="w-3 h-3" /></label>
                     <div className="border rounded-md px-3 py-2 text-xs flex items-center justify-between bg-slate-50 text-muted-foreground">
                        <span className="truncate">DRS-ICT Project Management...</span>
                        <ChevronDown className="w-3 h-3" />
                     </div>
                  </div>

                  <div className="space-y-2">
                     <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Data source</label>
                     <div className="border rounded-md px-3 py-2 text-xs flex items-center justify-between">
                        <span>Closed Won - Detail</span>
                        <ChevronDown className="w-3 h-3 text-slate-400" />
                     </div>
                  </div>

                  <div className="space-y-2">
                     <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Chart type</label>
                     <div className="border rounded-md px-3 py-2 text-xs flex items-center justify-between">
                        <span>{chartConfig.type}</span>
                        <ChevronDown className="w-3 h-3 text-slate-400" />
                     </div>
                  </div>

                  <div className="space-y-2">
                     <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Themes</label>
                     <div className="flex gap-1">
                        <div className="h-6 flex-1 rounded bg-blue-400" />
                        <div className="h-6 flex-1 rounded bg-teal-400" />
                        <div className="h-6 flex-1 rounded bg-amber-400" />
                        <div className="h-6 flex-1 rounded bg-rose-400" />
                        <div className="h-6 flex-1 rounded bg-indigo-400" />
                     </div>
                  </div>
               </TabsContent>

               <TabsContent value="custom" className="pt-6 space-y-6">
                  <div className="flex items-center justify-between">
                     <span className="text-sm">Gradient fill</span>
                     <input type="checkbox" className="w-4 h-4" />
                  </div>
                  <div className="flex items-center justify-between">
                     <span className="text-sm">Show data labels</span>
                     <input type="checkbox" className="w-4 h-4" />
                  </div>
               </TabsContent>

               <TabsContent value="analysis" className="pt-6 space-y-6 italic text-sm text-muted-foreground">
                  Advanced trend analysis and prediction options will appear here.
               </TabsContent>
            </Tabs>
            </div>
         </DialogContent>
      </Dialog>

      {/* Details Modal */}
      <Dialog open={!!selectedSegment} onOpenChange={(open) => {
        if (!open) {
          setSelectedSegment(null);
          setModalSearchTerm("");
        }
      }}>
        <DialogContent className="max-w-5xl max-h-[85vh] overflow-hidden flex flex-col p-0 border-none shadow-2xl rounded-2xl">
          <div className="bg-white p-8 space-y-6">
            <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
               <div>
                  <DialogTitle className="text-3xl font-extrabold flex items-center gap-2 tracking-tight">
                     Details
                  </DialogTitle>
                  <DialogDescription className="text-sm text-muted-foreground flex items-center gap-1 mt-2">
                     <Settings2 className="w-4 h-4" /> Showing {selectedSegment?.risk} segment for {selectedSegment?.date}.
                  </DialogDescription>
               </div>
            </DialogHeader>

            <div className="relative">
               <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
               <input 
                  type="text" 
                  placeholder="Search accounts in this segment..." 
                  className="w-full bg-slate-50 border rounded-xl pl-12 pr-4 py-3 text-sm focus:bg-white transition-all outline-none"
                  value={modalSearchTerm}
                  onChange={(e) => setModalSearchTerm(e.target.value)}
               />
            </div>
          </div>

          <div className="flex-1 overflow-auto border-t bg-slate-50/20 px-8 pb-8">
            <Table>
              <TableHeader className="bg-white sticky top-0 z-10">
                <TableRow className="border-b-2">
                  <TableHead className="w-12 text-center text-[10px] font-extrabold text-slate-400">#</TableHead>
                  <TableHead className="text-xs font-bold text-slate-700 py-5">
                     <div className="flex items-center gap-2"><TableIcon className="w-3.5 h-3.5" /> Account Name</div>
                  </TableHead>
                  <TableHead className="text-xs font-bold text-slate-700">
                     Account Name (+link)
                  </TableHead>
                  <TableHead className="text-xs font-bold text-slate-700">
                     Nickname
                  </TableHead>
                  <TableHead className="text-xs font-bold text-slate-700">
                     <div className="flex items-center gap-2"><Layers className="w-3.5 h-3.5" /> Partner Name</div>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="bg-white">
                {(selectedSegment?.accounts || [])
                  .filter(acc => 
                    acc.account_name.toLowerCase().includes(modalSearchTerm.toLowerCase()) ||
                    (acc.nickname && acc.nickname.toLowerCase().includes(modalSearchTerm.toLowerCase()))
                  )
                  .map((acc, i) => (
                  <TableRow key={i} className="hover:bg-slate-50/80 transition-colors border-b">
                    <TableCell className="text-center text-slate-400 text-xs py-4 font-mono">{i + 1}</TableCell>
                    <TableCell className="text-sm font-bold text-slate-800">{acc.account_name}</TableCell>
                    <TableCell className="text-center">
                       <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400 cursor-help">
                          !
                       </div>
                    </TableCell>
                    <TableCell className="text-sm text-slate-500 font-medium">{acc.nickname || "None"}</TableCell>
                    <TableCell>
                       <Badge variant="secondary" className="bg-teal-50 text-teal-700 border-teal-100/50 px-4 py-1 rounded-full text-[10px] font-bold">
                          {acc.partner_name}
                       </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          
          <div className="bg-slate-50 p-4 flex justify-end">
             <Button variant="outline" className="rounded-xl" onClick={() => setSelectedSegment(null)}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
