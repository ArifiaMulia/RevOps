import { nanoid } from "nanoid";
import { activityLogService } from "./activity-log-service";

export interface Product {
  id: string;
  name: string;
  category: "SaaS" | "Service" | "Hardware";
  description: string;
  owner: string; // Product Manager
  status: "Active" | "Deprecated" | "Development";
}

const PRODUCT_KEY = "prasetia-products";

const DEFAULT_PRODUCTS: Product[] = [
  { id: "P001", name: "Lark Suite", category: "SaaS", description: "All-in-one collaboration platform", owner: "Budi", status: "Active" },
  { id: "P002", name: "Netsuite ERP", category: "SaaS", description: "Cloud ERP System", owner: "Sarah", status: "Active" },
  { id: "P003", name: "SealSuite", category: "SaaS", description: "Zero Trust Security", owner: "Andi", status: "Active" },
  { id: "P004", name: "Jedox", category: "SaaS", description: "EPM & Planning", owner: "Dewi", status: "Active" },
  { id: "P005", name: "RevOps Consulting", category: "Service", description: "Process Optimization", owner: "Arifia", status: "Active" },
];

export const productService = {
  getAll: (): Product[] => {
    const stored = localStorage.getItem(PRODUCT_KEY);
    if (!stored) {
      localStorage.setItem(PRODUCT_KEY, JSON.stringify(DEFAULT_PRODUCTS));
      return DEFAULT_PRODUCTS;
    }
    try {
      if (!stored || stored === "undefined" || stored === "null") return DEFAULT_PRODUCTS;
      return JSON.parse(stored);
    } catch (e) {
      return DEFAULT_PRODUCTS;
    }
  },

  create: (item: Omit<Product, "id">) => {
    const all = productService.getAll();
    const newItem = { ...item, id: nanoid() };
    localStorage.setItem(PRODUCT_KEY, JSON.stringify([newItem, ...all]));
    activityLogService.log("create", "product", newItem.id, `Created product ${newItem.name}`, null, newItem);
    return newItem;
  },

  update: (id: string, updates: Partial<Product>) => {
    const all = productService.getAll();
    const idx = all.findIndex(p => p.id === id);
    if (idx === -1) return null;
    const oldData = { ...all[idx] };
    const newData = { ...oldData, ...updates };
    all[idx] = newData;
    localStorage.setItem(PRODUCT_KEY, JSON.stringify(all));
    activityLogService.log("update", "product", id, `Updated product ${newData.name}`, oldData, newData);
    return newData;
  },

  delete: (id: string) => {
    const all = productService.getAll();
    const deleted = all.find(p => p.id === id);
    if (deleted) {
      const updated = all.filter(p => p.id !== id);
      localStorage.setItem(PRODUCT_KEY, JSON.stringify(updated));
      activityLogService.log("delete", "product", id, `Deleted product ${deleted.name}`, deleted, null);
    }
  },
  
  forceSet: (data: Product[]) => localStorage.setItem(PRODUCT_KEY, JSON.stringify(data))
};
