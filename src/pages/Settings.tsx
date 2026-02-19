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
  X
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface UserRecord {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'viewer';
  lastActive: string;
}

const INITIAL_USERS: UserRecord[] = [
  { id: "1", name: "Arifia Mulia", email: "arifia.mulia@prasetia.co.id", role: "admin", lastActive: "Just now" },
  { id: "2", name: "Dedi Setiawan", email: "dedi.s@prasetia.co.id", role: "manager", lastActive: "2 hours ago" },
  { id: "3", name: "Budi Santoso", email: "budi.s@prasetia.co.id", role: "viewer", lastActive: "Yesterday" },
];

const MODULE_PERMISSIONS = [
  { module: "Dashboard", admin: "Full Access", manager: "Full Access", viewer: "View Only" },
  { module: "Client 360", admin: "Full Access", manager: "Edit", viewer: "View Only" },
  { module: "Products", admin: "Full Access", manager: "Edit", viewer: "View Only" },
  { module: "Tools", admin: "Full Access", manager: "Full Access", viewer: "View Only" },
  { module: "Workload", admin: "Full Access", manager: "View Only", viewer: "None" },
  { module: "Settings", admin: "Full Access", manager: "None", viewer: "None" },
];

export default function Settings() {
  const { user } = useAuth();
  const [users, setUsers] = useState<UserRecord[]>(INITIAL_USERS);
  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<Partial<UserRecord> | null>(null);

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
                Add User
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
                        <Badge variant={u.role === 'admin' ? 'default' : 'secondary'}>
                          {u.role.toUpperCase()}
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
            <CardHeader>
              <CardTitle>Role-Based Access Control (RBAC)</CardTitle>
              <CardDescription>Definition of access levels across system modules.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Module</TableHead>
                    <TableHead>Admin</TableHead>
                    <TableHead>Manager</TableHead>
                    <TableHead>Viewer</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {MODULE_PERMISSIONS.map((perm) => (
                    <TableRow key={perm.module}>
                      <TableCell className="font-medium">{perm.module}</TableCell>
                      <TableCell>
                        <Badge className="bg-emerald-500">{perm.admin}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={perm.manager === 'None' ? 'text-red-500 border-red-200' : 'text-blue-500 border-blue-200'}>
                          {perm.manager}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={perm.viewer === 'None' ? 'text-red-500 border-red-200' : 'text-slate-500'}>
                          {perm.viewer}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
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
              <Button className="mt-4">Update Preferences</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

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
              <Label htmlFor="uemail">Email</Label>
              <Input id="uemail" value={editingUser?.email || ""} onChange={(e) => setEditingUser({...editingUser, email: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="urole">System Role</Label>
              <select 
                id="urole" 
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                value={editingUser?.role || "viewer"}
                onChange={(e) => setEditingUser({...editingUser, role: e.target.value as any})}
              >
                <option value="admin">Administrator</option>
                <option value="manager">Manager</option>
                <option value="viewer">Viewer</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleSaveUser}>Save User</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
