
import larkDataJson from "./customer-lark-data.json";

const STORAGE_KEY = "revops-lark-data-v3";

export interface LarkData {
  summary: {
    total_arr: number;
    total_accounts: number;
    total_users?: number;
    kpis?: any;
  };
  top_accounts: any[];
  q4_top?: any[];
  risk_history: any[];
  trends: any[];
  details: any[];
  target_accounts: any[];
  all_records?: any[];
}

export const larkService = {
  getData: (): LarkData => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored || stored === "undefined" || stored === "null") return larkDataJson as LarkData;
      const parsed = JSON.parse(stored);
      // Ensure basic structure exists
      if (!parsed || !parsed.summary || !parsed.details) return larkDataJson as LarkData;
      return parsed;
    } catch (e) {
      return larkDataJson as LarkData;
    }
  },

  updateData: (newData: Partial<LarkData>) => {
    const current = larkService.getData();
    // Deep merge summary if it exists in newData
    const updatedSummary = newData.summary 
      ? { ...current.summary, ...newData.summary }
      : current.summary;
      
    const updated = { 
      ...current, 
      ...newData,
      summary: updatedSummary
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  },

  // Process real data from Excel
  processData: (rows: any[]) => {
    if (!rows || rows.length === 0) return;

    // 1. Process records to ensure consistent field names and date format
    const allRecords = rows.map(r => {
      const dateVal = r.dts_create_time;
      let dateStr = "";
      if (dateVal) {
        const d = new Date(dateVal);
        dateStr = isNaN(d.getTime()) ? String(dateVal).split(' ')[0].replace(/-/g, '/') : d.toISOString().split('T')[0].replace(/-/g, '/');
      }
      
      return {
        ...r,
        account_name: r.account_name || r['Account Name (+link)'] || "Unknown",
        date_str: dateStr,
        "ARR (USD)": parseFloat(r["ARR (USD)"]) || 0,
        "Churn Risk": r["Churn Risk"] || "N/A",
        "% Adoption": parseFloat(r["% Adoption"]) || 0,
        "Duration": parseFloat(r["Duration"]) || 0,
        "total_users": parseInt(r["total_users"]) || 0
      };
    });

    // 2. Identify the latest state for EACH account
    const latestDetailsMap: Record<string, any> = {};
    allRecords.forEach(r => {
      const name = r.account_name;
      if (!latestDetailsMap[name] || r.dts_create_time > latestDetailsMap[name].dts_create_time) {
        latestDetailsMap[name] = r;
      }
    });
    const latestDetails = Object.values(latestDetailsMap);

    // 3. Compute Summary
    const totalArr = latestDetails.reduce((sum, d) => sum + d["ARR (USD)"], 0);
    const totalAccounts = latestDetails.length;
    const totalUsers = latestDetails.reduce((sum, d) => sum + d.total_users, 0);

    // 4. Compute Risk History (timeline)
    const historyMap: Record<string, any> = {};
    allRecords.forEach(r => {
      if (!historyMap[r.date_str]) {
        historyMap[r.date_str] = {
          date_str: r.date_str,
          "High Churn Risk": 0, "Mid Churn Risk": 0, "Low Churn Risk": 0, "N/A": 0, total_arr: 0
        };
      }
      const riskKey = r["Churn Risk"] || "N/A";
      historyMap[r.date_str][riskKey] = (historyMap[r.date_str][riskKey] || 0) + r["ARR (USD)"];
      historyMap[r.date_str].total_arr += r["ARR (USD)"];
    });
    const riskHistory = Object.values(historyMap).sort((a, b) => a.date_str.localeCompare(b.date_str));

    // 5. Compute Trends (Adoption/Duration for top accounts)
    // We take the top 5 accounts by ARR from the latest snapshot
    const topAccountNames = [...latestDetails]
      .sort((a, b) => b["ARR (USD)"] - a["ARR (USD)"])
      .slice(0, 5)
      .map(a => a.account_name);

    const trends = riskHistory.map(h => {
      const dayRecords = allRecords.filter(r => r.date_str === h.date_str);
      const trendPoint: any = { date: h.date_str };
      topAccountNames.forEach(name => {
        const rec = dayRecords.find(r => r.account_name === name);
        trendPoint[`${name}_adoption`] = rec ? rec["% Adoption"] : 0;
        trendPoint[`${name}_duration`] = rec ? rec["Duration"] : 0;
      });
      return trendPoint;
    });

    // 6. Calculate KPIs (WoW)
    const l7d = riskHistory.slice(-7);
    const prevL7d = riskHistory.slice(-14, -7);
    
    const l7dArr = l7d.reduce((sum, d) => sum + d.total_arr, 0) / (l7d.length || 1);
    const prevL7dArr = prevL7d.reduce((sum, d) => sum + d.total_arr, 0) / (prevL7d.length || 1);
    const arrWow = prevL7dArr > 0 ? ((l7dArr - prevL7dArr) / prevL7dArr) * 100 : 0;

    const newData: LarkData = {
      summary: {
        total_arr: totalArr,
        total_accounts: totalAccounts,
        total_users: totalUsers,
        kpis: {
          l7d_arr_avg: l7dArr,
          arr_wow: arrWow,
          l7d_acc_avg: totalAccounts,
          acc_wow: 0,
          l30d_arr_avg: l7dArr, // Simplified
          arr_mom: 0,
          l30d_acc_avg: totalAccounts,
          acc_mom: 0
        }
      },
      top_accounts: latestDetails.sort((a, b) => b["ARR (USD)"] - a["ARR (USD)"]).slice(0, 10),
      q4_top: latestDetails.slice(0, 5), // Mock
      risk_history: riskHistory,
      trends: trends,
      details: latestDetails,
      target_accounts: topAccountNames,
      all_records: allRecords
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
    return newData;
  },

  processUpload: (rowCount: number) => {
    // Legacy support, doesn't do much now
    return larkService.getData();
  },

  resetData: () => {
    localStorage.removeItem(STORAGE_KEY);
    return larkDataJson as LarkData;
  }
};
