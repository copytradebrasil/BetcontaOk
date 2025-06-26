import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, UserCheck, Clock, CheckCircle, XCircle, ArrowDown, ArrowUp, DollarSign, CreditCard } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface AdminDashboardStats {
  masterAccounts: number;
  childAccounts: number;
  kycPending: number;
  kycApproved: number;
  kycRejected: number;
  pixInCount: number;
  pixInTotal: string;
  pixOutCount: number;
  pixOutTotal: string;
  paidChildAccounts: string;
  pendingChildAccounts: string;
}

export default function AdminDashboard() {
  const { data: stats, isLoading } = useQuery<AdminDashboardStats>({
    queryKey: ["/api/admin/dashboard"],
  });

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-700 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="h-32 bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-bold text-white text-[16px] ml-[20px] mr-[20px]">Dashboard </h1>
        <div className="text-sm text-gray-400">
          Última atualização: {new Date().toLocaleString('pt-BR')}
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-6 text-center">
        {/* Contas Master */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs md:text-sm font-medium text-gray-400">Contas Master</CardTitle>
            <Users className="h-3 w-3 md:h-4 md:w-4 text-blue-500" />
          </CardHeader>
          <CardContent className="pb-2 md:pb-6">
            <div className="text-lg md:text-2xl font-bold text-white">{stats?.masterAccounts || 0}</div>
            <CardDescription className="text-xs md:text-sm text-gray-500 hidden md:block">Total de contas principais</CardDescription>
          </CardContent>
        </Card>

        {/* Contas Filhas */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs md:text-sm font-medium text-gray-400">Contas Filhas</CardTitle>
            <UserCheck className="h-3 w-3 md:h-4 md:w-4 text-green-500" />
          </CardHeader>
          <CardContent className="pb-2 md:pb-6">
            <div className="text-lg md:text-2xl font-bold text-white">{stats?.childAccounts || 0}</div>
            <CardDescription className="text-xs md:text-sm text-gray-500 hidden md:block">Total de contas criadas</CardDescription>
          </CardContent>
        </Card>

        {/* KYC Pendente */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs md:text-sm font-medium text-gray-400">KYC Pendente</CardTitle>
            <Clock className="h-3 w-3 md:h-4 md:w-4 text-yellow-500" />
          </CardHeader>
          <CardContent className="pb-2 md:pb-6">
            <div className="text-lg md:text-2xl font-bold text-white">{stats?.kycPending || 0}</div>
            <CardDescription className="text-xs md:text-sm text-gray-500 hidden md:block">Aguardando aprovação</CardDescription>
          </CardContent>
        </Card>

        {/* KYC Aprovado */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs md:text-sm font-medium text-gray-400">KYC Aprovado</CardTitle>
            <CheckCircle className="h-3 w-3 md:h-4 md:w-4 text-green-500" />
          </CardHeader>
          <CardContent className="pb-2 md:pb-6">
            <div className="text-lg md:text-2xl font-bold text-white">{stats?.kycApproved || 0}</div>
            <CardDescription className="text-xs md:text-sm text-gray-500 hidden md:block">Contas aprovadas</CardDescription>
          </CardContent>
        </Card>

        {/* KYC Reprovado */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs md:text-sm font-medium text-gray-400">KYC Reprovado</CardTitle>
            <XCircle className="h-3 w-3 md:h-4 md:w-4 text-red-500" />
          </CardHeader>
          <CardContent className="pb-2 md:pb-6">
            <div className="text-lg md:text-2xl font-bold text-white">{stats?.kycRejected || 0}</div>
            <CardDescription className="text-xs md:text-sm text-gray-500 hidden md:block">Contas rejeitadas</CardDescription>
          </CardContent>
        </Card>

        {/* PIX IN Quantidade */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs md:text-sm font-medium text-gray-400">PIX IN</CardTitle>
            <ArrowDown className="h-3 w-3 md:h-4 md:w-4 text-green-500" />
          </CardHeader>
          <CardContent className="pb-2 md:pb-6">
            <div className="text-lg md:text-2xl font-bold text-white">{stats?.pixInCount || 0}</div>
            <CardDescription className="text-xs md:text-sm text-gray-500 hidden md:block">Transações recebidas</CardDescription>
          </CardContent>
        </Card>

        {/* PIX IN Valor */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs md:text-sm font-medium text-gray-400">Total PIX IN</CardTitle>
            <DollarSign className="h-3 w-3 md:h-4 md:w-4 text-green-500" />
          </CardHeader>
          <CardContent className="pb-2 md:pb-6">
            <div className="text-sm md:text-2xl font-bold text-white">
              {formatCurrency(parseFloat(stats?.pixInTotal || "0"))}
            </div>
            <CardDescription className="text-xs md:text-sm text-gray-500 hidden md:block">Valor total recebido</CardDescription>
          </CardContent>
        </Card>

        {/* PIX OUT Quantidade */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs md:text-sm font-medium text-gray-400">PIX OUT</CardTitle>
            <ArrowUp className="h-3 w-3 md:h-4 md:w-4 text-red-500" />
          </CardHeader>
          <CardContent className="pb-2 md:pb-6">
            <div className="text-lg md:text-2xl font-bold text-white">{stats?.pixOutCount || 0}</div>
            <CardDescription className="text-xs md:text-sm text-gray-500 hidden md:block">Transações enviadas</CardDescription>
          </CardContent>
        </Card>

        {/* PIX OUT Valor */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs md:text-sm font-medium text-gray-400">Valr PIX OUT</CardTitle>
            <DollarSign className="h-3 w-3 md:h-4 md:w-4 text-red-500" />
          </CardHeader>
          <CardContent className="pb-2 md:pb-6">
            <div className="text-sm md:text-2xl font-bold text-white">
              {formatCurrency(parseFloat(stats?.pixOutTotal || "0"))}
            </div>
            <CardDescription className="text-xs md:text-sm text-gray-500 hidden md:block">Valor total enviado</CardDescription>
          </CardContent>
        </Card>

        {/* Contas Pagas */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs md:text-sm font-medium text-gray-400">Contas Pagas</CardTitle>
            <CreditCard className="h-3 w-3 md:h-4 md:w-4 text-green-500" />
          </CardHeader>
          <CardContent className="pb-2 md:pb-6">
            <div className="text-sm md:text-2xl font-bold text-white">
              {formatCurrency(parseFloat(stats?.paidChildAccounts || "0"))}
            </div>
            <CardDescription className="text-xs md:text-sm text-gray-500 hidden md:block">R$ 90,00 por conta aprovada</CardDescription>
          </CardContent>
        </Card>

        {/* Contas Pendentes de Pagamento */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs md:text-sm font-medium text-gray-400">Pendente Assinatura</CardTitle>
            <CreditCard className="h-3 w-3 md:h-4 md:w-4 text-yellow-500" />
          </CardHeader>
          <CardContent className="pb-2 md:pb-6">
            <div className="text-sm md:text-2xl font-bold text-white">
              {formatCurrency(parseFloat(stats?.pendingChildAccounts || "0"))}
            </div>
            <CardDescription className="text-xs md:text-sm text-gray-500 hidden md:block">R$ 90,00 por conta pendente</CardDescription>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}