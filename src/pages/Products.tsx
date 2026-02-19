// @ts-nocheck
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Plus, 
  Search, 
  Tag, 
  Package, 
  Trash2, 
  Edit2, 
  MoreVertical,
  ArrowUpDown,
  DollarSign
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState } from "react";
import { activityLogService } from "@/lib/activity-log-service";
import { toast } from "sonner";

interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  quantity: number;
  rebate: number; // percentage
  margin: number; // percentage
  status: 'active' | 'discontinued';
}

const INITIAL_PRODUCTS: Product[] = [
  { id: "1", name: "SaaS Enterprise License", category: "Software", price: 15000000, quantity: 50, rebate: 5, margin: 40, status: "active" },
  { id: "2", name: "Implementation Service", category: "Professional Services", price: 25000000, quantity: 1, rebate: 0, margin: 60, status: "active" },
  { id: "3", name: "Hardware Server Pro", category: "Hardware", price: 85000000, quantity: 10, rebate: 10, margin: 15, status: "active" },
  { id: "4", name: "Annual Maintenance", category: "Support", price: 5000000, quantity: 100, rebate: 2, margin: 80, status: "active" },
];

export default function Products() {
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSaveProduct = () => {
    if (!editingProduct?.name || !editingProduct?.category) {
      toast.error("Name and Category are required");
      return;
    }

    if (editingProduct.id) {
      // Update
      const oldProd = products.find(p => p.id === editingProduct.id);
      setProducts(products.map(p => p.id === editingProduct.id ? { ...p, ...editingProduct } as Product : p));
      activityLogService.addLog("product", "update", "Arifia Mulia", `Updated product: ${editingProduct.name}`, oldProd);
      toast.success("Product updated");
    } else {
      // Create
      const newProd = {
        ...editingProduct,
        id: Math.random().toString(36).substr(2, 9),
        status: 'active'
      } as Product;
      setProducts([...products, newProd]);
      activityLogService.addLog("product", "create", "Arifia Mulia", `Created product: ${newProd.name}`);
      toast.success("Product added to master list");
    }

    setIsDialogOpen(false);
    setEditingProduct(null);
  };

  const handleDeleteProduct = (id: string) => {
    const prod = products.find(p => p.id === id);
    if (confirm(`Delete ${prod?.name}?`)) {
      setProducts(products.filter(p => p.id !== id));
      activityLogService.addLog("product", "delete", "Arifia Mulia", `Deleted product: ${prod?.name}`, prod);
      toast.success("Product removed");
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Product Master</h1>
          <p className="text-muted-foreground">Manage price lists, stock levels, and profit margins.</p>
        </div>
        <Button size="sm" onClick={() => { setEditingProduct({ price: 0, quantity: 0, rebate: 0, margin: 0 }); setIsDialogOpen(true); }}>
          <Plus className="w-4 h-4 mr-2" /> Add Product
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle>Catalog Items</CardTitle>
              <CardDescription>Master list of all services and physical goods.</CardDescription>
            </div>
            <div className="relative w-72">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search products..." 
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
                <TableHead>Product Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="text-center">Stock</TableHead>
                <TableHead className="text-center">Rebate %</TableHead>
                <TableHead className="text-center">Margin %</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.map((product) => (
                <TableRow key={product.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <Package className="w-4 h-4 text-primary" />
                      {product.name}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{product.category}</Badge>
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm">
                    {formatCurrency(product.price)}
                  </TableCell>
                  <TableCell className="text-center">{product.quantity}</TableCell>
                  <TableCell className="text-center text-emerald-600">{product.rebate}%</TableCell>
                  <TableCell className="text-center text-blue-600">{product.margin}%</TableCell>
                  <TableCell>
                    <Badge variant={product.status === 'active' ? 'default' : 'secondary'}>
                      {product.status.toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => { setEditingProduct(product); setIsDialogOpen(true); }}>
                          <Edit2 className="w-4 h-4 mr-2" /> Edit Details
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600" onClick={() => handleDeleteProduct(product.id)}>
                          <Trash2 className="w-4 h-4 mr-2" /> Remove
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
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{editingProduct?.id ? "Edit Product" : "New Product Entry"}</DialogTitle>
            <DialogDescription>
              Update item specifications, pricing models, and stock details.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-6 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="pname">Product Name</Label>
                <Input id="pname" value={editingProduct?.name || ""} onChange={(e) => setEditingProduct({...editingProduct, name: e.target.value})} placeholder="e.g. Server Pro 2024" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pcat">Category</Label>
                <Input id="pcat" value={editingProduct?.category || ""} onChange={(e) => setEditingProduct({...editingProduct, category: e.target.value})} placeholder="Software, Hardware..." />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="pprice">Base Price (IDR)</Label>
                <div className="relative">
                  <DollarSign className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input 
                    id="pprice" 
                    type="number" 
                    className="pl-8"
                    value={editingProduct?.price || 0} 
                    onChange={(e) => setEditingProduct({...editingProduct, price: parseFloat(e.target.value)})} 
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="pqty">Initial Stock / Quantity</Label>
                <Input 
                  id="pqty" 
                  type="number" 
                  value={editingProduct?.quantity || 0} 
                  onChange={(e) => setEditingProduct({...editingProduct, quantity: parseInt(e.target.value)})} 
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 border-t pt-4">
              <div className="space-y-2">
                <Label htmlFor="prebate">Standard Rebate (%)</Label>
                <Input 
                  id="prebate" 
                  type="number" 
                  step="0.1"
                  value={editingProduct?.rebate || 0} 
                  onChange={(e) => setEditingProduct({...editingProduct, rebate: parseFloat(e.target.value)})} 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pmargin">Target Margin (%)</Label>
                <Input 
                  id="pmargin" 
                  type="number" 
                  step="0.1"
                  value={editingProduct?.margin || 0} 
                  onChange={(e) => setEditingProduct({...editingProduct, margin: parseFloat(e.target.value)})} 
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveProduct}>Save Product</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
