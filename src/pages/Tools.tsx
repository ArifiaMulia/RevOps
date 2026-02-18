// @ts-nocheck
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calculator, Wallet, Users, Save, Trash2, History } from "lucide-react";
import { useState, useEffect } from "react";
import { estimationService, type Estimation } from "@/lib/estimation-service";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function Tools() {
  const [product, setProduct] = useState("");
  const [type, setType] = useState("");
  const [complexity, setComplexity] = useState("med");
  const [result, setResult] = useState<number | null>(null);
  const [savedEsts, setSavedEsts] = useState<Estimation[]>([]);

  useEffect(() => {
    setSavedEsts(estimationService.getAll());
  }, []);

  const handleCalculate = () => {
    // Dummy calc logic
    let base = 5;
    if (product === "netsuite") base += 10;
    if (type === "new") base += 5;
    if (complexity === "high") base *= 2;
    if (complexity === "low") base *= 0.8;
    setResult(Math.round(base));
  };

  const handleSave = () => {
    if (result === null) return;
    const est = {
      projectName: `Estimate ${new Date().toLocaleTimeString()}`,
      product: product || "General",
      type: type || "Standard",
      mandays: result,
      cost: result * 500 // Dummy rate
    };
    estimationService.create(est);
    setSavedEsts(estimationService.getAll());
    toast.success("Estimation saved");
  };

  const handleDelete = (id: string) => {
    estimationService.delete(id);
    setSavedEsts(estimationService.getAll());
    toast.success("Estimation deleted");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Tools & Calculators</h1>
        <p className="text-muted-foreground">Planning and estimation utilities.</p>
      </div>

      <Tabs defaultValue="mandays">
        <TabsList>
          <TabsTrigger value="mandays"><Calculator className="w-4 h-4 mr-2" /> Mandays Calc</TabsTrigger>
          <TabsTrigger value="history"><History className="w-4 h-4 mr-2" /> Saved Estimates</TabsTrigger>
        </TabsList>

        <TabsContent value="mandays" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Estimation Inputs</CardTitle>
                <CardDescription>Calculate effort for professional services</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Product</Label>
                  <Select onValueChange={setProduct}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Product" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="lark">Lark Apps</SelectItem>
                      <SelectItem value="netsuite">Netsuite ERP</SelectItem>
                      <SelectItem value="jedox">Jedox EPM</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Project Type</Label>
                  <Select onValueChange={setType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">New Implementation</SelectItem>
                      <SelectItem value="optimization">Optimization</SelectItem>
                      <SelectItem value="training">Training</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Complexity</Label>
                  <Select onValueChange={setComplexity} defaultValue="med">
                    <SelectTrigger>
                      <SelectValue placeholder="Select Complexity" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low (Standard)</SelectItem>
                      <SelectItem value="med">Medium (Custom flows)</SelectItem>
                      <SelectItem value="high">High (Complex logic)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button className="w-full" onClick={handleCalculate}>Calculate Estimate</Button>
              </CardContent>
            </Card>

            <Card className="bg-muted/50">
              <CardHeader>
                <CardTitle>Estimate Result</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-2">Estimated Effort</p>
                  <div className="text-4xl font-bold">{result !== null ? `${result} Days` : "-"}</div>
                </div>
                {result !== null && (
                  <Button onClick={handleSave} className="w-full gap-2" variant="outline">
                    <Save className="w-4 h-4" /> Save to History
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Saved Estimations</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Project</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Days</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {savedEsts.map(est => (
                    <TableRow key={est.id}>
                      <TableCell>{est.createdAt}</TableCell>
                      <TableCell>{est.projectName}</TableCell>
                      <TableCell>{est.product}</TableCell>
                      <TableCell>{est.mandays}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(est.id)}>
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
