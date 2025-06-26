import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import Landing from "@/pages/landing";
import Dashboard from "@/pages/dashboard";
import AffiliatePage from "@/pages/affiliate";
import NotFound from "@/pages/not-found";
import AdminLogin from "@/pages/admin/login";
import AdminDashboard from "@/pages/admin/dashboard";
import MasterAccounts from "@/pages/admin/master-accounts";
import ChildAccounts from "@/pages/admin/child-accounts";
import Financial from "@/pages/admin/financial";
import AdminMaintenance from "@/pages/admin/maintenance";
import FormQrCodes from "@/pages/admin/form-qr-codes";
import AdminLayout from "@/components/AdminLayout";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();
  const { isAuthenticated: isAdminAuthenticated, isLoading: isAdminLoading } = useAdminAuth();

  return (
    <Switch>
      {/* Admin routes */}
      <Route path="/admin/login">
        {isAdminLoading ? (
          <div className="min-h-screen bg-gray-900 flex items-center justify-center">
            <div className="text-white">Carregando...</div>
          </div>
        ) : isAdminAuthenticated ? (
          <AdminDashboard />
        ) : (
          <AdminLogin />
        )}
      </Route>
      
      <Route path="/admin/:rest*">
        {isAdminLoading ? (
          <div className="min-h-screen bg-gray-900 flex items-center justify-center">
            <div className="text-white">Carregando...</div>
          </div>
        ) : isAdminAuthenticated ? (
          <AdminLayout>
            <Switch>
              <Route path="/admin/dashboard" component={AdminDashboard} />
              <Route path="/admin/master-accounts" component={MasterAccounts} />
              <Route path="/admin/child-accounts" component={ChildAccounts} />
              <Route path="/admin/financial" component={Financial} />
              <Route path="/admin/form-qr-codes" component={FormQrCodes} />
              <Route path="/admin/maintenance" component={AdminMaintenance} />
              <Route component={NotFound} />
            </Switch>
          </AdminLayout>
        ) : (
          <AdminLogin />
        )}
      </Route>

      {/* Regular user routes */}
      {isLoading || !isAuthenticated ? (
        <Route path="/" component={Landing} />
      ) : (
        <>
          <Route path="/" component={Dashboard} />
          <Route path="/affiliate" component={AffiliatePage} />
        </>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="dark min-h-screen bg-betconta-secondary">
          <Toaster />
          <Router />
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
