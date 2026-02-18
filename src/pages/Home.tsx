import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  ArrowUpRight, 
  Users, 
  AlertTriangle, 
  Briefcase,
  Target,
  TrendingUp,
  Wallet,
  FileText,
  Presentation,
  Download,
  MoreVertical,
  CheckCircle,
  Eye
} from "lucide-react";
import heroImg from "@/assets/hero.jpg";
import revenueIcon from "@/assets/revenue_icon.png";
import churnIcon from "@/assets/churn_icon.png";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { useState } from "react";

// Home Page Component
export default function Home() {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const handlePreviewReport = (type: string) => {
    setSelectedReport(type);
    setIsPreviewOpen(true);
  };

  const handleDownload = () => {
    if (!selectedReport) return;
    
    setIsDownloading(true);
    toast.promise(
      new Promise((resolve) => setTimeout(resolve, 2000)),
      {
        loading: `Generating ${selectedReport}...`,
        success: () => {
          setIsDownloading(false);
          setIsPreviewOpen(false);
          return `${selectedReport} downloaded successfully!`;
        },
        error: () => {
          setIsDownloading(false);
          return "Failed to download report";
        }
      }
    );
  };

  // Mock Content for Previews
  const ExecSummaryPreview = () => (
    <div className="border border-border rounded-md p-8 bg-white shadow-sm min-h-[400px] text-sm text-foreground">
      <div className="flex justify-between items-center border-b border-border pb-4 mb-4">
        <div>
          <h2 className="text-xl font-bold text-primary">Executive Summary</h2>
          <p className="text-muted-foreground">Q1 2026 Performance Report</p>
        </div>
        <div className="text-right text-xs text-muted-foreground">
          <p>Generated: {new Date().toLocaleDateString()}</p>
          <p>Confidential</p>
        </div>
      </div>
      
      <div className="space-y-6">
        <section>
          <h3 className="font-semibold text-primary mb-2 flex items-center gap-2"><Target className="w-4 h-4" /> Financial Highlights</h3>
          <div className="grid grid-cols-2 gap-4 bg-muted/30 p-4 rounded-md">
            <div>
              <p className="text-xs text-muted-foreground">Sales Achievement</p>
              <p className="text-lg font-bold">Rp 16.8 M <span className="text-xs font-normal text-muted-foreground">/ Rp 40 M</span></p>
              <Progress value={42} className="h-1 mt-1 bg-muted [&>div]:bg-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Net Profit Margin</p>
              <p className="text-lg font-bold text-emerald-600">32.5% <span className="text-xs font-normal text-muted-foreground">(Target: 30%)</span></p>
            </div>
          </div>
        </section>

        <section>
          <h3 className="font-semibold text-destructive mb-2 flex items-center gap-2"><AlertTriangle className="w-4 h-4" /> Key Risks</h3>
          <ul className="list-disc list-inside text-muted-foreground space-y-1">
            <li>8 High-Risk Clients identified (Churn Score &gt; 75).</li>
            <li>Presales Team capacity critical at 142% utilization.</li>
            <li>Major renewal (Bank Example Tbk) due in 30 days.</li>
          </ul>
        </section>

        <section>
          <h3 className="font-semibold text-primary mb-2 flex items-center gap-2"><Briefcase className="w-4 h-4" /> Strategic Recommendations</h3>
          <p className="text-muted-foreground leading-relaxed">
            Immediate hiring of 3 Presales staff is recommended to address capacity bottlenecks. Focus retention efforts on "Bank Example" renewal. Leverage cross-sell opportunities for Lark users to adopt Netsuite modules.
          </p>
        </section>
      </div>
    </div>
  );

  const PresentationPreview = () => (
    <div className="border border-border rounded-md overflow-hidden bg-slate-900 text-white min-h-[400px] flex flex-col relative">
      <div className="absolute top-0 right-0 p-4 opacity-10">
        <Users className="w-32 h-32" />
      </div>
      
      <div className="flex-1 flex flex-col justify-center items-center p-12 text-center z-10">
        <div className="mb-8">
          <Badge variant="outline" className="mb-4 border-slate-700 text-slate-400">Q1 2026 Review</Badge>
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-emerald-400 to-blue-500 bg-clip-text text-transparent">
            Business Performance Update
          </h1>
          <p className="text-xl text-slate-400">Prasetia ICT Division</p>
        </div>
        
        <div className="grid grid-cols-3 gap-8 w-full max-w-2xl mt-8 border-t border-slate-800 pt-8">
          <div>
            <p className="text-3xl font-bold text-emerald-400">42%</p>
            <p className="text-sm text-slate-500">Sales Target</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-blue-400">32.5%</p>
            <p className="text-sm text-slate-500">Net Profit</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-red-400">8</p>
            <p className="text-sm text-slate-500">At-Risk Accounts</p>
          </div>
        </div>
      </div>
      
      <div className="bg-slate-950 p-4 text-xs text-slate-600 flex justify-between">
        <span>Prasetia RevOps Hub</span>
        <span>Generated via AnyGen</span>
      </div>
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Document Preview Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Preview: {selectedReport}</DialogTitle>
            <DialogDescription>
              Review the content before downloading. This is a generated preview based on current dashboard data.
            </DialogDescription>
          </DialogHeader>
          
          <div className="my-4 max-h-[60vh] overflow-y-auto pr-2">
            {selectedReport?.includes("Executive Summary") || selectedReport?.includes("Account Plan") ? (
              <ExecSummaryPreview />
            ) : (
              <PresentationPreview />
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPreviewOpen(false)}>Cancel</Button>
            <Button onClick={handleDownload} disabled={isDownloading} className="gap-2">
              {isDownloading ? (
                <>Downloading...</>
              ) : (
                <><Download className="w-4 h-4" /> Download Document</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Hero Section */}
      <div className="relative rounded-xl overflow-hidden bg-primary/5 border border-border">
        <div className="absolute inset-0 opacity-10">
          <img src={heroImg} alt="" className="w-full h-full object-cover" />
        </div>
        <div className="relative p-8 md:p-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-2">Welcome back, Arifia</h1>
            <p className="text-muted-foreground max-w-xl">
              Q1 Performance is on track. Sales achievement is at 42% of the new <strong>Rp 40 M</strong> target. 
              Net profit margin is healthy at 32% (Target: 30%).
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
                  <FileText className="w-4 h-4" /> Generate Report
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Select Format</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => handlePreviewReport("Executive Summary")}>
                  <FileText className="w-4 h-4 mr-2" /> Executive Summary (PDF)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handlePreviewReport("Presentation Deck")}>
                  <Presentation className="w-4 h-4 mr-2" /> Presentation Slides (PPT)
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            <Button variant="outline">New Proposal</Button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Sales Target Card */}
        <Card className="border-l-4 border-l-primary">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sales Achievement</CardTitle>
            <Target className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline justify-between">
              <div className="text-2xl font-bold">Rp 16.8 M</div>
              <div className="text-xs font-medium text-muted-foreground">Target: Rp 40 M</div>
            </div>
            <Progress value={42} className="h-2 mt-2 bg-muted [&>div]:bg-primary" />
            <p className="text-xs text-muted-foreground mt-2">
              42% Achieved (YTD)
            </p>
          </CardContent>
        </Card>
        
        {/* Net Profit Card */}
        <Card className="border-l-4 border-l-emerald-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Profit Margin</CardTitle>
            <Wallet className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline justify-between">
              <div className="text-2xl font-bold text-emerald-600">32.5%</div>
              <div className="text-xs font-medium text-muted-foreground">Target: 30%</div>
            </div>
            <div className="flex items-center gap-2 mt-2 text-xs text-emerald-600 bg-emerald-50 w-fit px-2 py-1 rounded">
              <TrendingUp className="w-3 h-3" />
              +2.5% above target
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Est. Profit: Rp 5.4 M
            </p>
          </CardContent>
        </Card>

        {/* Churn Risk Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Churn Risk</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">8 Clients</div>
            <Progress value={25} className="h-1 mt-2 bg-muted [&>div]:bg-destructive" />
            <p className="text-xs text-muted-foreground mt-2">
              High risk (&gt;75 score)
            </p>
          </CardContent>
        </Card>

        {/* Presales Load Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Presales Load</CardTitle>
            <Briefcase className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500">142%</div>
            <Progress value={100} className="h-1 mt-2 bg-muted [&>div]:bg-orange-500" />
            <p className="text-xs text-muted-foreground mt-2">Critical overload</p>
          </CardContent>
        </Card>
      </div>

      {/* Risk & Opportunity Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Churn Risk Table */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Churn Risk Monitor</CardTitle>
                <CardDescription>Top accounts requiring immediate attention</CardDescription>
              </div>
              <img src={churnIcon} className="w-10 h-10 object-contain opacity-20" />
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client</TableHead>
                  <TableHead>Health Score</TableHead>
                  <TableHead>Risk Factors</TableHead>
                  <TableHead>Renewal</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[
                  { name: "PT Global Tech", score: 35, risk: "Low Usage, Ticket Spike", date: "15 Days" },
                  { name: "Indo Logistics", score: 42, risk: "Sponsor Left", date: "45 Days" },
                  { name: "Retail Maju", score: 48, risk: "Implementation Stalled", date: "60 Days" },
                  { name: "Bank Example", score: 55, risk: "Pricing Dispute", date: "30 Days" },
                ].map((client, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-medium">{client.name}</TableCell>
                    <TableCell>
                      <Badge variant="destructive" className="bg-red-50 text-red-700 border-red-200 hover:bg-red-100">
                        {client.score}/100
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{client.risk}</TableCell>
                    <TableCell className="text-sm font-bold text-orange-600">{client.date}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm"><MoreVertical className="w-4 h-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handlePreviewReport(`Account Plan for ${client.name}`)}>
                            <FileText className="w-4 h-4 mr-2" /> Generate Account Plan
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handlePreviewReport(`Review Deck for ${client.name}`)}>
                            <Presentation className="w-4 h-4 mr-2" /> Generate Review Deck
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Revenue Opportunity */}
        <Card className="bg-slate-900 text-white border-slate-800 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <img src={revenueIcon} className="w-32 h-32 object-contain" />
          </div>
          <CardHeader>
            <CardTitle className="text-slate-100">Revenue Growth</CardTitle>
            <CardDescription className="text-slate-400">Expansion opportunities in existing base</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Upsell Pipeline</span>
                <span className="font-bold">Rp 3.5 M</span>
              </div>
              <Progress value={65} className="h-2 bg-slate-800 [&>div]:bg-emerald-500" />
            </div>
            
            <div className="space-y-4 pt-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-500">
                  <ArrowUpRight className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold">Lark → Netsuite Cross-sell</h4>
                  <p className="text-xs text-slate-400">5 qualified accounts identified</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-500">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold">License Expansion</h4>
                  <p className="text-xs text-slate-400">Waitlisted users at PT ABC</p>
                </div>
              </div>
            </div>

            <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white border-none mt-4">
              View Expansion Pipeline
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
