import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import BetContaLogo from "@assets/Design sem nome (9)_1750366876828.png";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { 
  Settings, 
  LogOut, 
  Menu,
  Copy,
  Share,
  DollarSign,
  TrendingUp,
  Users,
  Eye,
  Link2,
  Calendar,
  CheckCircle,
  Clock
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import type { Affiliate, AffiliateSale, AffiliateSettings } from "@shared/schema";

interface AffiliateData {
  affiliate: Affiliate | null;
  settings: AffiliateSettings | null;
  sales: AffiliateSale[];
}

export default function AffiliatePage() {
  const { user, isLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showProfile, setShowProfile] = useState(false);
  const [defaultPrice, setDefaultPrice] = useState("120.00");
  const [customMessage, setCustomMessage] = useState("");

  // Fetch affiliate data
  const { data: affiliateData, isLoading: loadingAffiliate } = useQuery<AffiliateData>({
    queryKey: ["/api/affiliate/dashboard"],
    retry: false,
  });

  // Create affiliate mutation
  const createAffiliateMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", "/api/affiliate/create");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/affiliate/dashboard"] });
      toast({
        title: "Sucesso!",
        description: "Sua conta de afiliado foi criada com sucesso!",
        variant: "default",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Não autorizado",
          description: "Você precisa fazer login novamente.",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Erro",
        description: "Não foi possível criar sua conta de afiliado.",
        variant: "destructive",
      });
    },
  });

  // Update settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: async (data: { defaultPrice: string; customMessage: string }) => {
      return await apiRequest("POST", "/api/affiliate/settings", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/affiliate/dashboard"] });
      toast({
        title: "Configurações atualizadas!",
        description: "Suas configurações foram salvas com sucesso.",
        variant: "default",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Não autorizado",
          description: "Você precisa fazer login novamente.",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Erro",
        description: "Não foi possível atualizar as configurações.",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (affiliateData?.settings) {
      setDefaultPrice(affiliateData.settings.defaultPrice || "120.00");
      setCustomMessage(affiliateData.settings.customMessage || "");
    }
  }, [affiliateData]);

  const handleLogout = async () => {
    try {
      await fetch("/api/logout", {
        method: "POST",
        credentials: "include",
      });
      // Redirect to home page after successful logout
      window.location.href = "/";
    } catch (error) {
      console.error("Logout error:", error);
      // Even if logout fails, redirect to home page
      window.location.href = "/";
    }
  };

  const copyAffiliateLink = () => {
    if (affiliateData?.affiliate?.affiliateCode) {
      const link = `${window.location.origin}/signup?ref=${affiliateData.affiliate.affiliateCode}&price=${defaultPrice}`;
      navigator.clipboard.writeText(link);
      toast({
        title: "Link copiado!",
        description: "Seu link de afiliado foi copiado para a área de transferência.",
        variant: "default",
      });
    }
  };

  const handleSaveSettings = () => {
    updateSettingsMutation.mutate({
      defaultPrice,
      customMessage,
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-betconta-secondary flex items-center justify-center">
        <Skeleton className="h-8 w-64" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-betconta-secondary">
      {/* Header */}
      <header className="bg-betconta-secondary border-b border-betconta-accent sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <img 
                src={BetContaLogo} 
                alt="BetConta" 
                className="h-8"
              />
            </div>
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                size="sm"
                className="border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white text-xs px-3 py-1"
                onClick={() => window.location.href = "/"}
              >
                Dashboard
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-gray-400 hover:text-white"
                  >
                    <Menu className="w-5 h-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-gray-800 border-gray-700" align="end">
                  <DropdownMenuItem 
                    className="text-white hover:bg-gray-700 cursor-pointer"
                    onClick={() => setShowProfile(true)}
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    Configuração
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    className="text-white hover:bg-gray-700 cursor-pointer"
                    onClick={handleLogout}
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Sair
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loadingAffiliate ? (
          <div className="space-y-6">
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        ) : !affiliateData?.affiliate ? (
          // Welcome screen for new affiliates
          (<Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-8 text-center pt-[13px] pb-[13px]">
              <div className="max-w-2xl mx-auto">
                <h1 className="font-bold text-white mb-4 text-[22px]">
                  Bem-vindo ao Programa de Afiliados BetConta
                </h1>
                <p className="text-gray-300 mb-6 text-[14px]">
                  Revenda aberturas de conta filha e ganhe até R$ 40,00 por venda!
                </p>
                <div className="bg-gray-900 rounded-lg p-6 mb-8">
                  <h3 className="text-xl font-semibold text-white mb-4">Como funciona:</h3>
                  <div className="grid md:grid-cols-3 gap-4 text-left">
                    <div>
                      <div className="flex items-center mb-2">
                        <DollarSign className="w-5 h-5 text-green-400 mr-2" />
                        <span className="text-white font-medium">Custo Fixo</span>
                      </div>
                      <p className="text-gray-400 text-sm">R$ 90,00 por conta criada</p>
                    </div>
                    <div>
                      <div className="flex items-center mb-2">
                        <TrendingUp className="w-5 h-5 text-blue-400 mr-2" />
                        <span className="text-white font-medium">Seu Preço</span>
                      </div>
                      <p className="text-gray-400 text-sm">R$ 90,00 até R$ 130,00</p>
                    </div>
                    <div>
                      <div className="flex items-center mb-2">
                        <Users className="w-5 h-5 text-yellow-400 mr-2" />
                        <span className="text-white font-medium">Seu Lucro</span>
                      </div>
                      <p className="text-gray-400 text-sm">Até R$ 40,00 por venda</p>
                    </div>
                  </div>
                </div>
                <Button
                  size="lg"
                  onClick={() => createAffiliateMutation.mutate()}
                  disabled={createAffiliateMutation.isPending}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3"
                >
                  {createAffiliateMutation.isPending ? "Criando..." : "Começar como Afiliado"}
                </Button>
              </div>
            </CardContent>
          </Card>)
        ) : (
          // Affiliate dashboard
          (<div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 gap-3">
              <Card className="bg-gray-800 border-gray-700">
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-400 text-xs">Total de Vendas</p>
                      <p className="text-lg font-bold text-white">
                        {affiliateData.affiliate.totalSales}
                      </p>
                    </div>
                    <Users className="w-5 h-5 text-blue-400" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-800 border-gray-700">
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-400 text-xs">Comissão Total</p>
                      <p className="text-lg font-bold text-green-400">
                        R$ {parseFloat(affiliateData.affiliate.totalCommission).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                    <DollarSign className="w-5 h-5 text-green-400" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-800 border-gray-700">
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-400 text-xs">Preço Padrão</p>
                      <p className="text-lg font-bold text-white">
                        R$ {parseFloat(defaultPrice).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                    <TrendingUp className="w-5 h-5 text-yellow-400" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-800 border-gray-700">
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-400 text-xs">Status</p>
                      <div className="flex items-center mt-1">
                        <Badge className={affiliateData.affiliate.isActive ? "bg-green-600" : "bg-red-600"}>
                          {affiliateData.affiliate.isActive ? "Ativo" : "Inativo"}
                        </Badge>
                      </div>
                    </div>
                    <CheckCircle className="w-5 h-5 text-green-400" />
                  </div>
                </CardContent>
              </Card>
            </div>
            {/* Affiliate Link Section */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Link2 className="w-5 h-5 mr-2" />
                  Seu Link de Afiliado
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <Input
                    value={`${window.location.origin}/signup?ref=${affiliateData.affiliate.affiliateCode}&price=${defaultPrice}`}
                    readOnly
                    className="bg-gray-900 border-gray-700 text-white"
                  />
                  <Button
                    onClick={copyAffiliateLink}
                    variant="outline"
                    className="border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white"
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Copiar
                  </Button>
                  
                </div>
                <p className="text-gray-400 text-sm">
                  Código do afiliado: <span className="font-mono text-blue-400">{affiliateData.affiliate.affiliateCode}</span>
                </p>
              </CardContent>
            </Card>
            {/* Settings Section */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Settings className="w-5 h-5 mr-2" />
                  Configurações
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="defaultPrice" className="text-white">
                      Preço Padrão (R$ 90,00 - R$ 130,00)
                    </Label>
                    <Input
                      id="defaultPrice"
                      type="number"
                      min="90"
                      max="130"
                      step="0.01"
                      value={defaultPrice}
                      onChange={(e) => setDefaultPrice(e.target.value)}
                      className="bg-gray-900 border-gray-700 text-white"
                    />
                    <p className="text-gray-400 text-sm mt-1">
                      Seu lucro: R$ {(parseFloat(defaultPrice) - 90).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="customMessage" className="text-white">
                      Mensagem Personalizada (opcional)
                    </Label>
                    <Textarea
                      id="customMessage"
                      value={customMessage}
                      onChange={(e) => setCustomMessage(e.target.value)}
                      placeholder="Digite uma mensagem personalizada para seus clientes"
                      className="bg-gray-900 border-gray-700 text-white"
                      rows={3}
                    />
                  </div>
                </div>
                <Button
                  onClick={handleSaveSettings}
                  disabled={updateSettingsMutation.isPending}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {updateSettingsMutation.isPending ? "Salvando..." : "Salvar Configurações"}
                </Button>
              </CardContent>
            </Card>
            {/* Sales History */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Calendar className="w-5 h-5 mr-2" />
                  Histórico de Vendas
                </CardTitle>
              </CardHeader>
              <CardContent>
                {affiliateData.sales.length === 0 ? (
                  <div className="text-center py-8">
                    <Eye className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400">Nenhuma venda realizada ainda</p>
                    <p className="text-gray-500 text-sm">Compartilhe seu link para começar a vender!</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-700">
                          <th className="text-left py-3 px-4 text-gray-400 text-sm font-medium">Data</th>
                          <th className="text-left py-3 px-4 text-gray-400 text-sm font-medium">Conta</th>
                          <th className="text-left py-3 px-4 text-gray-400 text-sm font-medium">Preço de Venda</th>
                          <th className="text-left py-3 px-4 text-gray-400 text-sm font-medium">Comissão</th>
                          <th className="text-left py-3 px-4 text-gray-400 text-sm font-medium">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {affiliateData.sales.map((sale) => (
                          <tr key={sale.id} className="border-b border-gray-700 hover:bg-gray-700/50">
                            <td className="py-3 px-4 text-white text-sm">
                              {new Date(sale.createdAt).toLocaleDateString("pt-BR")}
                            </td>
                            <td className="py-3 px-4 text-white text-sm">#{sale.childAccountId}</td>
                            <td className="py-3 px-4 text-white text-sm">
                              R$ {parseFloat(sale.salePrice).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                            </td>
                            <td className="py-3 px-4 text-green-400 text-sm font-medium">
                              R$ {parseFloat(sale.commission).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                            </td>
                            <td className="py-3 px-4">
                              <Badge className={sale.paymentStatus === "paid" ? "bg-green-600" : "bg-yellow-600"}>
                                {sale.paymentStatus === "paid" ? "Pago" : "Pendente"}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>)
        )}
      </div>
    </div>
  );
}