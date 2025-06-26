import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { formatDateTime } from "@/lib/utils";
import { Check, X, Eye, Clock } from "lucide-react";

interface QrCodeRequest {
  id: number;
  masterUserId: number;
  isBettingHouse: boolean;
  isChinese: boolean;
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

export default function QrCodeRequestsPage() {
  const [selectedRequest, setSelectedRequest] = useState<QrCodeRequest | null>(null);
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Liberar QR Code</h1>
      </div>

      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Solicitações de QR Code</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-gray-400">Carregando solicitações...</p>
          ) : requests.length === 0 ? (
            <p className="text-gray-400">Nenhuma solicitação encontrada</p>
          ) : (
            <div className="space-y-3">
              {requests.map((request: QrCodeRequest) => (
                <div
                  key={request.id}
                  className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 bg-gray-900 rounded border border-gray-600"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      {getStatusBadge(request.status)}
                      <span className="text-xs text-gray-400">
                        ID #{request.id}
                      </span>
                    </div>
                    <h3 className="text-white font-medium text-sm mb-1">
                      {request.houseName}
                    </h3>
                    <div className="text-xs text-gray-300 space-y-1">
                      <p>Usuário: {request.userFirstName} {request.userLastName} ({request.userEmail})</p>
                      <p>Casa de aposta: {request.isBettingHouse ? 'Sim' : 'Não'}</p>
                      <p>Chinesa: {request.isChinese ? 'Sim' : 'Não'}</p>
                      <p>Criado em: {formatDateTime(request.createdAt)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 justify-end sm:justify-start">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setSelectedRequest(request);
                        setAdminNotes(request.adminNotes || "");
                      }}
                      className="text-blue-400 hover:text-blue-300 p-1"
                    >
                      <Eye className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Request Details Modal */}
      <Dialog
        open={!!selectedRequest}
        onOpenChange={(open) => !open && setSelectedRequest(null)}
      >
        <DialogContent className="bg-gray-800 border-gray-700 max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white">
              Detalhes da Solicitação #{selectedRequest?.id}
            </DialogTitle>
          </DialogHeader>
          
          {selectedRequest && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-white text-sm">Nome da Casa</Label>
                  <p className="text-gray-300 text-sm mt-1">{selectedRequest.houseName}</p>
                </div>
                <div>
                  <Label className="text-white text-sm">Status</Label>
                  <div className="mt-1">{getStatusBadge(selectedRequest.status)}</div>
                </div>
                <div>
                  <Label className="text-white text-sm">Casa de Aposta?</Label>
                  <p className="text-gray-300 text-sm mt-1">{selectedRequest.isBettingHouse ? 'Sim' : 'Não'}</p>
                </div>
                <div>
                  <Label className="text-white text-sm">Casa Chinesa?</Label>
                  <p className="text-gray-300 text-sm mt-1">{selectedRequest.isChinese ? 'Sim' : 'Não'}</p>
                </div>
              </div>

              <div>
                <Label className="text-white text-sm">Usuário</Label>
                <p className="text-gray-300 text-sm mt-1">
                  {selectedRequest.userFirstName} {selectedRequest.userLastName} ({selectedRequest.userEmail})
                </p>
              </div>

              <div>
                <Label className="text-white text-sm">QR Code</Label>
                <div className="mt-1 p-3 bg-gray-900 rounded border border-gray-600">
                  <pre className="text-gray-300 text-xs whitespace-pre-wrap break-all">
                    {selectedRequest.qrCode}
                  </pre>
                </div>
              </div>

              <div>
                <Label className="text-white text-sm">Observações do Admin</Label>
                <Textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Adicione observações sobre esta solicitação..."
                  className="bg-gray-700 border-gray-600 text-white mt-1"
                  rows={3}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setSelectedRequest(null)}
                >
                  Cancelar
                </Button>
                <Button
                  className="flex-1 bg-red-600 hover:bg-red-700"
                  onClick={() => handleStatusUpdate('rejected')}
                  disabled={updateRequestMutation.isPending}
                >
                  <X className="w-4 h-4 mr-2" />
                  Rejeitar
                </Button>
                <Button
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  onClick={() => handleStatusUpdate('approved')}
                  disabled={updateRequestMutation.isPending}
                >
                  <Check className="w-4 h-4 mr-2" />
                  Aprovar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}