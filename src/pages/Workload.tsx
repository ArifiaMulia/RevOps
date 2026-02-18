import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Clock, CheckCircle2, Plus, MoreVertical, Trash2, Edit } from "lucide-react";
import { useState, useEffect } from "react";
import { workloadService, type TeamMember } from "@/lib/workload-service";
import { MemberForm } from "@/components/MemberForm";
import { toast } from "sonner";

export default function Workload() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);

  const loadMembers = () => {
    setMembers(workloadService.getMembers());
  };

  useEffect(() => {
    loadMembers();
  }, []);

  const handleCreate = (values: any) => {
    workloadService.createMember(values);
    loadMembers();
    toast.success("Team member added");
  };

  const handleUpdate = (values: any) => {
    if (selectedMember) {
      workloadService.updateMember(selectedMember.id, values);
      loadMembers();
      toast.success("Member updated");
    }
  };

  const handleDelete = (id: string) => {
    workloadService.deleteMember(id);
    loadMembers();
    toast.success("Member deleted");
  };

  const openEdit = (member: TeamMember) => {
    setSelectedMember(member);
    setFormMode("edit");
    setIsFormOpen(true);
  };

  const openCreate = () => {
    setSelectedMember(null);
    setFormMode("create");
    setIsFormOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Team Workload</h1>
          <p className="text-muted-foreground">Monitor capacity, tasks, and overdue items.</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={openCreate} size="sm"><Plus className="w-4 h-4 mr-2" /> Add Member</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Summary Cards */}
        <Card className="bg-orange-50 border-orange-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-orange-700">Presales Capacity</CardTitle>
            <Clock className="h-4 w-4 text-orange-700" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-800">142%</div>
            <Progress value={100} className="h-2 mt-2 bg-orange-200 [&>div]:bg-orange-600" />
            <p className="text-xs text-orange-600 mt-1">2 members handling 9 FTE load</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">AfterSales Load</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">65%</div>
            <Progress value={65} className="h-2 mt-2" />
            <p className="text-xs text-muted-foreground mt-1">Stable capacity</p>
          </CardContent>
        </Card>
        {/* More cards... */}
      </div>

      <Tabs defaultValue="members">
        <TabsList>
          <TabsTrigger value="members">By Member</TabsTrigger>
          <TabsTrigger value="tasks">Task List</TabsTrigger>
        </TabsList>
        
        <TabsContent value="members" className="space-y-4">
          <div className="grid gap-4">
            {members.map((member) => (
              <Card key={member.id}>
                <div className="p-4 flex items-center gap-4">
                  <Avatar>
                    <AvatarImage src={`https://ui-avatars.com/api/?name=${member.name}&background=random`} />
                    <AvatarFallback>{member.name.substring(0,2)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h4 className="font-semibold">{member.name}</h4>
                    <p className="text-sm text-muted-foreground">{member.role} • {member.team}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1 w-32">
                    <span className="text-sm font-medium">{member.load}% Load</span>
                    <Progress 
                      value={Math.min(member.load, 100)} 
                      className={`h-2 w-full ${member.status === "Critical" ? "[&>div]:bg-red-500" : member.status === "Warning" ? "[&>div]:bg-yellow-500" : "[&>div]:bg-green-500"}`} 
                    />
                  </div>
                  <Badge variant={member.status === "Critical" ? "destructive" : "secondary"}>
                    {member.status}
                  </Badge>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon"><MoreVertical className="w-4 h-4" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openEdit(member)}><Edit className="w-4 h-4 mr-2" /> Edit</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDelete(member.id)} className="text-red-600"><Trash2 className="w-4 h-4 mr-2" /> Delete</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="tasks">
          <Card className="p-8 text-center text-muted-foreground">
            Task list view coming in Phase 2
          </Card>
        </TabsContent>
      </Tabs>

      <MemberForm 
        open={isFormOpen} 
        onOpenChange={setIsFormOpen} 
        onSubmit={formMode === "create" ? handleCreate : handleUpdate} 
        initialData={selectedMember} 
        mode={formMode} 
      />
    </div>
  );
}
