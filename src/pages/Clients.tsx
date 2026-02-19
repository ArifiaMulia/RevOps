// @ts-nocheck
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { 
  Plus, 
  Search, 
  MoreHorizontal, 
  UserPlus, 
  Building2, 
  Mail, 
  Phone,
  Edit2,
  Trash2,
  FileUp,
  Download
} from "lucide-react";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
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
import { Label } from "@/components/ui/label";
import { useState, useEffect, useRef } from "react";
import { clientService, type Client } from "@/lib/client-service";
import { activityLogService } from "@/lib/activity-log-service";
import { downloadService } from "@/lib/download-service";
import { toast } from "sonner";

export default function Clients() {
  const [clients, setClients] = useState<Client[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Partial<Client> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setClients(clientService.getAll());
  }, []);

  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.company.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSaveClient = () => {
    if (!editingClient?.name || !editingClient?.company) {
      toast.error("Name and Company are required");
      return;
    }

    if (editingClient.id) {
      // Update
      const oldClient = clients.find(c => c.id === editingClient.id);
      clientService.update(editingClient.id, editingClient);
      activityLogService.addLog("client", "update", "Arifia Mulia", `Updated client: ${editingClient.name}`, oldClient);
      toast.success("Client updated successfully");
    } else {
      // Create
      const newClient = clientService.add(editingClient as Omit<Client, 'id' | 'createdAt'>);
      activityLogService.addLog("client", "create", "Arifia Mulia", `Created client: ${newClient.name}`);
      toast.success("Client created successfully");
    }
    
    setClients(clientService.getAll());
    setIsDialogOpen(false);
    setEditingClient(null);
  };

  const handleDeleteClient = (id: string) => {
    const client = clients.find(c => c.id === id);
    if (confirm(`Are you sure you want to delete ${client?.name}?`)) {
      clientService.delete(id);
      activityLogService.addLog("client", "delete", "Arifia Mulia", `Deleted client: ${client?.name}`, client);
      setClients(clientService.getAll());
      toast.success("Client deleted");
    }
  };

  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split('\n');
      const headers = lines[0].split(',');
      
      const newClients = lines.slice(1).filter(line => line.trim()).map(line => {
        const values = line.split(',');
        return {
          name: values[0] || "Unknown",
          company: values[1] || "Unknown",
          email: values[2] || "",
          phone: values[3] || "",
          status: "lead" as const,
          lastContact: new Date().toISOString().split('T')[0]
        };
      });

      newClients.forEach(c => clientService.add(c));
      setClients(clientService.getAll());
      activityLogService.addLog("client", "create", "Arifia Mulia", `Imported ${newClients.length} clients via CSV`);
      toast.success(`Successfully imported ${newClients.length} clients`);
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleExportCSV = () => {
    downloadService.downloadCSV(clients, "Clients_Master");
    toast.success("Client list exported to CSV");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Client 360</h1>
          <p className="text-muted-foreground">Comprehensive view of your customer base and leads.</p>
        </div>
        <div className="flex gap-2">
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleImportCSV} 
            accept=".csv" 
            className="hidden" 
          />
          <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
            <FileUp className="w-4 h-4 mr-2" /> Import
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportCSV}>
            <Download className="w-4 h-4 mr-2" /> Export
          </Button>
          <Button size="sm" onClick={() => { setEditingClient({}); setIsDialogOpen(true); }}>
            <UserPlus className="w-4 h-4 mr-2" /> Add Client
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle>Client Directory</CardTitle>
              <CardDescription>A list of all registered clients and their current status.</CardDescription>
            </div>
            <div className="relative w-72">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search clients..." 
                className="pl-8" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Activity</TableHead>
                <TableHead className="w-[80px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredClients.map((client) => (
                <TableRow key={client.id}>
                  <TableCell className="font-medium">{client.name}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
                      {client.company}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 text-xs">
                        <Mail className="w-3 h-3" /> {client.email}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs">
                        <Phone className="w-3 h-3" /> {client.phone}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={client.status === 'active' ? 'default' : 'secondary'}
                      className={client.status === 'active' ? 'bg-emerald-500 hover:bg-emerald-600' : ''}
                    >
                      {client.status.toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{client.lastContact}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => { setEditingClient(client); setIsDialogOpen(true); }}>
                          <Edit2 className="w-4 h-4 mr-2" /> Edit Info
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600" onClick={() => handleDeleteClient(client.id)}>
                          <Trash2 className="w-4 h-4 mr-2" /> Delete
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

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingClient?.id ? "Edit Client Info" : "Add New Client"}</DialogTitle>
            <DialogDescription>
              Enter the client's details below to keep your CRM updated.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Contact Name</Label>
                <Input id="name" value={editingClient?.name || ""} onChange={(e) => setEditingClient({...editingClient, name: e.target.value})} placeholder="John Doe" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="company">Company</Label>
                <Input id="company" value={editingClient?.company || ""} onChange={(e) => setEditingClient({...editingClient, company: e.target.value})} placeholder="Acme Corp" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" value={editingClient?.email || ""} onChange={(e) => setEditingClient({...editingClient, email: e.target.value})} placeholder="john@example.com" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" value={editingClient?.phone || ""} onChange={(e) => setEditingClient({...editingClient, phone: e.target.value})} placeholder="+62..." />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <select 
                id="status" 
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={editingClient?.status || "lead"}
                onChange={(e) => setEditingClient({...editingClient, status: e.target.value as any})}
              >
                <option value="lead">Lead</option>
                <option value="active">Active</option>
                <option value="churned">Churned</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveClient}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
