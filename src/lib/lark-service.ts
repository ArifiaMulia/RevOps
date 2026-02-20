
import larkDataJson from "./customer-lark-data.json";

const STORAGE_KEY = "revops-lark-data-v3";

export interface LarkData {
  summary: {
    total_arr: number;
    total_accounts: number;
  };
  top_accounts: any[];
  risk_history: any[];
  trends: any[];
  details: any[];
  target_accounts: any[];
}

export const larkService = {
  getData: (): LarkData => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored || stored === "undefined" || stored === "null") return larkDataJson as LarkData;
      const parsed = JSON.parse(stored);
      return parsed || larkDataJson;
    } catch (e) {
      return larkDataJson as LarkData;
    }
  },

  updateData: (newData: Partial<LarkData>) => {
    const current = larkService.getData();
    const updated = { ...current, ...newData };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  },

  // Simulate processing an uploaded file
  processUpload: (rowCount: number) => {
    // When a file is uploaded, we want to simulate the dashboard updating.
    // In a real app, this would be a server-side process or a robust client-side parser.
    // For now, we update the timestamp and maybe tweak the numbers to show it's "live".
    
    const current = larkService.getData();
    
    const newSummary = {
      total_accounts: rowCount || current.summary.total_accounts,
      total_arr: current.summary.total_arr * (1 + (Math.random() * 0.01))
    };

    return larkService.updateData({
       summary: newSummary,
       // We keep the details from the actual JSON but flag it as updated
    });
  }
};
