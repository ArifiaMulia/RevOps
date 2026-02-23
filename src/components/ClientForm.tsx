// @ts-nocheck
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Client } from "@/lib/client-service";
import { useEffect } from "react";

const clientSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  industry: z.string().min(2, "Industry is required"),
  licenses: z.coerce.number().min(1, "Must have at least 1 license"),
  arr: z.string().min(1, "ARR is required"),
  renewal: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format: YYYY-MM-DD"),
  health: z.coerce.number().min(0).max(100),
  status: z.enum(["Healthy", "At Risk", "Warning", "Watch", "Churned"]),
});

type ClientFormValues = z.infer<typeof clientSchema>;

interface ClientFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: ClientFormValues) => void;
  initialData?: Client | null;
  mode: "create" | "edit";
}

export function ClientForm({ open, onOpenChange, onSubmit, initialData, mode }: ClientFormProps) {
  const form = useForm<ClientFormValues>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      name: "",
      industry: "",
      licenses: 0,
      arr: "$0",
      renewal: new Date().toISOString().split('T')[0],
      health: 100,
      status: "Healthy",
    },
  });

  useEffect(() => {
    if (initialData && open) {
      form.reset(initialData);
    } else if (!initialData && open) {
      form.reset({
        name: "",
        industry: "",
        licenses: 0,
        arr: "$0",
        renewal: new Date().toISOString().split('T')[0],
        health: 100,
        status: "Healthy",
      });
    }
  }, [initialData, open, form]);

  const handleSubmit = (values: ClientFormValues) => {
    onSubmit(values);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "Add New Client" : "Edit Client"}</DialogTitle>
          <DialogDescription>
            {mode === "create" ? "Enter the details of the new client." : "Update client information."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Company Name</FormLabel>
                  <FormControl>
                    <Input placeholder="PT Prasetia..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="industry"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Industry</FormLabel>
                    <FormControl>
                      <Input placeholder="Tech, Logistics..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Healthy">Healthy</SelectItem>
                        <SelectItem value="Warning">Warning</SelectItem>
                        <SelectItem value="At Risk">At Risk</SelectItem>
                        <SelectItem value="Watch">Watch</SelectItem>
                        <SelectItem value="Churned">Churned</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="licenses"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Licenses</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="arr"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ARR</FormLabel>
                    <FormControl>
                      <Input placeholder="$12,000" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="renewal"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Renewal Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="health"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Health Score (0-100)</FormLabel>
                    <FormControl>
                      <Input type="number" min={0} max={100} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button type="submit">{mode === "create" ? "Add Client" : "Save Changes"}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
