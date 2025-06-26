import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Clock, Check, X, Eye, Copy } from "lucide-react";
import { cn } from "@/lib/utils";

interface FormQrCode {
  id: number;
  masterUserId: number;
  isBettingHouse: string;
  isChinese: string;
  houseName: string;
  qrCode: string;
  status: string;
  adminNotes?: string;
  createdAt: string;
  updatedAt: string;
  userEmail?: string;
  userFirstName?: string;
  userLastName?: string;
}

export default function FormQrCodesPage() {
  const [selectedRequest, setSelectedRequest] = useState<FormQrCode | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ["/api/admin/qr-code-requests"],
  });

  const updateRequestMutation = useMutation({
    mutationFn: async ({ id, status, adminNotes }: { id: number; status: string; adminNotes?: string }) => {
      const response = await fetch(`/api/admin/qr-code-requests/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status, adminNotes }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update request');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/qr-code-requests"] });
      toast({
        title: "Status atualizado",
        description: "O status da solicitação foi atualizado com sucesso.",
      });
      setSelectedRequest(null);
      setAdminNotes("");
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Falha ao atualizar o status da solicitação.",
        variant: "destructive",
      });
    },
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge className="bg-yellow-500 text-white"><Clock className="w-3 h-3 mr-1" />Pendente</Badge>;
      case "approved":
        return <Badge className="bg-green-500 text-white"><Check className="w-3 h-3 mr-1" />Aprovado</Badge>;
      case "rejected":
        return <Badge className="bg-red-500 text-white"><X className="w-3 h-3 mr-1" />Rejeitado</Badge>;
      default:
        return <Badge className="bg-gray-500 text-white">{status}</Badge>;
    }
  };

  const handleStatusUpdate = (status: string) => {
    if (selectedRequest) {
      updateRequestMutation.mutate({
        id: selectedRequest.id,
        status,
        adminNotes: adminNotes.trim() || undefined,
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR');
  };

  return (
    <div className="space-y-4 p-4 lg:space-y-6 lg:p-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl lg:text-2xl font-bold text-white">Liberar QR Code</h1>
        <div className="text-sm text-gray-400">
          Total: {requests.length} solicitações
        </div>
      </div>

      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white text-lg">Solicitações de Liberação de QR Code</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-gray-400">Carregando solicitações...</div>
            </div>
          ) : requests.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-gray-400">Nenhuma solicitação encontrada</div>
            </div>
          ) : (
            <>
              {/* Desktop Table - Hidden on mobile */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="text-left py-3 px-4 text-white font-semibold">ID</th>
                      <th className="text-left py-3 px-4 text-white font-semibold">Status</th>
                      <th className="text-left py-3 px-4 text-white font-semibold">Casa</th>
                      <th className="text-left py-3 px-4 text-white font-semibold">Usuário</th>
                      <th className="text-left py-3 px-4 text-white font-semibold">Casa de Aposta</th>
                      <th className="text-left py-3 px-4 text-white font-semibold">Chinesa</th>
                      <th className="text-left py-3 px-4 text-white font-semibold">Criado em</th>
                      <th className="text-left py-3 px-4 text-white font-semibold">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {requests.map((request: FormQrCode) => (
                      <tr key={request.id} className="border-b border-gray-700 hover:bg-gray-700/50">
                        <td className="py-3 px-4 text-gray-300">#{request.id}</td>
                        <td className="py-3 px-4">{getStatusBadge(request.status)}</td>
                        <td className="py-3 px-4 text-gray-300 font-medium">{request.houseName}</td>
                        <td className="py-3 px-4 text-gray-300">
                          <div className="text-sm">
                            <div>{request.userFirstName} {request.userLastName}</div>
                            <div className="text-gray-400">{request.userEmail}</div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant={request.isBettingHouse === 'sim' ? 'default' : 'secondary'}>
                            {request.isBettingHouse === 'sim' ? 'Sim' : 'Não'}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant={request.isChinese === 'sim' ? 'default' : 'secondary'}>
                            {request.isChinese === 'sim' ? 'Sim' : 'Não'}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-gray-400 text-sm">
                          {formatDate(request.createdAt)}
                        </td>
                        <td className="py-3 px-4">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setSelectedRequest(request);
                              setAdminNotes(request.adminNotes || "");
                            }}
                            className="text-blue-400 hover:text-blue-300"
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            Ver
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards - Hidden on desktop */}
              <div className="lg:hidden space-y-3">
                {requests.map((request: FormQrCode) => (
                  <div
                    key={request.id}
                    className="p-4 bg-gray-900 rounded-lg border border-gray-600 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-400 text-sm">#{request.id}</span>
                        {getStatusBadge(request.status)}
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setSelectedRequest(request);
                          setAdminNotes(request.adminNotes || "");
                        }}
                        className="text-blue-400 hover:text-blue-300"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </div>
                    
                    <div>
                      <h3 className="text-white font-medium text-lg">{request.houseName}</h3>
                      <p className="text-gray-300 text-sm">
                        {request.userFirstName} {request.userLastName}
                      </p>
                      <p className="text-gray-400 text-xs">{request.userEmail}</p>
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                      <div className="flex items-center gap-1 text-xs">
                        <span className="text-gray-400">Casa de aposta:</span>
                        <Badge variant={request.isBettingHouse === 'sim' ? 'default' : 'secondary'} className="text-xs">
                          {request.isBettingHouse === 'sim' ? 'Sim' : 'Não'}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1 text-xs">
                        <span className="text-gray-400">Chinesa:</span>
                        <Badge variant={request.isChinese === 'sim' ? 'default' : 'secondary'} className="text-xs">
                          {request.isChinese === 'sim' ? 'Sim' : 'Não'}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="text-xs text-gray-400">
                      {formatDate(request.createdAt)}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Modal de detalhes */}
      <Dialog open={!!selectedRequest} onOpenChange={() => setSelectedRequest(null)}>
        <DialogContent className="max-w-2xl w-[95vw] max-h-[90vh] bg-gray-800 border-gray-700 overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white text-lg">
              Detalhes da Solicitação #{selectedRequest?.id}
            </DialogTitle>
          </DialogHeader>
          
          {selectedRequest && (
            <div className="space-y-4 lg:space-y-6">
              {/* Informações básicas */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 lg:gap-4">
                <div>
                  <Label className="text-gray-300 text-sm">Status</Label>
                  <div className="mt-1">{getStatusBadge(selectedRequest.status)}</div>
                </div>
                <div>
                  <Label className="text-gray-300 text-sm">Casa</Label>
                  <div className="mt-1 text-white font-medium">{selectedRequest.houseName}</div>
                </div>
                <div className="sm:col-span-2">
                  <Label className="text-gray-300 text-sm">Usuário</Label>
                  <div className="mt-1 text-white">
                    {selectedRequest.userFirstName} {selectedRequest.userLastName}
                    <div className="text-sm text-gray-400">{selectedRequest.userEmail}</div>
                  </div>
                </div>
                <div>
                  <Label className="text-gray-300 text-sm">ID do Usuário</Label>
                  <div className="mt-1 text-white">#{selectedRequest.masterUserId}</div>
                </div>
                <div>
                  <Label className="text-gray-300 text-sm">Casa de Aposta</Label>
                  <div className="mt-1">
                    <Badge variant={selectedRequest.isBettingHouse === 'sim' ? 'default' : 'secondary'}>
                      {selectedRequest.isBettingHouse === 'sim' ? 'Sim' : 'Não'}
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label className="text-gray-300 text-sm">Casa Chinesa</Label>
                  <div className="mt-1">
                    <Badge variant={selectedRequest.isChinese === 'sim' ? 'default' : 'secondary'}>
                      {selectedRequest.isChinese === 'sim' ? 'Sim' : 'Não'}
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label className="text-gray-300 text-sm">Criado em</Label>
                  <div className="mt-1 text-white text-sm">{formatDate(selectedRequest.createdAt)}</div>
                </div>
                <div>
                  <Label className="text-gray-300 text-sm">Atualizado em</Label>
                  <div className="mt-1 text-white text-sm">{formatDate(selectedRequest.updatedAt)}</div>
                </div>
              </div>

              {/* QR Code */}
              <div>
                <div className="flex items-center justify-between">
                  <Label className="text-gray-300 text-sm">Código QR</Label>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      navigator.clipboard.writeText(selectedRequest.qrCode);
                      toast({
                        title: "QR Code copiado",
                        description: "O código QR foi copiado para a área de transferência.",
                      });
                    }}
                    className="text-blue-400 hover:text-blue-300 p-1 h-auto"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
                <div className="mt-2 p-3 bg-gray-900 rounded border border-gray-600">
                  <div className="text-gray-300 text-xs lg:text-sm font-mono break-all max-h-24 lg:max-h-32 overflow-y-auto">
                    {selectedRequest.qrCode}
                  </div>
                </div>
              </div>

              {/* Notas administrativas */}
              <div>
                <Label htmlFor="adminNotes" className="text-gray-300 text-sm">
                  Notas Administrativas
                </Label>
                <Textarea
                  id="adminNotes"
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Adicione notas sobre esta solicitação..."
                  className="mt-2 bg-gray-700 border-gray-600 text-white text-sm"
                  rows={3}
                />
              </div>

              {/* Botões de ação */}
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-4">
                <Button
                  onClick={() => handleStatusUpdate("approved")}
                  disabled={updateRequestMutation.isPending}
                  className="bg-green-600 hover:bg-green-700 flex-1 sm:flex-none"
                >
                  <Check className="w-4 h-4 mr-2" />
                  Aprovar
                </Button>
                <Button
                  onClick={() => handleStatusUpdate("rejected")}
                  disabled={updateRequestMutation.isPending}
                  variant="destructive"
                  className="flex-1 sm:flex-none"
                >
                  <X className="w-4 h-4 mr-2" />
                  Rejeitar
                </Button>
                <Button
                  onClick={() => setSelectedRequest(null)}
                  variant="outline"
                  className="flex-1 sm:flex-none sm:ml-auto"
                >
                  Cancelar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}