import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { formatDate, formatCurrency } from "@/lib/utils";
import { Power, List, PowerOff, Check, X, Clock, FileText } from "lucide-react";
import { useState } from "react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { User } from "@shared/schema";

const Badge = ({ children, className, variant }: { children: React.ReactNode; className?: string; variant?: string }) => (
  <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${className}`}>
    {children}
  </span>
);

// Affiliate Request Dialog Component
const AffiliateRequestDialog = ({ userId }: { userId: number }) => {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: affiliateRequest, isLoading } = useQuery({
    queryKey: ['/api/admin/affiliate-request', userId],
    queryFn: async () => {
      const response = await fetch(`/api/admin/affiliate-request/${userId}`, {
        method: 'GET',
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch affiliate request');
      return response.json();
    },
    enabled: open,
  });

  const updateAffiliateStatusMutation = useMutation({
    mutationFn: async ({ status }: { status: string }) => {
      const response = await fetch(`/api/admin/affiliate-status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ userId, approvalStatus: status }),
      });
      if (!response.ok) throw new Error('Failed to update affiliate status');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/affiliate-status', userId] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/user-affiliate-status', userId] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/master-accounts'] });
      setOpen(false);
      toast({
        title: "Status Atualizado",
        description: "Status do afiliado foi alterado com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao alterar status do afiliado.",
        variant: "destructive",
      });
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          size="sm"
          variant="outline"
          className="h-6 px-2 border-blue-600 hover:bg-blue-700 text-blue-400 text-xs"
        >
          <FileText className="h-3 w-3 mr-1" />
          Novo Pedido
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl bg-gray-900 border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-400" />
            Solicitação de Afiliação - Usuário ID: {userId}
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-4 p-4">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-700 rounded w-3/4 mb-2"></div>
              <div className="h-20 bg-gray-700 rounded mb-4"></div>
              <div className="h-4 bg-gray-700 rounded w-1/2 mb-2"></div>
              <div className="h-20 bg-gray-700 rounded"></div>
            </div>
          </div>
        ) : affiliateRequest ? (
          <div className="space-y-6 p-4">
            <div className="bg-gray-800 rounded-lg p-4 space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-300">Motivação</label>
                <div className="mt-1 p-3 bg-gray-700 rounded text-white text-sm">
                  {affiliateRequest.motivation}
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-300">Experiência</label>
                <div className="mt-1 p-3 bg-gray-700 rounded text-white text-sm">
                  {affiliateRequest.experience}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-300">Volume Esperado</label>
                  <div className="mt-1 p-3 bg-gray-700 rounded text-white text-sm">
                    {affiliateRequest.expectedVolume} contas/mês
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-300">WhatsApp</label>
                  <div className="mt-1 p-3 bg-gray-700 rounded text-white text-sm">
                    {affiliateRequest.whatsapp}
                  </div>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-300">Data da Solicitação</label>
                <div className="mt-1 p-3 bg-gray-700 rounded text-white text-sm">
                  {new Date(affiliateRequest.createdAt).toLocaleString('pt-BR')}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setOpen(false)}
                className="border-gray-600 text-gray-300"
              >
                Cancelar
              </Button>
              <Button
                variant="destructive"
                onClick={() => updateAffiliateStatusMutation.mutate({ status: 'rejected' })}
                disabled={updateAffiliateStatusMutation.isPending}
                className="bg-red-600 hover:bg-red-700"
              >
                <X className="h-4 w-4 mr-2" />
                Reprovar
              </Button>
              <Button
                onClick={() => updateAffiliateStatusMutation.mutate({ status: 'approved' })}
                disabled={updateAffiliateStatusMutation.isPending}
                className="bg-green-600 hover:bg-green-700"
              >
                <Check className="h-4 w-4 mr-2" />
                Aprovar
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-400">
            Solicitação não encontrada
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

// Component for affiliate status cell
const AffiliateStatusCell = ({ userId }: { userId: number }) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const { data: affiliate } = useQuery({
    queryKey: ['/api/admin/affiliate-status', userId],
    queryFn: async () => {
      const response = await fetch(`/api/admin/affiliate-status?userId=${userId}`, {
        method: 'GET',
        credentials: 'include',
      });
      if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error('Failed to fetch affiliate status');
      }
      return response.json();
    },
  });

  const updateAffiliateStatusMutation = useMutation({
    mutationFn: async ({ userId, status }: { userId: number; status: string }) => {
      const response = await fetch(`/api/admin/affiliate-status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ userId, approvalStatus: status }),
      });
      if (!response.ok) throw new Error('Failed to update affiliate status');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/affiliate-status', userId] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/user-affiliate-status', userId] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/master-accounts'] });
      toast({
        title: "Status Atualizado",
        description: "Status do afiliado foi alterado com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao alterar status do afiliado.",
        variant: "destructive",
      });
    },
  });

  // Check user affiliate status first
  const { data: userData } = useQuery({
    queryKey: ['/api/admin/user-affiliate-status', userId],
    queryFn: async () => {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'GET',
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch user');
      return response.json();
    },
  });

  const userAffiliateStatus = userData?.affiliateStatus || 'none';

  if (userAffiliateStatus === 'none') {
    return <span className="text-gray-500 text-xs">Não solicitou</span>;
  }

  if (userAffiliateStatus === 'pending') {
    return <AffiliateRequestDialog userId={userId} />;
  }

  if (userAffiliateStatus === 'approved') {
    return (
      <Badge className="bg-green-600 text-white">
        <Check className="h-3 w-3 mr-1" />
        Aprovado
      </Badge>
    );
  }

  if (userAffiliateStatus === 'rejected') {
    return (
      <Badge className="bg-red-600 text-white">
        <X className="h-3 w-3 mr-1" />
        Reprovado
      </Badge>
    );
  }

  return <span className="text-gray-500 text-xs">Status indefinido</span>;
};

export default function MasterAccounts() {
  const { data: users, isLoading } = useQuery<User[]>({
    queryKey: ["/api/admin/master-accounts"],
  });

  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [showChildAccounts, setShowChildAccounts] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: childAccounts, isLoading: isLoadingChildAccounts } = useQuery({
    queryKey: ['/api/admin/child-accounts-by-user', selectedUserId],
    queryFn: async () => {
      const response = await fetch(`/api/admin/child-accounts-by-user?userId=${selectedUserId}`, {
        method: 'GET',
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error('Failed to fetch child accounts');
      }
      return response.json();
    },
    enabled: !!selectedUserId && showChildAccounts,
    staleTime: 0,
    cacheTime: 0,
  });

  const toggleUserStatusMutation = useMutation({
    mutationFn: async ({ userId, isActive }: { userId: number; isActive: boolean }) => {
      return await apiRequest('PATCH', `/api/admin/users/${userId}/toggle-status`, { isActive });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/master-accounts'] });
      toast({
        title: "Status Atualizado",
        description: "Status da conta master foi alterado com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao alterar status da conta master.",
        variant: "destructive",
      });
    },
  });

  const handleToggleUserStatus = (userId: number, currentStatus: boolean) => {
    console.log('Toggling user status:', { userId, currentStatus, newStatus: !currentStatus });
    toggleUserStatusMutation.mutate({ userId, isActive: !currentStatus });
  };

  const handleShowChildAccounts = (userId: number) => {
    setSelectedUserId(userId);
    setShowChildAccounts(true);
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-700 rounded w-1/4"></div>
          <div className="h-96 bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 md:p-6 space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <h1 className="text-xl md:text-3xl font-bold text-white">Contas Master</h1>
        <div className="text-sm text-gray-400">
          Total: {users?.length || 0} contas
        </div>
      </div>

      <Card className="bg-gray-800 border-gray-700">
        <CardContent>
          {/* Mobile Accordion Layout */}
          <div className="block lg:hidden">
            <Accordion type="single" collapsible className="space-y-2">
              {users?.map((user) => (
                <AccordionItem key={user.id} value={`user-${user.id}`} className="bg-gray-750 border-gray-600 rounded-lg">
                  <AccordionTrigger className="px-4 py-3 hover:no-underline">
                    <div className="flex items-center justify-between w-full mr-4">
                      <div className="text-left">
                        <div className="text-white font-semibold text-sm">{user.firstName} {user.lastName}</div>
                        <div className="text-gray-300 text-xs">{user.email}</div>
                      </div>
                      <Badge 
                        variant={
                          user.kycStatus === 'approved' ? 'default' : 
                          user.kycStatus === 'pending' ? 'secondary' : 
                          'destructive'
                        }
                        className={`text-xs ${
                          user.kycStatus === 'approved' ? 'bg-green-600' : 
                          user.kycStatus === 'pending' ? 'bg-yellow-600' : 
                          'bg-red-600'
                        }`}
                      >
                        {user.kycStatus || 'pending'}
                      </Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4">
                    <div className="space-y-3">
                      {/* Actions Row */}
                      <div className="flex gap-2 pt-2 border-t border-gray-600">
                        <Button
                          size="sm"
                          variant={user.isActive !== false ? "destructive" : "default"}
                          onClick={() => handleToggleUserStatus(user.id, user.isActive !== false)}
                          disabled={toggleUserStatusMutation.isPending}
                          className={`h-8 px-3 flex items-center gap-1 text-xs ${
                            user.isActive !== false 
                              ? 'bg-red-600 hover:bg-red-700' 
                              : 'bg-green-600 hover:bg-green-700'
                          }`}
                        >
                          {user.isActive !== false ? (
                            <>
                              <PowerOff className="h-3 w-3" />
                              Desativar
                            </>
                          ) : (
                            <>
                              <Power className="h-3 w-3" />
                              Ativar
                            </>
                          )}
                        </Button>
                        <Dialog open={showChildAccounts && selectedUserId === user.id} onOpenChange={(open) => {
                          setShowChildAccounts(open);
                          if (!open) setSelectedUserId(null);
                        }}>
                          <DialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleShowChildAccounts(user.id)}
                              className="h-8 px-3 flex items-center gap-1 text-xs border-gray-600 hover:bg-gray-700"
                            >
                              <List className="h-3 w-3" />
                              Contas Filhas
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-[95vw] max-h-[90vh] overflow-y-auto bg-gray-900 border-gray-700">
                            <DialogHeader>
                              <DialogTitle className="text-white text-sm">
                                Contas Filhas - {user.firstName} {user.lastName}
                              </DialogTitle>
                            </DialogHeader>
                            <div className="mt-4">
                              {isLoadingChildAccounts ? (
                                <div className="text-center py-8 text-gray-400">
                                  Carregando...
                                </div>
                              ) : childAccounts && Array.isArray(childAccounts) && childAccounts.length > 0 ? (
                                <div className="space-y-2 max-h-60 overflow-y-auto">
                                  {childAccounts.map((child: any) => (
                                    <div key={child.id} className="bg-gray-800 p-3 rounded border border-gray-700">
                                      <div className="text-white font-medium text-sm">{child.name}</div>
                                      <div className="text-gray-300 text-xs">{child.email}</div>
                                      <div className="flex justify-between items-center mt-2">
                                        <div className="text-xs text-gray-400">CPF: {child.cpfMask || child.cpf}</div>
                                        <Badge 
                                          variant={child.status === 'active' ? 'default' : 'secondary'}
                                          className={`text-xs ${child.status === 'active' ? 'bg-green-600' : 'bg-yellow-600'}`}
                                        >
                                          {child.status || 'pending'}
                                        </Badge>
                                      </div>
                                      <div className="text-white text-xs mt-1">
                                        Saldo: {formatCurrency(parseFloat(child.balance || "0"))}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="text-center py-8 text-gray-400 text-sm">
                                  Nenhuma conta filha encontrada
                                </div>
                              )}
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>

                      {/* Details Grid */}
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div>
                          <span className="text-gray-400">ID:</span>
                          <div className="text-white font-mono">{user.id}</div>
                        </div>
                        <div>
                          <span className="text-gray-400">Saldo:</span>
                          <div className="text-white font-mono">{formatCurrency(parseFloat(user.balance || "0"))}</div>
                        </div>
                        <div>
                          <span className="text-gray-400">CPF:</span>
                          <div className="text-white font-mono">{user.cpf || "-"}</div>
                        </div>
                        <div>
                          <span className="text-gray-400">Telefone:</span>
                          <div className="text-white">{user.phone || "-"}</div>
                        </div>
                        <div>
                          <span className="text-gray-400">Afiliado:</span>
                          <div className="mt-1">
                            <AffiliateStatusCell userId={user.id} />
                          </div>
                        </div>
                        <div>
                          <span className="text-gray-400">Criado em:</span>
                          <div className="text-white">{formatDate(user.createdAt)}</div>
                        </div>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>

          {/* Desktop Table Layout */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left text-gray-400 p-2">ID</th>
                  <th className="text-left text-gray-400 p-2">Email</th>
                  <th className="text-left text-gray-400 p-2">Nome</th>
                  <th className="text-left text-gray-400 p-2">CPF</th>
                  <th className="text-left text-gray-400 p-2">Telefone</th>
                  <th className="text-left text-gray-400 p-2">Saldo</th>
                  <th className="text-left text-gray-400 p-2">KYC Status</th>
                  <th className="text-left text-gray-400 p-2">Afiliado</th>
                  <th className="text-left text-gray-400 p-2">Criado em</th>
                  <th className="text-left text-gray-400 p-2">Ações</th>
                </tr>
              </thead>
              <tbody>
                {users?.map((user) => (
                  <tr key={user.id} className="border-b border-gray-700 hover:bg-gray-750">
                    <td className="p-2 text-white font-mono text-xs">{user.id}</td>
                    <td className="p-2 text-white">{user.email}</td>
                    <td className="p-2 text-white">
                      {user.firstName} {user.lastName}
                    </td>
                    <td className="p-2 text-gray-300 font-mono">{user.cpf || "-"}</td>
                    <td className="p-2 text-gray-300">{user.phone || "-"}</td>
                    <td className="p-2 text-white font-mono">
                      {formatCurrency(parseFloat(user.balance || "0"))}
                    </td>
                    <td className="p-2">
                      <Badge 
                        variant={
                          user.kycStatus === 'approved' ? 'default' : 
                          user.kycStatus === 'pending' ? 'secondary' : 
                          'destructive'
                        }
                        className={
                          user.kycStatus === 'approved' ? 'bg-green-600' : 
                          user.kycStatus === 'pending' ? 'bg-yellow-600' : 
                          'bg-red-600'
                        }
                      >
                        {user.kycStatus || 'pending'}
                      </Badge>
                    </td>
                    <td className="p-2">
                      <AffiliateStatusCell userId={user.id} />
                    </td>
                    <td className="p-2 text-gray-400">{formatDate(user.createdAt)}</td>
                    <td className="p-2">
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant={user.isActive !== false ? "destructive" : "default"}
                          onClick={() => handleToggleUserStatus(user.id, user.isActive !== false)}
                          disabled={toggleUserStatusMutation.isPending}
                          className={`h-8 px-3 flex items-center gap-1 text-xs font-medium ${
                            user.isActive !== false 
                              ? 'bg-red-600 hover:bg-red-700 text-white' 
                              : 'bg-green-600 hover:bg-green-700 text-white'
                          }`}
                        >
                          {user.isActive !== false ? (
                            <>
                              <PowerOff className="h-3 w-3" />
                              Desativar
                            </>
                          ) : (
                            <>
                              <Power className="h-3 w-3" />
                              Ativar
                            </>
                          )}
                        </Button>
                        
                        <Dialog open={showChildAccounts && selectedUserId === user.id} onOpenChange={(open) => {
                          setShowChildAccounts(open);
                          if (!open) setSelectedUserId(null);
                        }}>
                          <DialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleShowChildAccounts(user.id)}
                              className="h-8 w-8 p-0 border-gray-600 hover:bg-gray-700"
                            >
                              <List className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-[95vw] lg:max-w-5xl max-h-[90vh] overflow-hidden bg-gray-900 border-gray-700">
                            <DialogHeader className="pb-4 border-b border-gray-700">
                              <DialogTitle className="text-white text-lg lg:text-xl">
                                Contas Filhas - {user.firstName} {user.lastName}
                              </DialogTitle>
                              <div className="text-sm text-gray-400">
                                ID: {user.id} • Total: {childAccounts?.length || 0} contas filhas
                              </div>
                            </DialogHeader>
                            <div className="mt-4 flex-1 overflow-hidden">
                              {isLoadingChildAccounts ? (
                                <div className="text-center py-12 text-gray-400">
                                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
                                  Carregando contas filhas...
                                </div>
                              ) : childAccounts && Array.isArray(childAccounts) && childAccounts.length > 0 ? (
                                <>
                                  {/* Mobile Cards Layout */}
                                  <div className="block lg:hidden h-full overflow-y-auto">
                                    <div className="space-y-3 pb-4">
                                      {childAccounts.map((child: any) => (
                                        <div key={child.id} className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                                          <div className="flex items-start justify-between mb-3">
                                            <div>
                                              <div className="text-white font-medium">{child.name}</div>
                                              <div className="text-gray-300 text-sm">{child.email}</div>
                                              <div className="text-xs text-gray-400 font-mono mt-1">ID: {child.id}</div>
                                            </div>
                                            <Badge 
                                              variant={child.status === 'active' ? 'default' : 'secondary'}
                                              className={`text-xs ${child.status === 'active' ? 'bg-green-600' : 'bg-yellow-600'}`}
                                            >
                                              {child.status || 'pending'}
                                            </Badge>
                                          </div>
                                          <div className="grid grid-cols-2 gap-3 text-sm">
                                            <div>
                                              <span className="text-gray-400">CPF:</span>
                                              <div className="text-white font-mono text-xs">{child.cpfMask || child.cpf}</div>
                                            </div>
                                            <div>
                                              <span className="text-gray-400">Saldo:</span>
                                              <div className="text-white font-mono text-xs">
                                                {formatCurrency(parseFloat(child.balance || "0"))}
                                              </div>
                                            </div>
                                            <div className="col-span-2">
                                              <span className="text-gray-400">Criado em:</span>
                                              <div className="text-white text-xs">{formatDate(child.createdAt)}</div>
                                            </div>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>

                                  {/* Desktop Table Layout */}
                                  <div className="hidden lg:block h-full overflow-y-auto">
                                    <table className="w-full text-sm">
                                      <thead className="sticky top-0 bg-gray-900 border-b border-gray-700">
                                        <tr>
                                          <th className="text-left text-gray-400 p-3 font-medium">ID</th>
                                          <th className="text-left text-gray-400 p-3 font-medium">Nome</th>
                                          <th className="text-left text-gray-400 p-3 font-medium">CPF</th>
                                          <th className="text-left text-gray-400 p-3 font-medium">Email</th>
                                          <th className="text-left text-gray-400 p-3 font-medium">Saldo</th>
                                          <th className="text-left text-gray-400 p-3 font-medium">Status</th>
                                          <th className="text-left text-gray-400 p-3 font-medium">Criado em</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {childAccounts.map((child: any) => (
                                          <tr key={child.id} className="border-b border-gray-700 hover:bg-gray-800/50 transition-colors">
                                            <td className="p-3 text-white font-mono text-xs">{child.id}</td>
                                            <td className="p-3 text-white font-medium">{child.name}</td>
                                            <td className="p-3 text-gray-300 font-mono">{child.cpfMask || child.cpf}</td>
                                            <td className="p-3 text-gray-300">{child.email}</td>
                                            <td className="p-3 text-white font-mono">
                                              {formatCurrency(parseFloat(child.balance || "0"))}
                                            </td>
                                            <td className="p-3">
                                              <Badge 
                                                variant={child.status === 'active' ? 'default' : 'secondary'}
                                                className={child.status === 'active' ? 'bg-green-600' : 'bg-yellow-600'}
                                              >
                                                {child.status || 'pending'}
                                              </Badge>
                                            </td>
                                            <td className="p-3 text-gray-400">{formatDate(child.createdAt)}</td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                </>
                              ) : (
                                <div className="text-center py-12 text-gray-400">
                                  <div className="text-4xl mb-4">👥</div>
                                  <div className="text-lg font-medium mb-2">Nenhuma conta filha encontrada</div>
                                  <div className="text-sm">Este usuário ainda não possui contas filhas associadas</div>
                                </div>
                              )}
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {(!users || users.length === 0) && (
            <div className="text-center py-8 text-gray-400">
              Nenhuma conta master encontrada
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}