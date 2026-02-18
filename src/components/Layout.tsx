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
  User as UserIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
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

export default function Layout({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
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
        "fixed lg:sticky top-0 left-0 z-50 h-screen w-64 bg-card border-r border-border flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="p-6 flex items-center gap-3 border-b border-border">
          <img src={larkIcon} alt="Lark" className="w-8 h-8 object-contain" />
          <div>
            <h1 className="font-bold text-lg leading-tight">RevOps Hub</h1>
            <p className="text-xs text-muted-foreground">{user?.role === 'admin' ? 'Administrator' : 'Prasetia ICT'}</p>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            className="ml-auto lg:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <Button
                variant={location === item.href ? "secondary" : "ghost"}
                className={cn(
                  "w-full justify-start gap-3 mb-1",
                  location === item.href && "bg-primary/10 text-primary hover:bg-primary/15"
                )}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </Button>
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-border">
          <div className="bg-muted/50 rounded-lg p-3">
            <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-2">Team Status (v2.1)</h4>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span className="text-sm">System Normal</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-yellow-500" />
              <span className="text-sm">Presales High Load</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b border-border bg-card/50 backdrop-blur sticky top-0 z-30 px-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon" 
              className="lg:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </Button>
            <div className="relative hidden md:block w-64">
              <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-muted-foreground" />
              <input 
                type="text" 
                placeholder="Search clients, tickets..." 
                className="w-full h-9 pl-9 pr-4 rounded-md border border-input bg-background text-sm outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-destructive rounded-full border border-card" />
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user?.avatar} alt={user?.name} />
                    <AvatarFallback>{user?.name?.substring(0, 2).toUpperCase() || "US"}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user?.name}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user?.email}
                    </p>
                    <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary ring-1 ring-inset ring-primary/20 mt-1 w-fit">
                      {user?.role?.toUpperCase()}
                    </span>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setLocation("/profile")}>
                  <UserIcon className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={logout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <div className="flex-1 p-6 lg:p-8 overflow-y-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
