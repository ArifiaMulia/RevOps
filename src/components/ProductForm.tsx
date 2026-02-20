import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Product } from "@/lib/product-service";
import { useEffect } from "react";

const productSchema = z.object({
  name: z.string().min(2, "Name required"),
  category: z.enum(["SaaS", "Service", "Hardware"]),
  description: z.string().optional(),
  owner: z.string().min(2, "Owner required"),
  status: z.enum(["Active", "Deprecated", "Development"]),
});

type ProductFormValues = z.infer<typeof productSchema>;

interface ProductFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: ProductFormValues) => void;
  initialData?: Product | null;
  mode: "create" | "edit";
}

export function ProductForm({ open, onOpenChange, onSubmit, initialData, mode }: ProductFormProps) {
  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: { name: "", category: "SaaS", description: "", owner: "", status: "Active" }
  });

  useEffect(() => {
    if (initialData && open) {
      // @ts-ignore
      form.reset(initialData);
    } else if (!initialData && open) {
      form.reset({ name: "", category: "SaaS", description: "", owner: "", status: "Active" });
    }
  }, [initialData, open, form]);

  const handleSubmit = (values: ProductFormValues) => {
    // @ts-ignore
    onSubmit(values);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>{mode === "create" ? "Add Product" : "Edit Product"}</DialogTitle></DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField control={form.control} name="name" render={({ field }) => (
              <FormItem><FormLabel>Product Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="category" render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="SaaS">SaaS</SelectItem>
                      <SelectItem value="Service">Service</SelectItem>
                      <SelectItem value="Hardware">Hardware</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="status" render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="Active">Active</SelectItem>
                      <SelectItem value="Development">Development</SelectItem>
                      <SelectItem value="Deprecated">Deprecated</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <FormField control={form.control} name="owner" render={({ field }) => (
              <FormItem><FormLabel>Product Owner</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="description" render={({ field }) => (
              <FormItem><FormLabel>Description</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <DialogFooter><Button type="submit">Save</Button></DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
