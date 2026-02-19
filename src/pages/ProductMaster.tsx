// @ts-nocheck
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Plus, MoreVertical, Edit, Trash2, Package } from "lucide-react";
import { useState, useEffect } from "react";
import { productService, type Product } from "@/lib/product-service";
import { ProductForm } from "@/components/ProductForm";
import { toast } from "sonner";
import { useAuth, PERMISSIONS } from "@/contexts/AuthContext";
import { useLocation } from "wouter";

export default function ProductMaster() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const { hasPermission } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!hasPermission("PRODUCT_MASTER", "view")) {
      toast.error("Access Denied");
      setLocation("/");
    }
  }, [hasPermission, setLocation]);

  const loadProducts = () => setProducts(productService.getAll());
  useEffect(() => loadProducts(), []);

  const handleCreate = (values: any) => {
    productService.create(values);
    loadProducts();
    toast.success("Product created");
    setIsFormOpen(false);
  };

  const handleUpdate = (values: any) => {
    if (selectedProduct) {
      productService.update(selectedProduct.id, values);
      loadProducts();
      toast.success("Product updated");
      setIsFormOpen(false);
    }
  };

  const handleDelete = (id: string) => {
    if (!hasPermission("PRODUCT_MASTER", "manage")) {
      toast.error("Permission Denied");
      return;
    }
    productService.delete(id);
    loadProducts();
    toast.success("Product deleted");
  };

  const openEdit = (product: Product) => {
    if (!hasPermission("PRODUCT_MASTER", "manage")) {
      toast.error("Permission Denied");
      return;
    }
    setSelectedProduct(product);
    setFormMode("edit");
    setIsFormOpen(true);
  };

  if (!hasPermission("PRODUCT_MASTER", "view")) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Master Products</h1>
          <p className="text-muted-foreground">Manage product portfolio and services.</p>
        </div>
        {hasPermission("PRODUCT_MASTER", "manage") && (
          <Button onClick={() => { setSelectedProduct(null); setFormMode("create"); setIsFormOpen(true); }}>
            <Plus className="w-4 h-4 mr-2" /> Add Product
          </Button>
        )}
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Owner</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Description</TableHead>
              {hasPermission("PRODUCT_MASTER", "manage") && <TableHead></TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((p) => (
              <TableRow key={p.id}>
                <TableCell className="font-medium flex items-center gap-2">
                  <Package className="w-4 h-4 text-primary" /> {p.name}
                </TableCell>
                <TableCell>{p.category}</TableCell>
                <TableCell>{p.owner}</TableCell>
                <TableCell>
                  <Badge variant={p.status === "Active" ? "default" : "secondary"}>{p.status}</Badge>
                </TableCell>
                <TableCell className="text-muted-foreground truncate max-w-[200px]">{p.description}</TableCell>
                {hasPermission("PRODUCT_MASTER", "manage") && (
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEdit(p)}>
                          <Edit className="w-4 h-4 mr-2" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDelete(p.id)} className="text-red-600">
                          <Trash2 className="w-4 h-4 mr-2" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <ProductForm 
        open={isFormOpen} 
        onOpenChange={setIsFormOpen} 
        onSubmit={formMode === "create" ? handleCreate : handleUpdate} 
        initialData={selectedProduct} 
        mode={formMode} 
      />
    </div>
  );
}
