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

    // Simulate file processing
    toast.promise(
      new Promise((resolve) => setTimeout(resolve, 2000)),
      {
        loading: 'Processing Excel data...',
        success: () => {
          const newEntry = changeLogService.add({
            filename: file.name,
            uploadedBy: "Arifia Mulia",
            rowCount: Math.floor(Math.random() * 500) + 100
          });
          
          // Process Lark data update
          larkService.processUpload(newEntry.rowCount);
          
          setLogs(changeLogService.getAll());
          return `Successfully uploaded ${file.name} and updated dashboard.`;
        },
        error: 'Failed to process file'
      }
    );

    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDownload = (log: ChangeLogEntry) => {
    toast.success(`Downloading ${log.filename}...`);
    // Logic to download the file (mocking)
    const blob = new Blob(["Mock Excel content"], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const url = URL.createObjectURL(blob);
    const link = document.body.appendChild(document.createElement("a"));
    link.href = url;
    link.download = `updated_${log.filename}`;
    link.click();
    document.body.removeChild(link);
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
