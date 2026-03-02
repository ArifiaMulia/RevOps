// @ts-nocheck
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { 
  Calculator, 
  Plus, 
  Trash2, 
  Save, 
  FileText, 
  Clock,
  ChevronRight,
  History,
  Info
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useState, useEffect } from "react";
import { estimationService, type Estimation, type EstimationItem } from "@/lib/estimation-service";
import { activityLogService } from "@/lib/activity-log-service";
import { toast } from "sonner";

export default function Tools() {
  const [items, setItems] = useState<EstimationItem[]>([
    { id: "1", description: "System Analysis", quantity: 1, unit: "Mandays", unitPrice: 5000000, total: 5000000 },
    { id: "2", description: "Core Development", quantity: 10, unit: "Mandays", unitPrice: 4500000, total: 45000000 },
  ]);
  const [projectTitle, setProjectTitle] = useState("");
  const [clientName, setClientName] = useState("");
  const [history, setHistory] = useState<Estimation[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  useEffect(() => {
    setHistory(estimationService.getAll());
  }, []);

  const total = items.reduce((acc, curr) => acc + curr.total, 0);

  const addItem = () => {
    const newItem: EstimationItem = {
      id: Math.random().toString(36).substr(2, 9),
      description: "New Item",
      quantity: 1,
      unit: "Mandays",
      unitPrice: 0,
      total: 0
    };
    setItems([...items, newItem]);
  };

  const updateItem = (id: string, field: keyof EstimationItem, value: any) => {
    setItems(items.map(item => {
      if (item.id === id) {
        const updated = { ...item, [field]: value };
        if (field === 'quantity' || field === 'unitPrice') {
          updated.total = (updated.quantity || 0) * (updated.unitPrice || 0);
        }
        return updated;
      }
      return item;
    }));
  };

  const removeItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  const handleSaveEstimation = () => {
    if (!projectTitle || !clientName) {
      toast.error("Please provide Project Title and Client Name");
      return;
    }

    const newEst = estimationService.add({
      title: projectTitle,
      client: clientName,
      items: items,
      total: total
    });

    activityLogService.addLog("estimation", "create", "Arifia Mulia", `Saved estimation: ${projectTitle} for ${clientName}`);
    setHistory(estimationService.getAll());
    toast.success("Estimation saved successfully");
    
    // Reset form
    setProjectTitle("");
    setClientName("");
    setItems([{ id: "1", description: "Initial Item", quantity: 1, unit: "Mandays", unitPrice: 0, total: 0 }]);
  };

  const handleLoadEstimation = (est: Estimation) => {
    setProjectTitle(est.title);
    setClientName(est.client);
    setItems([...est.items]);
    setIsHistoryOpen(false);
    toast.info(`Loaded: ${est.title}`);
  };

  const handleDeleteHistory = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const est = history.find(h => h.id === id);
    estimationService.delete(id);
    setHistory(estimationService.getAll());
    activityLogService.addLog("estimation", "delete", "Arifia Mulia", `Deleted saved estimation: ${est?.title}`, est);
    toast.success("Entry removed from history");
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Revenue Tools</h1>
          <p className="text-muted-foreground">Build project estimations and calculate margins effectively.</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => setIsHistoryOpen(true)}>
          <History className="w-4 h-4 mr-2" /> Saved Estimations
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="w-5 h-5" /> Estimation Builder
            </CardTitle>
            <CardDescription>Customize project items, mandays, and unit prices.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Project Title</Label>
                <Input value={projectTitle} onChange={(e) => setProjectTitle(e.target.value)} placeholder="e.g. ERP Implementation Phase 1" />
              </div>
              <div className="space-y-2">
                <Label>Client Name</Label>
                <Input value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="e.g. PT Maju Bersama" />
              </div>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Description</TableHead>
                  <TableHead className="w-[120px]">Qty</TableHead>
                  <TableHead className="w-[120px]">Unit</TableHead>
                  <TableHead className="w-[150px]">Unit Price</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <Input 
                        value={item.description} 
                        onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                        className="h-8 text-sm"
                      />
                    </TableCell>
                    <TableCell>
                      <Input 
                        type="number" 
                        value={item.quantity} 
                        onChange={(e) => updateItem(item.id, 'quantity', parseFloat(e.target.value))}
                        className="h-8 text-sm"
                      />
                    </TableCell>
                    <TableCell>
                      <select 
                        className="flex h-8 w-full rounded-md border border-input bg-background px-3 py-1 text-xs ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        value={item.unit}
                        onChange={(e) => updateItem(item.id, 'unit', e.target.value)}
                      >
                        <option value="Mandays">Mandays</option>
                        <option value="Hours">Hours</option>
                        <option value="License">License</option>
                        <option value="Unit">Unit</option>
                      </select>
                    </TableCell>
                    <TableCell>
                      <Input 
                        type="number" 
                        value={item.unitPrice} 
                        onChange={(e) => updateItem(item.id, 'unitPrice', parseFloat(e.target.value))}
                        className="h-8 text-sm"
                      />
                    </TableCell>
                    <TableCell className="text-right text-sm font-medium">
                      {formatCurrency(item.total)}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={() => removeItem(item.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <div className="flex justify-between items-center pt-4 border-t">
              <Button variant="outline" size="sm" onClick={addItem}>
                <Plus className="w-4 h-4 mr-2" /> Add Item
              </Button>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Estimated Total</p>
                <p className="text-2xl font-bold text-primary">{formatCurrency(total)}</p>
              </div>
            </div>

            <Button className="w-full mt-4" onClick={handleSaveEstimation}>
              <Save className="w-4 h-4 mr-2" /> Save Estimation
            </Button>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Mandays Logic</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-4">
              <div className="flex items-start gap-2 p-3 rounded-md bg-blue-50 border border-blue-100">
                <Info className="w-4 h-4 text-blue-500 mt-0.5" />
                <p className="text-blue-800 text-xs leading-relaxed">
                  1 Manday = 8 working hours. Calculation used for service-based pricing at Prasetia Group.
                </p>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Effective Rate/Day</span>
                  <span className="font-medium">Rp 5.000.000</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Avg. Project Duration</span>
                  <span className="font-medium">12 Mandays</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Quick Export</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start text-sm">
                <FileText className="w-4 h-4 mr-2 text-red-500" /> Export to PDF Proposal
              </Button>
              <Button variant="outline" className="w-full justify-start text-sm">
                <FileText className="w-4 h-4 mr-2 text-emerald-500" /> Export to XLS Budgeting
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Saved Estimations</DialogTitle>
            <DialogDescription>Select a previous estimation to load or manage.</DialogDescription>
          </DialogHeader>
          <div className="max-h-[400px] overflow-y-auto space-y-2 py-4">
            {history.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">No saved estimations yet.</p>
            ) : (
              history.map((est) => (
                <div 
                  key={est.id} 
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-slate-50 cursor-pointer group"
                  onClick={() => handleLoadEstimation(est)}
                >
                  <div className="space-y-1">
                    <p className="font-medium text-sm">{est.title}</p>
                    <p className="text-xs text-muted-foreground">{est.client} • {formatCurrency(est.total)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-red-400 opacity-0 group-hover:opacity-100" onClick={(e) => handleDeleteHistory(est.id, e)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </div>
                </div>
              ))
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsHistoryOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
