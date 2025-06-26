import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, 
  Users, 
  UserCheck, 
  DollarSign, 
  LogOut,
  Menu,
  X,
  Wrench,
  QrCode
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface AdminLayoutProps {
  children: React.ReactNode;
}

const navigation = [
  { name: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
  { name: "Contas Master", href: "/admin/master-accounts", icon: Users },
  { name: "Contas Filhas", href: "/admin/child-accounts", icon: UserCheck },
  { name: "Financeiro", href: "/admin/financial", icon: DollarSign },
  { name: "Liberar QR Code", href: "/admin/form-qr-codes", icon: QrCode },
  { name: "Manutenção", href: "/admin/maintenance", icon: Wrench },
];

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [location, setLocation] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const logoutMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", "/api/admin/auth/logout");
    },
    onSuccess: () => {
      // Invalidate admin auth queries
      queryClient.invalidateQueries({ queryKey: ["/api/admin/auth/status"] });
      queryClient.clear(); // Clear all cached data
      
      toast({
        title: "Logout realizado",
        description: "Saindo do painel administrativo",
      });
      
      // Force immediate redirect
      setTimeout(() => {
        setLocation("/admin/login");
      }, 100);
    },
    onError: () => {
      // Even if logout fails on server, clear local state
      queryClient.invalidateQueries({ queryKey: ["/api/admin/auth/status"] });
      queryClient.clear();
      setLocation("/admin/login");
    },
  });

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Mobile sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
          <div className="fixed top-0 left-0 flex h-full w-64 flex-col bg-gray-800">
            <div className="flex h-16 items-center justify-between px-4">
              <h1 className="text-xl font-bold text-white">Admin Panel</h1>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="h-6 w-6" />
              </Button>
            </div>
            <nav className="flex-1 space-y-1 px-2 py-4">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      "group flex items-center px-2 py-2 text-sm font-medium rounded-md",
                      location === item.href
                        ? "bg-gray-900 text-white"
                        : "text-gray-300 hover:bg-gray-700 hover:text-white"
                    )}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <Icon className="mr-3 h-5 w-5" />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
            <div className="px-2 py-4">
              <Button
                onClick={handleLogout}
                variant="ghost"
                className="w-full justify-start text-gray-300 hover:bg-gray-700 hover:text-white"
                disabled={logoutMutation.isPending}
              >
                <LogOut className="mr-3 h-5 w-5" />
                {logoutMutation.isPending ? "Saindo..." : "Logout"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex min-h-0 flex-1 flex-col bg-gray-800">
          <div className="flex h-16 items-center px-4">
            <h1 className="text-xl font-bold text-white">Admin Panel</h1>
          </div>
          <nav className="flex-1 space-y-1 px-2 py-4">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "group flex items-center px-2 py-2 text-sm font-medium rounded-md",
                    location === item.href
                      ? "bg-gray-900 text-white"
                      : "text-gray-300 hover:bg-gray-700 hover:text-white"
                  )}
                >
                  <Icon className="mr-3 h-5 w-5" />
                  {item.name}
                </Link>
              );
            })}
          </nav>
          <div className="px-2 py-4">
            <Button
              onClick={handleLogout}
              variant="ghost"
              className="w-full justify-start text-gray-300 hover:bg-gray-700 hover:text-white"
              disabled={logoutMutation.isPending}
            >
              <LogOut className="mr-3 h-5 w-5" />
              {logoutMutation.isPending ? "Saindo..." : "Logout"}
            </Button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Mobile header */}
        <div className="sticky top-0 z-40 flex h-16 items-center gap-x-4 border-b border-gray-700 bg-gray-800 px-4 shadow-sm lg:hidden">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(true)}
            className="text-gray-400 hover:text-white"
          >
            <Menu className="h-6 w-6" />
          </Button>
          <h1 className="text-lg font-semibold text-white">BetConta Admin</h1>
        </div>

        {/* Page content */}
        <main className="min-h-screen">
          {children}
        </main>
      </div>
    </div>
  );
}