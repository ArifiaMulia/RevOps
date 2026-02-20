// @ts-nocheck
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { projectService, type Project } from "@/lib/project-service";
import { productService, type Product } from "@/lib/product-service";
import { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, CheckCircle2, AlertCircle } from "lucide-react";
import { TaskList } from "@/components/TaskList";

export default function ProductDashboard() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [filterProduct, setFilterProduct] = useState<string>("all");
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  
  useEffect(() => {
    setProjects(projectService.getAll());
    setProducts(productService.getAll());
  }, []);

  const filteredProjects = filterProduct === "all" 
    ? projects 
    : projects.filter(p => p.productId === filterProduct);

  const progressByProduct = products.map(prod => {
    const prodProjects = projects.filter(p => p.productId === prod.id);
    if (prodProjects.length === 0) return null;
    const avgProgress = prodProjects.reduce((acc, curr) => acc + curr.progress, 0) / prodProjects.length;
    return { name: prod.name, progress: Math.round(avgProgress), count: prodProjects.length };
  }).filter(Boolean);

  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const timelineProjects = [...filteredProjects].sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Product & Project Dashboard</h1>
          <p className="text-muted-foreground">Portfolio progress and timeline view.</p>
        </div>
        <div className="w-[200px]">
          <Select value={filterProduct} onValueChange={setFilterProduct}>
            <SelectTrigger><SelectValue placeholder="Filter Product" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Products</SelectItem>
              {products.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Gantt Chart Area */}
        <Card className="col-span-2">
          <CardHeader><CardTitle>Project Timeline (2025/2026)</CardTitle></CardHeader>
          <CardContent className="overflow-x-auto">
            <div className="min-w-[800px]">
              <div className="flex border-b border-border pb-2 mb-4">
                {months.map(m => (
                  <div key={m} className="w-[100px] text-xs font-semibold text-muted-foreground text-center border-l border-dashed border-border/50">
                    {m}
                  </div>
                ))}
              </div>
              <div className="space-y-4 relative min-h-[300px]">
                <div className="absolute inset-0 flex pointer-events-none">
                  {months.map(m => <div key={m} className="w-[100px] border-l border-dashed border-border/30 h-full" />)}
                </div>

                {timelineProjects.map(p => {
                  const startMonth = new Date(p.startDate).getMonth(); 
                  const endMonth = new Date(p.endDate).getMonth();
                  const durationMonths = endMonth - startMonth + 1;
                  const left = startMonth * 100;
                  const width = Math.max(durationMonths * 100, 50);
                  const color = p.status === "Completed" ? "bg-green-500" : p.status === "In Progress" ? "bg-blue-500" : "bg-slate-300";

                  return (
                    <div key={p.id} className="relative h-12 flex items-center group">
                      <div 
                        className={`absolute h-8 rounded-md ${color} opacity-80 flex items-center px-3 shadow-sm transition-all hover:opacity-100 hover:shadow-md cursor-pointer`}
                        style={{ left: `${left}px`, width: `${width}px` }}
                        onClick={() => setSelectedProject(p)}
                      >
                        <span className="text-xs font-bold text-white whitespace-nowrap overflow-hidden text-ellipsis">
                          {p.name}
                        </span>
                      </div>
                      {/* Hover Tooltip */}
                      <div className="opacity-0 group-hover:opacity-100 absolute left-0 top-10 z-10 bg-popover text-popover-foreground text-xs p-2 rounded shadow-lg border border-border pointer-events-none transition-opacity w-48">
                        <p className="font-bold">{p.name}</p>
                        <p className="text-muted-foreground">{p.startDate} - {p.endDate}</p>
                        <div className="flex items-center justify-between mt-1">
                          <span>Progress</span>
                          <span className="font-mono">{p.progress}%</span>
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-1 italic">Click to view details & tasks</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Progress by Product</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-6">
              {progressByProduct.map((item: any) => (
                <div key={item.name} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{item.name}</span>
                    <span className="text-muted-foreground">{item.progress}%</span>
                  </div>
                  <Progress value={item.progress} className="h-2" />
                  <p className="text-xs text-muted-foreground text-right">{item.count} Active Projects</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Project Detail Modal */}
      <Dialog open={!!selectedProject} onOpenChange={(open) => !open && setSelectedProject(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedProject?.name}</DialogTitle>
          </DialogHeader>
          
          {selectedProject && (
            <Tabs defaultValue="overview">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="tasks">Tasks & Actions</TabsTrigger>
              </TabsList>
              
              <TabsContent value="overview" className="space-y-4">
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Status</CardTitle></CardHeader>
                    <CardContent><Badge>{selectedProject.status}</Badge></CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Progress</CardTitle></CardHeader>
                    <CardContent className="text-2xl font-bold">{selectedProject.progress}%</CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Timeline</CardTitle></CardHeader>
                    <CardContent className="text-sm">
                      <div className="flex items-center gap-2"><Calendar className="w-4 h-4" /> {selectedProject.startDate}</div>
                      <div className="flex items-center gap-2 mt-1"><CheckCircle2 className="w-4 h-4" /> {selectedProject.endDate}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Owner</CardTitle></CardHeader>
                    <CardContent>{selectedProject.owner}</CardContent>
                  </Card>
                </div>
              </TabsContent>
              
              <TabsContent value="tasks" className="mt-4">
                <TaskList projectId={selectedProject.id} />
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
