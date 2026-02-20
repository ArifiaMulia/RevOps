// @ts-nocheck
import { Link } from "wouter";
import { cn } from "@/lib/utils";
import { useLocation } from "wouter";
import { 
  LayoutDashboard, 
  Users, 
  Activity, 
  Settings, 
  Bell, 
  Search,
  PieChart,
  Briefcase,
  Menu,
  X,
  History,
  Layers,
  LogOut,
  FileText,
  ChevronLeft,
  ChevronRight,
  User as UserIcon,
  Info,
  AlertTriangle,
  CheckCircle,
  XCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import larkIcon from "@/assets/lark_icon.png";
import { useAuth, PERMISSIONS } from "@/contexts/AuthContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from "@/components/ui/popover";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { notificationService, type Notification } from "@/lib/notification-service";
import { formatDistanceToNow } from "date-fns";
import ErrorBoundary from "./ErrorBoundary";

export default function Layout({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const { user, logout, hasPermission } = useAuth();

  useEffect(() => {
    setNotifications(notificationService.getAll());
    
    // Simulate real-time check
    const interval = setInterval(() => {
      setNotifications(notificationService.getAll());
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleMarkAllRead = () => {
    notificationService.markAllAsRead();
    setNotifications(notificationService.getAll());
    toast.success("All notifications marked as read");
  };

  const getNotifIcon = (type: Notification["type"]) => {
    switch (type) {
      case "info": return <Info className="w-4 h-4 text-blue-500" />;
      case "warning": return <AlertTriangle className="w-4 h-4 text-amber-500" />;
      case "success": return <CheckCircle className="w-4 h-4 text-emerald-500" />;
      case "error": return <XCircle className="w-4 h-4 text-rose-500" />;
    }
  };

  const allNavItems = [
    { 
      label: "Dashboard", 
      icon: LayoutDashboard, 
      href: "/", 
      permission: "DASHBOARD" as keyof typeof PERMISSIONS 
    },
    { 
      label: "Client 360", 
      icon: Users, 
      href: "/client-360",
      permission: "CLIENT_360" as keyof typeof PERMISSIONS
    },
    { 
      label: "Workload & Tasks", 
      icon: Activity, 
      href: "/workload",
      permission: "WORKLOAD" as keyof typeof PERMISSIONS
    },
    { 
      label: "Product Master", 
      icon: Layers, 
      href: "/product-master",
      permission: "PRODUCT_MASTER" as keyof typeof PERMISSIONS
    },
    { 
      label: "Product Dashboard", 
      icon: PieChart, 
      href: "/product-dashboard",
      permission: "PRODUCT_DASHBOARD" as keyof typeof PERMISSIONS
    },
    { 
      label: "Customer Info", 
      icon: PieChart, 
      href: "/customer-info",
      permission: "CUSTOMER_INFO" as keyof typeof PERMISSIONS
    },
    { 
      label: "Tools & Calc", 
      icon: Briefcase, 
      href: "/tools",
      permission: "TOOLS" as keyof typeof PERMISSIONS
    },
    { 
      label: "Change Logs", 
      icon: FileText, 
      href: "/change-logs",
      permission: "ACTIVITY_LOGS" as keyof typeof PERMISSIONS 
    },
    { 
      label: "Audit Logs", 
      icon: History, 
      href: "/activity-logs",
      permission: "ACTIVITY_LOGS" as keyof typeof PERMISSIONS
    },
    { 
      label: "Settings", 
      icon: Settings, 
      href: "/settings",
      permission: "SETTINGS" as keyof typeof PERMISSIONS
    },
  ];

  const navItems = allNavItems.filter(item => {
    try {
      return hasPermission(item.permission, "view");
    } catch (e) {
      console.error("Permission check failed for", item.label, e);
      return false;
    }
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    const match = navItems.find(item => item.label.toLowerCase().includes(searchQuery.toLowerCase()));
    if (match) {
      setLocation(match.href);
      toast.info(`Navigated to ${match.label}`);
    } else {
      toast.error(`No results found for "${searchQuery}"`);
    }
    setSearchQuery("");
  };

  return (
    <div className="min-h-screen bg-background flex">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={cn(
        "fixed lg:sticky top-0 left-0 z-50 h-screen bg-card border-r border-border flex flex-col transition-all duration-300 ease-in-out lg:translate-x-0",
        sidebarOpen ? "translate-x-0 w-64" : "-translate-x-full lg:translate-x-0",
        isCollapsed ? "lg:w-20" : "lg:w-64"
      )}>
        <div className={cn("p-6 flex items-center gap-3 border-b border-border h-16 shrink-0", isCollapsed && "px-4 justify-center")}>
          <img src={larkIcon} alt="Lark" className="w-8 h-8 object-contain shrink-0" />
          {!isCollapsed && (
            <div className="overflow-hidden whitespace-nowrap transition-all">
              <h1 className="font-bold text-lg leading-tight">RevOps Hub</h1>
              <p className="text-xs text-muted-foreground">{user?.role === 'admin' ? 'Administrator' : 'Prasetia ICT'}</p>
            </div>
          )}
          <Button variant="ghost" size="icon" className="ml-auto lg:hidden" onClick={() => setSidebarOpen(false)}><X className="w-5 h-5" /></Button>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto overflow-x-hidden scrollbar-none">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <Button
                variant={location === item.href ? "secondary" : "ghost"}
                className={cn(
                  "w-full mb-1 transition-all duration-200",
                  isCollapsed ? "justify-center px-2" : "justify-start gap-3",
                  location === item.href && "bg-primary/10 text-primary"
                )}
                title={isCollapsed ? item.label : ""}
              >
                <item.icon className="w-5 h-5 shrink-0" />
                {!isCollapsed && <span className="truncate">{item.label}</span>}
              </Button>
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-border shrink-0">
          {!isCollapsed ? (
            <div className="bg-muted/50 rounded-lg p-3 relative group">
              <div className="flex items-center justify-between mb-2">
                 <h4 className="text-xs font-semibold uppercase text-muted-foreground">Team Status</h4>
                 <Button variant="ghost" size="icon" className="h-6 w-6 hidden lg:flex" onClick={() => setIsCollapsed(true)}><ChevronLeft className="h-4 w-4" /></Button>
              </div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-2 h-2 rounded-full bg-green-500" /><span className="text-sm">System Normal</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-yellow-500" /><span className="text-sm">Presales High Load</span>
              </div>
              <p className="mt-2 text-[10px] text-muted-foreground font-mono opacity-50 text-right">v2.2-stable</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4">
               <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
               <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setIsCollapsed(false)}><ChevronRight className="h-4 w-4" /></Button>
            </div>
          )}
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <header className="h-16 border-b border-border bg-card/80 backdrop-blur-md sticky top-0 z-30 px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4 flex-1">
            <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setSidebarOpen(true)}><Menu className="w-5 h-5" /></Button>
            <form onSubmit={handleSearch} className="relative w-full max-w-md group">
              <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-muted-foreground" />
              <input 
                type="text" 
                placeholder="Search modules, clients, or tickets..." 
                className="w-full h-9 pl-9 pr-4 rounded-full border border-input bg-background/50 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </form>
          </div>
          
          <div className="flex items-center gap-3 ml-4">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative group">
                  <Bell className="w-5 h-5 transition-transform group-hover:rotate-12" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-medium text-destructive-foreground border-2 border-card">
                      {unreadCount}
                    </span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-0" align="end">
                <div className="flex items-center justify-between p-4 border-b">
                  <h3 className="font-semibold text-sm">Notifications</h3>
                  <Button variant="ghost" size="sm" className="text-[10px] h-7 px-2" onClick={handleMarkAllRead}>Mark all read</Button>
                </div>
                <div className="max-h-[350px] overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-8 text-center text-sm text-muted-foreground">No notifications</div>
                  ) : (
                    notifications.map((n) => (
                      <div 
                        key={n.id} 
                        className={cn(
                          "p-4 border-b last:border-0 hover:bg-muted/50 transition-colors cursor-pointer flex gap-3",
                          !n.read && "bg-primary/5"
                        )}
                        onClick={() => notificationService.markAsRead(n.id)}
                      >
                        <div className="mt-1 shrink-0">{getNotifIcon(n.type)}</div>
                        <div className="space-y-1">
                          <p className={cn("text-xs font-semibold leading-none", !n.read && "text-primary")}>{n.title}</p>
                          <p className="text-[11px] text-muted-foreground leading-snug">{n.message}</p>
                          <p className="text-[9px] text-muted-foreground uppercase">{formatDistanceToNow(new Date(n.timestamp), { addSuffix: true })}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <div className="p-2 border-t text-center">
                  <Button variant="ghost" size="sm" className="w-full text-xs h-8">View all notifications</Button>
                </div>
              </PopoverContent>
            </Popover>
            
            <div className="h-8 w-px bg-border mx-2 hidden sm:block" />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 flex items-center gap-2 px-2 hover:bg-muted/80 rounded-full transition-all">
                  <Avatar className="h-8 w-8 border border-border">
                    <AvatarImage src={user?.avatar} alt={user?.name} />
                    <AvatarFallback className="bg-primary/5 text-primary font-bold">
                      {user?.name?.substring(0, 2).toUpperCase() || "US"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden md:flex flex-col items-start pr-2">
                    <span className="text-xs font-bold leading-none">{user?.name}</span>
                    <span className="text-[10px] text-muted-foreground uppercase tracking-tighter mt-0.5">{user?.role}</span>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-64" align="end" forceMount>
                <DropdownMenuLabel className="font-normal p-4">
                  <div className="flex flex-col space-y-2">
                    <p className="text-sm font-bold leading-none">{user?.name}</p>
                    <p className="text-xs leading-none text-muted-foreground italic">{user?.email}</p>
                    <div className="flex gap-2 mt-2">
                      <Badge variant="secondary" className="text-[9px] px-2 py-0">{user?.role?.toUpperCase()}</Badge>
                      <Badge variant="outline" className="text-[9px] px-2 py-0">{user?.department || "General"}</Badge>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setLocation("/profile")} className="cursor-pointer py-3 px-4">
                  <UserIcon className="mr-3 h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">My Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setLocation("/settings")} className="cursor-pointer py-3 px-4">
                  <Settings className="mr-3 h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Account Settings</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout} className="cursor-pointer py-3 px-4 text-destructive focus:bg-destructive/10 focus:text-destructive">
                  <LogOut className="mr-3 h-4 w-4" /><span className="font-bold">Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <div className="flex-1 p-6 lg:p-8 overflow-y-auto bg-muted/10">
          <div className="max-w-[1600px] mx-auto animate-in fade-in duration-500">
            <ErrorBoundary>
              {children}
            </ErrorBoundary>
          </div>
        </div>
      </main>
    </div>
  );
}
