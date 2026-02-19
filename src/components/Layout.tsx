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
  ChevronLeft,
  ChevronRight,
  User as UserIcon
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";

export default function Layout({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { user, logout, hasPermission } = useAuth();

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

  // Filter items based on user permissions
  const navItems = allNavItems.filter(item => 
    hasPermission(item.permission, "view")
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    
    // Global search logic: check if query matches any nav item label
    const match = navItems.find(item => 
      item.label.toLowerCase().includes(searchQuery.toLowerCase())
    );

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
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed lg:sticky top-0 left-0 z-50 h-screen bg-card border-r border-border flex flex-col transition-all duration-300 ease-in-out lg:translate-x-0",
        sidebarOpen ? "translate-x-0 w-64" : "-translate-x-full lg:translate-x-0",
        isCollapsed ? "lg:w-20" : "lg:w-64"
      )}>
        <div className={cn(
          "p-6 flex items-center gap-3 border-b border-border h-16 shrink-0",
          isCollapsed && "px-4 justify-center"
        )}>
          <img src={larkIcon} alt="Lark" className="w-8 h-8 object-contain shrink-0" />
          {!isCollapsed && (
            <div className="overflow-hidden whitespace-nowrap transition-all">
              <h1 className="font-bold text-lg leading-tight">RevOps Hub</h1>
              <p className="text-xs text-muted-foreground">{user?.role === 'admin' ? 'Administrator' : 'Prasetia ICT'}</p>
            </div>
          )}
          <Button 
            variant="ghost" 
            size="icon" 
            className="ml-auto lg:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto overflow-x-hidden scrollbar-none">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <Button
                variant={location === item.href ? "secondary" : "ghost"}
                className={cn(
                  "w-full mb-1 transition-all duration-200",
                  isCollapsed ? "justify-center px-2" : "justify-start gap-3",
                  location === item.href && "bg-primary/10 text-primary hover:bg-primary/15"
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
                 <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-6 w-6 hidden lg:flex" 
                    onClick={() => setIsCollapsed(true)}
                 >
                    <ChevronLeft className="h-4 w-4" />
                 </Button>
              </div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <span className="text-sm">System Normal</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-yellow-500" />
                <span className="text-sm">Presales High Load</span>
              </div>
              <p className="mt-2 text-[10px] text-muted-foreground font-mono opacity-50 text-right">v2.2-stable</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4">
               <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
               <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8" 
                  onClick={() => setIsCollapsed(false)}
               >
                  <ChevronRight className="h-4 w-4" />
               </Button>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <header className="h-16 border-b border-border bg-card/80 backdrop-blur-md sticky top-0 z-30 px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4 flex-1">
            <Button 
              variant="ghost" 
              size="icon" 
              className="lg:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </Button>
            
            <form onSubmit={handleSearch} className="relative w-full max-w-md group">
              <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <input 
                type="text" 
                placeholder="Search modules, clients, or tickets..." 
                className="w-full h-9 pl-9 pr-4 rounded-full border border-input bg-background/50 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <kbd className="absolute right-3 top-2 pointer-events-none hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                <span className="text-xs">↵</span>
              </kbd>
            </form>
          </div>
          
          <div className="flex items-center gap-3 ml-4">
            <Button variant="ghost" size="icon" className="relative group">
              <Bell className="w-5 h-5 transition-transform group-hover:rotate-12" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-destructive rounded-full border-2 border-card" />
            </Button>
            
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
                    <p className="text-xs leading-none text-muted-foreground italic">
                      {user?.email}
                    </p>
                    <div className="flex gap-2 mt-2">
                      <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-semibold text-primary ring-1 ring-inset ring-primary/20">
                        {user?.role?.toUpperCase()}
                      </span>
                      <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-[10px] font-semibold text-muted-foreground border border-border">
                        {user?.department || "General"}
                      </span>
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
                  <LogOut className="mr-3 h-4 w-4" />
                  <span className="font-bold">Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <div className="flex-1 p-6 lg:p-8 overflow-y-auto bg-muted/10">
          <div className="max-w-[1600px] mx-auto animate-in fade-in duration-500">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
