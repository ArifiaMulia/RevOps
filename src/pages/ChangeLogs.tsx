// @ts-nocheck
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { 
  FileUp, 
  Download, 
  Trash2, 
  History, 
  FileText,
  CheckCircle2,
  Clock,
  AlertCircle
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { changeLogService, type ChangeLogEntry } from "@/lib/change-log-service";
import { larkService } from "@/lib/lark-service";
import { toast } from "sonner";
import * as XLSX from "xlsx";

export default function ChangeLogs() {
  const [logs, setLogs] = useState<ChangeLogEntry[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setLogs(changeLogService.getAll());
  }, []);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      toast.error("Please upload an Excel file (.xlsx or .xls)");
      return;
    }

    // Real file processing with XLSX
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array', cellDates: true });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        toast.promise(
          new Promise((resolve) => {
            // Process the data in background
            setTimeout(() => {
              larkService.processData(jsonData);
              resolve(true);
            }, 500);
          }),
          {
            loading: 'Parsing and updating dashboard...',
            success: () => {
              const newEntry = changeLogService.add({
                filename: file.name,
                uploadedBy: "Arifia Mulia",
                rowCount: jsonData.length
              });
              
              setLogs(changeLogService.getAll());
              return `Successfully synced ${jsonData.length} records to dashboard.`;
            },
            error: 'Failed to process Excel data'
          }
        );
      } catch (err) {
        console.error(err);
        toast.error("Error reading Excel file. Please ensure it's a valid .xlsx file.");
      }
    };
    reader.readAsArrayBuffer(file);

    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDownload = (log: ChangeLogEntry) => {
    toast.info(`Preparing ${log.filename} for download...`);
    
    try {
      const dashboardData = larkService.getData();
      // We export the snapshot data (details) as an Excel file
      const worksheet = XLSX.utils.json_to_sheet(dashboardData.details);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Dashboard Snapshot");
      
      // Generate buffer
      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([excelBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      
      const url = URL.createObjectURL(blob);
      const link = document.body.appendChild(document.createElement("a"));
      link.href = url;
      link.download = `exported_${log.filename}`;
      link.click();
      
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success("Download started successfully");
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate Excel file");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Completed": return <Badge className="bg-emerald-500"><CheckCircle2 className="w-3 h-3 mr-1" /> Completed</Badge>;
      case "Pending": return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" /> Pending</Badge>;
      case "Error": return <Badge variant="destructive"><AlertCircle className="w-3 h-3 mr-1" /> Error</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">System Change Logs</h1>
          <p className="text-muted-foreground">Upload and manage Excel change logs for bulk updates.</p>
        </div>
        <div className="flex gap-2">
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleUpload} 
            accept=".xlsx,.xls" 
            className="hidden" 
          />
          <Button onClick={() => fileInputRef.current?.click()}>
            <FileUp className="w-4 h-4 mr-2" /> Upload Change Log
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
         <Card>
            <CardHeader className="pb-2">
               <CardTitle className="text-sm font-medium">Total Uploads</CardTitle>
            </CardHeader>
            <CardContent>
               <div className="text-2xl font-bold">{logs.length}</div>
            </CardContent>
         </Card>
         <Card>
            <CardHeader className="pb-2">
               <CardTitle className="text-sm font-medium">Last Sync</CardTitle>
            </CardHeader>
            <CardContent>
               <div className="text-sm font-medium">
                  {logs.length > 0 ? new Date(logs[0].uploadedAt).toLocaleString() : 'N/A'}
               </div>
            </CardContent>
         </Card>
         <Card>
            <CardHeader className="pb-2">
               <CardTitle className="text-sm font-medium">Status</CardTitle>
            </CardHeader>
            <CardContent>
               <div className="flex items-center gap-2 text-emerald-600 font-bold">
                  <CheckCircle2 className="w-4 h-4" /> System Ready
               </div>
            </CardContent>
         </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Upload History</CardTitle>
          <CardDescription>Track all Excel file imports and their results.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Filename</TableHead>
                <TableHead>Uploaded At</TableHead>
                <TableHead>By</TableHead>
                <TableHead>Records</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10 text-muted-foreground italic">
                    No change logs uploaded yet.
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="font-medium">
                       <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-emerald-600" />
                          {log.filename}
                       </div>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(log.uploadedAt).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-sm">{log.uploadedBy}</TableCell>
                    <TableCell>{log.rowCount}</TableCell>
                    <TableCell>{getStatusBadge(log.status)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleDownload(log)} title="Download file">
                          <Download className="w-4 h-4" />
                        </Button>
                        <Button 
                           variant="ghost" 
                           size="icon" 
                           className="text-red-500 hover:text-red-600 hover:bg-red-50"
                           onClick={() => { changeLogService.delete(log.id); setLogs(changeLogService.getAll()); }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
