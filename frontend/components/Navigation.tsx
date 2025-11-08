"use client";

import { useRouter, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Home,
  Store,
  Package,
  TrendingUp,
  Menu,
  Bell,
  Settings,
  User,
  LogOut,
  FileText,
  HelpCircle,
  BarChart3,
  Sparkles,
  Users,
  DollarSign,
  LineChart,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface NavigationProps {
  selectedBusiness?: string;
  businesses?: Array<{ id: string; name: string }>;
  onBusinessChange?: (businessId: string) => void;
  showBusinessSelector?: boolean;
  className?: string;
}

export function Navigation({
  selectedBusiness,
  businesses = [],
  onBusinessChange,
  showBusinessSelector = true,
  className,
}: NavigationProps) {
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    router.push("/auth/login");
  };

  // Construct the business details path with the selected business ID
  const businessDetailsPath = selectedBusiness 
    ? `/businesses/${selectedBusiness}` 
    : "/businesses";

  const navItems = [
    { name: "Home", path: "/dashboard", icon: Home },
    { name: "Business Details", path: businessDetailsPath, icon: Store },
    { name: "Inventory", path: "/inventory", icon: Package },
    { name: "Demand Forecasting", path: "/forecast", icon: LineChart },
    { name: "Customer Insights", path: "/customer-insights", icon: Users },
    { name: "Cash Flow", path: "/cashflow", icon: DollarSign },
  ];

  const isActive = (path: string) => {
    // Check if the current pathname matches or starts with the nav item path
    if (path === "/dashboard") {
      return pathname === "/dashboard" || pathname === "/";
    }
    // Special handling for business details to match /businesses/[id]
    if (path.startsWith("/businesses/") && pathname.startsWith("/businesses/")) {
      return true;
    }
    return pathname.startsWith(path);
  };

  return (
    <header className={cn("border-b-2 border-slate-200/50 bg-white/80 backdrop-blur-xl sticky top-0 z-50 shadow-sm", className)}>
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo and Brand */}
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-blue-700 via-indigo-700 to-purple-700 flex items-center justify-center shadow-lg">
                <TrendingUp className="h-7 w-7 text-white" />
              </div>
              <div className="absolute -top-1 -right-1">
                <Sparkles className="h-4 w-4 text-amber-500 animate-pulse" />
              </div>
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-700 bg-clip-text text-transparent">
                BizTrack
              </h1>
              <p className="text-sm font-medium text-slate-600">
                AI-Powered Business Intelligence
              </p>
            </div>
          </div>

          {/* Navigation Links - Desktop */}
          <nav className="hidden lg:flex items-center gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              
              return (
                <Link
                  key={item.path}
                  href={item.path}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all",
                    active
                      ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/30"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right Section */}
          <div className="flex items-center gap-3">
            {/* Business Selector */}
            {showBusinessSelector && businesses.length > 0 && (
              <div className="hidden md:flex items-center gap-2 bg-white/50 backdrop-blur-sm px-4 py-2 rounded-xl border-2 border-slate-200/50 shadow-sm">
                <Store className="h-5 w-5 text-slate-600" />
                <select
                  value={selectedBusiness}
                  onChange={(e) => onBusinessChange?.(e.target.value)}
                  className="bg-transparent text-slate-900 font-medium focus:outline-none min-w-[150px]"
                >
                  {businesses.map((business) => (
                    <option key={business.id} value={business.id}>
                      {business.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Notification Bell */}
            <Button variant="ghost" size="icon" className="relative hover:bg-blue-50 hidden md:flex">
              <Bell className="h-5 w-5 text-slate-600" />
              <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center bg-gradient-to-br from-red-600 to-rose-600 border-2 border-white">
                3
              </Badge>
            </Button>

            {/* Settings */}
            <Button 
              variant="ghost" 
              size="icon" 
              className="hover:bg-blue-50 hidden md:flex"
              onClick={() => router.push("/settings")}
            >
              <Settings className="h-5 w-5 text-slate-600" />
            </Button>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="hover:bg-blue-50">
                  <Menu className="h-5 w-5 text-slate-600" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                
                {/* Mobile Navigation Links */}
                <div className="lg:hidden">
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.path);
                    
                    return (
                      <DropdownMenuItem 
                        key={item.path}
                        onClick={() => router.push(item.path)}
                        className={cn(active && "bg-blue-50 text-blue-700 font-semibold")}
                      >
                        <Icon className="mr-2 h-4 w-4" />
                        <span>{item.name}</span>
                      </DropdownMenuItem>
                    );
                  })}
                  <DropdownMenuSeparator />
                </div>

                <DropdownMenuItem onClick={() => router.push("/profile")}>
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push("/dashboard")}>
                  <BarChart3 className="mr-2 h-4 w-4" />
                  <span>Analytics</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => router.push("/docs")}>
                  <FileText className="mr-2 h-4 w-4" />
                  <span>Documentation</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push("/help")}>
                  <HelpCircle className="mr-2 h-4 w-4" />
                  <span>Help & Support</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Logout</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
}
