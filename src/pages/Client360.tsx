// @ts-nocheck
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Search, 
  Filter, 
  Download, 
  MoreHorizontal, 
  Plus, 
  Trash2, 
  Edit, 
  FileUp,
  AlertCircle,
  HelpCircle,
  FileText,
  FileType
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useState, useEffect, useRef } from "react";
import { clientService, type Client, type ChurnRisk } from "@/lib/client-service";
import { notificationService } from "@/lib/notification-service";
import { downloadService } from "@/lib/download-service";
import { ClientForm } from "@/components/ClientForm";
import { toast } from "sonner";

const getRiskBadge = (risk?: ChurnRisk) => {
  switch (risk) {
    case "High": return <Badge className="bg-rose-500 hover:bg-rose-600 font-medium">High Risk</Badge>;
    case "Mid": return <Badge className="bg-amber-500 hover:bg-amber-600 font-medium">Mid Risk</Badge>;
    case "Low": return <Badge className="bg-emerald-500 hover:bg-emerald-600 font-medium">Low Risk</Badge>;
    default: return <Badge variant="outline">Unknown</Badge>;
  }
};

const getHealthColor = (score: number) => {
  if (score >= 80) return "text-emerald-600 bg-emerald-50 border-emerald-200";
  if (score >= 60) return "text-amber-600 bg-amber-50 border-amber-200";
  return "text-rose-600 bg-rose-50 border-rose-200";
};

export default function Client360() {
  const [clients, setClients] = useState<Client[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadClients = () => {
    setClients(clientService.getAll());
  };

  useEffect(() => {
    loadClients();
  }, []);

  const handleCreate = (values: any) => {
    clientService.create(values);
    loadClients();
    notificationService.add({
      title: "Client Added",
      message: `New client ${values.name} has been added to the registry.`,
      type: "success"
    });
    toast.success("Client created successfully");
  };

  const handleUpdate = (values: any) => {
    if (selectedClient) {
      clientService.update(selectedClient.id, values);
      loadClients();
      toast.success("Client updated successfully");
    }
  };

  const handleDelete = () => {
    if (deleteId) {
      clientService.delete(deleteId);
      loadClients();
      setDeleteId(null);
      toast.success("Client deleted successfully");
    }
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split('\n');
      if (lines.length < 2) {
        toast.error("File is empty or invalid format");
        return;
      }

      // Detect delimiter: comma or tab
      const firstLine = lines[0];
      const delimiter = firstLine.includes('\t') ? '\t' : ',';
      
      const headers = lines[0].split(delimiter).map(h => h.trim().toLowerCase().replace(/"/g, ''));
      
      const data = lines.slice(1).filter(l => l.trim()).map(line => {
        const values = line.split(delimiter).map(v => v.trim().replace(/"/g, ''));
        const obj: any = {};
        headers.forEach((header, i) => {
          if (header === 'licenses' || header === 'dau' || header === 'duration' || header === 'health') {
            obj[header] = parseInt(values[i]) || 0;
          } else {
            obj[header] = values[i];
          }
        });
        return obj;
      });

      clientService.bulkUpsert(data);
      loadClients();
      toast.success(`Successfully imported ${data.length} records`);
      notificationService.add({
        title: "Bulk Import Complete",
        message: `Successfully processed ${data.length} client records using ${delimiter === '\t' ? 'Excel' : 'CSV'} format.`,
        type: "success"
      });
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleExportCSV = () => {
    downloadService.downloadCSV(clients, "Client360_Master");
    toast.success("Exporting to CSV...");
  };

  const handleExportXLS = () => {
    downloadService.downloadXLS(clients, "Client360_Master");
    toast.success("Exporting to Excel...");
  };

  const filteredClients = clients.filter(client => 
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.industry.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Client 360 Overview</h1>
          <p className="text-muted-foreground">Monitor health scores, renewals, and account status.</p>
        </div>
        <div className="flex gap-2">
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleImport} 
            className="hidden" 
            accept=".csv,.xls,.xlsx,.txt"
          />
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <FileUp className="w-4 h-4 mr-2" /> Import Data
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Choose Format</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => fileInputRef.current?.click()}>
                <FileType className="w-4 h-4 mr-2 text-blue-500" /> From CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => fileInputRef.current?.click()}>
                <FileText className="w-4 h-4 mr-2 text-emerald-500" /> From Excel (.xls/txt)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Download className="w-4 h-4 mr-2" /> Export Data
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Choose Format</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleExportCSV}>
                <FileType className="w-4 h-4 mr-2 text-blue-500" /> Export to CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleExportXLS}>
                <FileText className="w-4 h-4 mr-2 text-emerald-500" /> Export to Excel (.xls)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button onClick={() => { setSelectedClient(null); setFormMode("create"); setIsFormOpen(true); }}>
            <Plus className="w-4 h-4 mr-2" /> Add Client
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-4 bg-card p-4 rounded-lg border border-border shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Search companies..." 
            className="pl-9" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button variant="outline" size="icon"><Filter className="w-4 h-4" /></Button>
      </div>

      <Card className="overflow-hidden border-border shadow-md">
        <Table>
          <TableHeader className="bg-muted/30">
            <TableRow>
              <TableHead className="font-bold">Company</TableHead>
              <TableHead className="font-bold">Industry</TableHead>
              <TableHead className="font-bold">Licenses</TableHead>
              <TableHead className="font-bold">ARR</TableHead>
              <TableHead className="font-bold">Renewal</TableHead>
              <TableHead className="font-bold text-center">
                <div className="flex items-center justify-center gap-1">
                  Health
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="w-3 h-3 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs p-3 space-y-2">
                        <p className="font-bold">Logic:</p>
                        <ul className="text-xs list-disc pl-4 space-y-1">
                          <li className="text-rose-500 font-semibold">High Risk: Adoption &lt; 60% OR Duration &lt; 50m</li>
                          <li className="text-emerald-500 font-semibold">Low Risk: Adoption &gt; 90% AND Duration &gt; 75m</li>
                          <li className="text-amber-500">Mid Risk: Default</li>
                        </ul>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </TableHead>
              <TableHead className="font-bold text-center">Churn Risk</TableHead>
              <TableHead className="font-bold">Status</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredClients.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-12 text-muted-foreground">
                  No clients found. Add one or import a data file.
                </TableCell>
              </TableRow>
            ) : (
              filteredClients.map((client) => (
                <TableRow key={client.id} className="hover:bg-muted/50 transition-colors">
                  <TableCell className="font-semibold">{client.name}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="font-normal">{client.industry}</Badge>
                  </TableCell>
                  <TableCell>{client.licenses}</TableCell>
                  <TableCell className="font-mono text-xs">{client.arr}</TableCell>
                  <TableCell className="text-xs whitespace-nowrap">{client.renewal}</TableCell>
                  <TableCell className="text-center">
                    <div className={cn(
                      "inline-flex items-center justify-center w-12 h-7 rounded-full text-xs font-bold border",
                      getHealthColor(client.health)
                    )}>
                      {client.health}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    {getRiskBadge(client.churnRisk)}
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={client.status === "Healthy" ? "default" : client.status === "At Risk" ? "destructive" : "secondary"}
                      className={client.status === "Healthy" ? "bg-emerald-500 hover:bg-emerald-600" : ""}
                    >
                      {client.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon"><MoreHorizontal className="w-4 h-4" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => { setSelectedClient(client); setFormMode("edit"); setIsFormOpen(true); }}>
                          <Edit className="w-4 h-4 mr-2" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600 focus:text-red-600" onClick={() => setDeleteId(client.id)}>
                          <Trash2 className="w-4 h-4 mr-2" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      <ClientForm 
        open={isFormOpen} 
        onOpenChange={setIsFormOpen}
        mode={formMode}
        initialData={selectedClient}
        onSubmit={formMode === "create" ? handleCreate : handleUpdate}
      />

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the client record for {clients.find(c => c.id === deleteId)?.name}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
