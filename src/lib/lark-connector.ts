import axios from "axios";
import { toast } from "sonner";

// Keys for localStorage
export const LARK_CONFIG_KEY = "prasetia-lark-config";

export interface LarkConfig {
  appId: string;
  appSecret: string;
  baseToken: string;
  tableId: string;
}

export const getLarkConfig = (): LarkConfig | null => {
  const stored = localStorage.getItem(LARK_CONFIG_KEY);
  return stored ? JSON.parse(stored) : null;
};

export const saveLarkConfig = (config: LarkConfig) => {
  localStorage.setItem(LARK_CONFIG_KEY, JSON.stringify(config));
};

// Mock data to simulate Lark response when API is not reachable (CORS/Auth)
const MOCK_DATA = {
  arr: 645992,
  accounts: 97,
  users: 6351,
  churn_distribution: [
    { date: "26/05/2025", high: 30, mid: 30, low: 40 },
    { date: "20/06/2025", high: 35, mid: 25, low: 40 },
    { date: "27/06/2025", high: 40, mid: 20, low: 40 },
    { date: "11/07/2025", high: 38, mid: 22, low: 40 },
    { date: "19/07/2025", high: 35, mid: 25, low: 40 },
    { date: "25/07/2025", high: 34, mid: 26, low: 40 },
    { date: "01/08/2025", high: 33, mid: 27, low: 40 },
    { date: "05/08/2025", high: 30, mid: 30, low: 40 },
    { date: "09/08/2025", high: 25, mid: 35, low: 40 },
    { date: "11/08/2025", high: 20, mid: 40, low: 40 },
    { date: "20/08/2025", high: 22, mid: 38, low: 40 },
  ]
};

/**
 * Lark Service Connector
 * Note: Direct browser-to-Lark API calls usually fail due to CORS.
 * In a real production environment, this should route through a backend proxy.
 * For this prototype, we attempt the call but fallback to mock data if it fails.
 */
export const fetchLarkData = async () => {
  const config = getLarkConfig();
  
  if (!config?.appId || !config?.appSecret) {
    console.warn("Lark config missing, using mock data");
    return { ...MOCK_DATA, source: "mock" };
  }

  try {
    // 1. Get Tenant Access Token (Proxy required for CORS)
    // const tokenRes = await axios.post("/api/lark/auth", { ... });
    
    // Simulating API call delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Throwing error to trigger fallback since we don't have a real proxy
    throw new Error("CORS Proxy not configured");
    
  } catch (error) {
    console.log("Falling back to mock data due to connection limits:", error);
    toast.info("Using simulation data (Connect a proxy to fetch real Lark data)");
    return { ...MOCK_DATA, source: "mock" };
  }
};
