import { toast } from "sonner";

export const downloadService = {
  downloadCSV: (data: any[], filename: string) => {
    if (data.length === 0) {
      toast.error("No data to export");
      return;
    }

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(","),
      ...data.map(row => headers.map(header => {
        const val = row[header];
        return typeof val === 'string' ? `"${val.replace(/"/g, '""')}"` : val;
      }).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },

  downloadXLS: (data: any[], filename: string) => {
    if (data.length === 0) {
      toast.error("No data to export");
      return;
    }

    const headers = Object.keys(data[0]);
    const tsvContent = [
      headers.join("\t"),
      ...data.map(row => headers.map(header => row[header]).join("\t"))
    ].join("\n");

    const blob = new Blob([tsvContent], { type: "application/vnd.ms-excel;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `${filename}_${new Date().toISOString().split('T')[0]}.xls`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },

  // Mock PDF download (triggers a text file with .pdf extension or just a blob)
  downloadMockPDF: (title: string, content: string, filename: string) => {
    const formattedContent = `PRIPSETIA REVOPS HUB - OFFICIAL REPORT\n====================================\nTitle: ${title}\nDate: ${new Date().toLocaleString()}\n\n${content}`;
    const blob = new Blob([formattedContent], { type: "text/plain;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `${filename}.pdf`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};
