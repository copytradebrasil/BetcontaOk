import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { formatDate, formatCurrency } from "@/lib/utils";
import type { ChildAccount } from "@shared/schema";

const Badge = ({ children, className, variant }: { children: React.ReactNode; className?: string; variant?: string }) => (
  <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${className}`}>
    {children}
  </span>
);

export default function ChildAccounts() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { data: childAccounts, isLoading } = useQuery<ChildAccount[]>({
    queryKey: ["/api/admin/child-accounts"],
  });

  const updateKycStatusMutation = useMutation({
    mutationFn: async ({ accountId, status }: { accountId: number; status: string }) => {
      const response = await fetch(`/api/admin/child-accounts/${accountId}/kyc-status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update KYC status');
      }
      
      return response.json();
    },
    onSuccess: () => {
      // Invalidate both admin and user caches
      queryClient.invalidateQueries({ queryKey: ["/api/admin/child-accounts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["/api/child-accounts"] });
      toast({
        title: "Status atualizado",
        description: "Status KYC da conta filha foi atualizado com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Erro ao atualizar status KYC.",
        variant: "destructive",
      });
    },
  });

  const handleStatusChange = (accountId: number, newStatus: string) => {
    updateKycStatusMutation.mutate({ accountId, status: newStatus });
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
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white">Contas Filhas</h1>
        <div className="text-sm text-gray-400">
          Total: {childAccounts?.length || 0} contas
        </div>
      </div>

      <Card className="bg-gray-800 border-gray-700">
        <CardContent>
          {/* Mobile Accordion Layout */}
          <div className="block lg:hidden">
            <Accordion type="single" collapsible className="space-y-2">
              {childAccounts?.map((account) => (
                <AccordionItem key={account.id} value={`account-${account.id}`} className="bg-gray-750 border-gray-600 rounded-lg">
                  <AccordionTrigger className="px-4 py-3 hover:no-underline">
                    <div className="flex items-center justify-between w-full mr-4">
                      <div className="text-left">
                        <div className="text-white font-semibold text-sm">{account.name}</div>
                        <div className="text-gray-300 text-xs">Parent ID: {account.parentUserId}</div>
                      </div>
                      <Badge 
                        variant={
                          account.status === 'approved' ? 'default' : 
                          account.status === 'pending' ? 'secondary' : 
                          'destructive'
                        }
                        className={`text-xs ${
                          account.status === 'approved' ? 'bg-green-600' : 
                          account.status === 'pending' ? 'bg-yellow-600' : 
                          'bg-red-600'
                        }`}
                      >
                        {account.status || 'pending'}
                      </Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4">
                    <div className="space-y-3">
                      {/* Details Grid */}
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div>
                          <span className="text-gray-400">ID:</span>
                          <div className="text-white font-mono">{account.id}</div>
                        </div>
                        <div>
                          <span className="text-gray-400">Saldo:</span>
                          <div className="text-white font-mono">{formatCurrency(parseFloat(account.balance || "0"))}</div>
                        </div>
                        <div>
                          <span className="text-gray-400">CPF:</span>
                          <div className="text-white font-mono">{account.cpf}</div>
                        </div>
                        <div>
                          <span className="text-gray-400">RG:</span>
                          <div className="text-white font-mono">{account.rgNumber || "-"}</div>
                        </div>
                        <div>
                          <span className="text-gray-400">Valor Pago:</span>
                          <div className="mt-1">
                            <Badge 
                              variant={account.status === 'approved' ? 'default' : 'secondary'}
                              className={`text-xs ${account.status === 'approved' ? 'bg-green-600' : 'bg-yellow-600'}`}
                            >
                              {account.status === 'approved' ? 'R$ 90,00' : 'Pendente'}
                            </Badge>
                          </div>
                        </div>
                        <div>
                          <span className="text-gray-400">Alterar Status:</span>
                          <div className="mt-1">
                            <Select
                              value={account.status || 'pending'}
                              onValueChange={(value) => handleStatusChange(account.id, value)}
                              disabled={updateKycStatusMutation.isPending}
                            >
                              <SelectTrigger className="w-full h-7 text-xs bg-gray-700 border-gray-600">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="pending">Pendente</SelectItem>
                                <SelectItem value="approved">Aprovado</SelectItem>
                                <SelectItem value="rejected">Reprovado</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div>
                          <span className="text-gray-400">Criado em:</span>
                          <div className="text-white">{formatDate(account.createdAt)}</div>
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
                  <th className="text-left text-gray-400 p-2">Nome</th>
                  <th className="text-left text-gray-400 p-2">CPF</th>
                  <th className="text-left text-gray-400 p-2">RG</th>
                  <th className="text-left text-gray-400 p-2">Parent ID</th>
                  <th className="text-left text-gray-400 p-2">Saldo</th>
                  <th className="text-left text-gray-400 p-2">KYC Status</th>
                  <th className="text-left text-gray-400 p-2">Valor Pago</th>
                  <th className="text-left text-gray-400 p-2">Alterar Status</th>
                  <th className="text-left text-gray-400 p-2">Criado em</th>
                </tr>
              </thead>
              <tbody>
                {childAccounts?.map((account) => (
                  <tr key={account.id} className="border-b border-gray-700 hover:bg-gray-750">
                    <td className="p-2 text-white font-mono">{account.id}</td>
                    <td className="p-2 text-white">{account.name}</td>
                    <td className="p-2 text-gray-300 font-mono">{account.cpf}</td>
                    <td className="p-2 text-gray-300 font-mono">{account.rgNumber || "-"}</td>
                    <td className="p-2 text-gray-400 font-mono text-xs">{account.parentUserId}</td>
                    <td className="p-2 text-white font-mono">
                      {formatCurrency(parseFloat(account.balance || "0"))}
                    </td>
                    <td className="p-2">
                      <Badge 
                        variant={
                          account.status === 'approved' ? 'default' : 
                          account.status === 'pending' ? 'secondary' : 
                          'destructive'
                        }
                        className={
                          account.status === 'approved' ? 'bg-green-600' : 
                          account.status === 'pending' ? 'bg-yellow-600' : 
                          'bg-red-600'
                        }
                      >
                        {account.status || 'pending'}
                      </Badge>
                    </td>
                    <td className="p-2">
                      <Badge 
                        variant={account.status === 'approved' ? 'default' : 'secondary'}
                        className={account.status === 'approved' ? 'bg-green-600' : 'bg-yellow-600'}
                      >
                        {account.status === 'approved' ? 'R$ 90,00' : 'Pendente'}
                      </Badge>
                    </td>
                    <td className="p-2">
                      <Select
                        value={account.status || 'pending'}
                        onValueChange={(value) => handleStatusChange(account.id, value)}
                        disabled={updateKycStatusMutation.isPending}
                      >
                        <SelectTrigger className="w-32 h-8 text-xs bg-gray-700 border-gray-600">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pendente</SelectItem>
                          <SelectItem value="approved">Aprovado</SelectItem>
                          <SelectItem value="rejected">Reprovado</SelectItem>
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="p-2 text-gray-400">{formatDate(account.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {(!childAccounts || childAccounts.length === 0) && (
            <div className="text-center py-8 text-gray-400">
              Nenhuma conta filha encontrada
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}