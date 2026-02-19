// @ts-nocheck
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ShieldCheck, 
  Users, 
  Settings as SettingsIcon, 
  Lock, 
  Edit2, 
  Trash2,
  Check,
  X,
  Plus,
  UserPlus,
  Save
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { roleService, type Role, type PermissionLevel } from "@/lib/role-service";
import { toast } from "sonner";

interface UserRecord {
  id: string;
  name: string;
  email: string;
  role: string;
  lastActive: string;
}

const INITIAL_USERS: UserRecord[] = [
  { id: "1", name: "Arifia Mulia", email: "arifia.mulia@prasetia.co.id", role: "admin", lastActive: "Just now" },
  { id: "2", name: "Dedi Setiawan", email: "dedi.s@prasetia.co.id", role: "manager", lastActive: "2 hours ago" },
  { id: "3", name: "Budi Santoso", email: "budi.s@prasetia.co.id", role: "viewer", lastActive: "Yesterday" },
];

const MODULES = [
  "Dashboard",
  "Client 360",
  "Products",
  "Tools",
  "Workload",
  "Settings",
  "Activity Logs"
];

const PERMISSION_LEVELS: PermissionLevel[] = ['Full Access', 'Edit', 'View Only', 'None'];

export default function Settings() {
  const { user } = useAuth();
  const [users, setUsers] = useState<UserRecord[]>(INITIAL_USERS);
  const [roles, setRoles] = useState<Role[]>([]);
  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false);
  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<Partial<UserRecord> | null>(null);
  const [newRoleName, setNewRoleName] = useState("");

  useEffect(() => {
    setRoles(roleService.getAll());
  }, []);

  const handleSaveUser = () => {
    if (editingUser?.id) {
      setUsers(users.map(u => u.id === editingUser.id ? { ...u, ...editingUser } as UserRecord : u));
      toast.success("User updated");
    } else {
      const newUser = {
        ...editingUser,
        id: Math.random().toString(36).substr(2, 9),
        lastActive: "Never"
      } as UserRecord;
      setUsers([...users, newUser]);
      toast.success("User added successfully");
    }
    setIsUserDialogOpen(false);
  };

  const handleAddRole = () => {
    if (!newRoleName) return;
    roleService.add(newRoleName);
    setRoles(roleService.getAll());
    setNewRoleName("");
    setIsRoleDialogOpen(false);
    toast.success(`Role "${newRoleName}" created`);
  };

  const togglePermission = (roleId: string, module: string) => {
    const role = roles.find(r => r.id === roleId);
    if (!role) return;
    
    const current = role.permissions[module] || 'None';
    const currentIndex = PERMISSION_LEVELS.indexOf(current);
    const nextIndex = (currentIndex + 1) % PERMISSION_LEVELS.length;
    const next = PERMISSION_LEVELS[nextIndex];
    
    roleService.updatePermission(roleId, module, next);
    setRoles(roleService.getAll());
  };

  const getBadgeVariant = (level: PermissionLevel) => {
    switch (level) {
      case 'Full Access': return 'bg-emerald-500 text-white hover:bg-emerald-600';
      case 'Edit': return 'bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-200';
      case 'View Only': return 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200';
      case 'None': return 'bg-red-50 text-red-600 border-red-100 hover:bg-red-100';
      default: return 'outline';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">System Settings</h1>
        <p className="text-muted-foreground">Manage user permissions, security, and application preferences.</p>
      </div>

      <Tabs defaultValue="users" className="space-y-4">
        <TabsList>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="w-4 h-4" /> User Management
          </TabsTrigger>
          <TabsTrigger value="rbac" className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4" /> Role Permissions
          </TabsTrigger>
          <TabsTrigger value="general" className="flex items-center gap-2">
            <SettingsIcon className="w-4 h-4" /> Preferences
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="space-y-1">
                <CardTitle>Platform Users</CardTitle>
                <CardDescription>Control who has access to the RevOps Hub.</CardDescription>
              </div>
              <Button size="sm" onClick={() => { setEditingUser({ role: 'viewer' }); setIsUserDialogOpen(true); }}>
                <UserPlus className="w-4 h-4 mr-2" /> Add User / Admin
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Last Active</TableHead>
                    <TableHead className="w-[100px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium">{u.name}</TableCell>
                      <TableCell className="text-sm">{u.email}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {u.role}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{u.lastActive}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="icon" onClick={() => { setEditingUser(u); setIsUserDialogOpen(true); }}>
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="text-red-500" onClick={() => setUsers(users.filter(x => x.id !== u.id))}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rbac">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="space-y-1">
                <CardTitle>Role-Based Access Control (RBAC)</CardTitle>
                <CardDescription>Click badges to toggle permission levels for each role.</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={() => setIsRoleDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" /> Create New Role
              </Button>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[200px]">Module</TableHead>
                      {roles.map(role => (
                        <TableHead key={role.id} className="text-center min-w-[120px]">
                          <div className="flex flex-col items-center gap-1">
                            <span className="capitalize">{role.name}</span>
                            {role.id !== 'admin' && (
                              <Button variant="ghost" size="icon" className="h-4 w-4 text-red-400 hover:text-red-600" onClick={() => {
                                roleService.delete(role.id);
                                setRoles(roleService.getAll());
                              }}>
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {MODULES.map((module) => (
                      <TableRow key={module}>
                        <TableCell className="font-medium">{module}</TableCell>
                        {roles.map(role => {
                          const level = role.permissions[module] || 'None';
                          return (
                            <TableCell key={`${role.id}-${module}`} className="text-center">
                              <Badge 
                                variant="outline" 
                                className={`cursor-pointer transition-all ${getBadgeVariant(level)}`}
                                onClick={() => togglePermission(role.id, module)}
                              >
                                {level}
                              </Badge>
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>System Preferences</CardTitle>
              <CardDescription>Configure branding and notification defaults.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label>Organization Name</Label>
                <Input defaultValue="Prasetia Dwidharma Group" />
              </div>
              <div className="grid gap-2">
                <Label>Currency Format</Label>
                <Badge variant="outline" className="w-fit">IDR (Indonesian Rupiah)</Badge>
              </div>
              <div className="grid gap-2">
                <Label>Default Tax Rate (%)</Label>
                <Input type="number" defaultValue="11" />
              </div>
              <Button className="mt-4">
                <Save className="w-4 h-4 mr-2" /> Update Preferences
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* User Dialog */}
      <Dialog open={isUserDialogOpen} onOpenChange={setIsUserDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>{editingUser?.id ? "Edit User Account" : "Add Platform User"}</DialogTitle>
            <DialogDescription>Assign roles and verify email addresses.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="uname">Full Name</Label>
              <Input id="uname" value={editingUser?.name || ""} onChange={(e) => setEditingUser({...editingUser, name: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="uemail">Email Address</Label>
              <Input id="uemail" value={editingUser?.email || ""} onChange={(e) => setEditingUser({...editingUser, email: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="urole">System Role</Label>
              <select 
                id="urole" 
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                value={editingUser?.role || "viewer"}
                onChange={(e) => setEditingUser({...editingUser, role: e.target.value})}
              >
                {roles.map(r => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsUserDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveUser}>Save User</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Role Dialog */}
      <Dialog open={isRoleDialogOpen} onOpenChange={setIsRoleDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Create New Role</DialogTitle>
            <DialogDescription>Define a new role category. You can set permissions in the matrix afterward.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="rname">Role Name</Label>
              <Input id="rname" value={newRoleName} onChange={(e) => setNewRoleName(e.target.value)} placeholder="e.g. Finance Admin" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRoleDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleAddRole}>Create Role</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
