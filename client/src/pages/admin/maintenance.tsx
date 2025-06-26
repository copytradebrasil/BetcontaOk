import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertTriangle,
  Plus,
  Edit,
  Trash2,
  Eye,
  EyeOff,
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface Alert {
  id: number;
  title: string;
  message: string;
  type: "info" | "warning" | "error" | "success";
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function MaintenancePage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showCreateAlert, setShowCreateAlert] = useState(false);
  const [editingAlert, setEditingAlert] = useState<Alert | null>(null);

  // Fetch alerts
  const { data: alerts = [], isLoading } = useQuery({
    queryKey: ["/api/admin/alerts"],
  });

  // Create alert mutation
  const createAlertMutation = useMutation({
    mutationFn: async (data: {
      title: string;
      message: string;
      type: string;
    }) => {
      return await apiRequest("POST", "/api/admin/alerts", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/alerts"] });
      toast({
        title: "Alerta criado",
        description: "O alerta foi criado com sucesso",
      });
      setShowCreateAlert(false);
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao criar alerta",
        variant: "destructive",
      });
    },
  });

  // Update alert mutation
  const updateAlertMutation = useMutation({
    mutationFn: async ({
      id,
      ...data
    }: {
      id: number;
      title?: string;
      message?: string;
      type?: string;
      isActive?: boolean;
    }) => {
      return await apiRequest("PATCH", `/api/admin/alerts/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/alerts"] });
      toast({
        title: "Alerta atualizado",
        description: "O alerta foi atualizado com sucesso",
      });
      setEditingAlert(null);
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao atualizar alerta",
        variant: "destructive",
      });
    },
  });

  // Delete alert mutation
  const deleteAlertMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest("DELETE", `/api/admin/alerts/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/alerts"] });
      toast({
        title: "Alerta excluído",
        description: "O alerta foi excluído com sucesso",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao excluir alerta",
        variant: "destructive",
      });
    },
  });

  const handleCreateAlert = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    createAlertMutation.mutate({
      title: formData.get("title") as string,
      message: formData.get("message") as string,
      type: formData.get("type") as string,
    });
  };

  const handleEditAlert = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingAlert) return;
    
    const formData = new FormData(e.currentTarget);
    updateAlertMutation.mutate({
      id: editingAlert.id,
      title: formData.get("title") as string,
      message: formData.get("message") as string,
      type: formData.get("type") as string,
    });
  };

  const toggleAlertStatus = (alert: Alert) => {
    updateAlertMutation.mutate({
      id: alert.id,
      isActive: !alert.isActive,
    });
  };

  const getAlertBadgeColor = (type: string) => {
    switch (type) {
      case "error":
        return "bg-red-500";
      case "warning":
        return "bg-yellow-500";
      case "success":
        return "bg-green-500";
      default:
        return "bg-blue-500";
    }
  };

  const getAlertTypeLabel = (type: string) => {
    switch (type) {
      case "error":
        return "Erro";
      case "warning":
        return "Aviso";
      case "success":
        return "Sucesso";
      default:
        return "Informação";
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Manutenção</h1>
          <p className="text-gray-400">
            Gerencie alertas que aparecem no dashboard dos usuários
          </p>
        </div>
        <Dialog open={showCreateAlert} onOpenChange={setShowCreateAlert}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Novo Alerta
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-gray-800 border-gray-700 max-w-md">
            <DialogHeader>
              <DialogTitle className="text-white">Criar Novo Alerta</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateAlert} className="space-y-4">
              <div>
                <Label htmlFor="title" className="text-white">
                  Título
                </Label>
                <Input
                  id="title"
                  name="title"
                  required
                  className="bg-gray-700 border-gray-600 text-white"
                  placeholder="Ex: Manutenção programada"
                />
              </div>
              <div>
                <Label htmlFor="message" className="text-white">
                  Mensagem
                </Label>
                <Textarea
                  id="message"
                  name="message"
                  required
                  rows={3}
                  className="bg-gray-700 border-gray-600 text-white resize-none"
                  placeholder="Descreva o alerta..."
                />
              </div>
              <div>
                <Label htmlFor="type" className="text-white">
                  Tipo
                </Label>
                <Select name="type" defaultValue="info">
                  <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-700 border-gray-600">
                    <SelectItem value="info">Informação</SelectItem>
                    <SelectItem value="warning">Aviso</SelectItem>
                    <SelectItem value="error">Erro</SelectItem>
                    <SelectItem value="success">Sucesso</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowCreateAlert(false)}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                  disabled={createAlertMutation.isPending}
                >
                  {createAlertMutation.isPending ? "Criando..." : "Criar"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Alertas Ativos</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-gray-400">Carregando alertas...</p>
          ) : alerts.length === 0 ? (
            <p className="text-gray-400">Nenhum alerta criado ainda</p>
          ) : (
            <div className="space-y-3">
              {alerts.map((alert: Alert) => (
                <div
                  key={alert.id}
                  className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 bg-gray-900 rounded border border-gray-600"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className={`${getAlertBadgeColor(alert.type)} text-white text-xs`}>
                        {getAlertTypeLabel(alert.type)}
                      </Badge>
                      {alert.isActive ? (
                        <Eye className="w-3 h-3 text-green-500" />
                      ) : (
                        <EyeOff className="w-3 h-3 text-gray-500" />
                      )}
                    </div>
                    <h3 className="text-white font-medium text-sm truncate mb-1">{alert.title}</h3>
                    <p className="text-gray-300 text-xs line-clamp-2">{alert.message}</p>
                    <p className="text-gray-500 text-xs mt-1">
                      {new Date(alert.createdAt).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 justify-end sm:justify-start">
                    <Switch
                      checked={alert.isActive}
                      onCheckedChange={() => toggleAlertStatus(alert)}
                      disabled={updateAlertMutation.isPending}
                    />
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setEditingAlert(alert)}
                      className="text-blue-400 hover:text-blue-300 p-1"
                    >
                      <Edit className="w-3 h-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => deleteAlertMutation.mutate(alert.id)}
                      className="text-red-400 hover:text-red-300 p-1"
                      disabled={deleteAlertMutation.isPending}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Alert Dialog */}
      <Dialog
        open={!!editingAlert}
        onOpenChange={(open) => !open && setEditingAlert(null)}
      >
        <DialogContent className="bg-gray-800 border-gray-700 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">Editar Alerta</DialogTitle>
          </DialogHeader>
          {editingAlert && (
            <form onSubmit={handleEditAlert} className="space-y-4">
              <div>
                <Label htmlFor="edit-title" className="text-white">
                  Título
                </Label>
                <Input
                  id="edit-title"
                  name="title"
                  defaultValue={editingAlert.title}
                  required
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </div>
              <div>
                <Label htmlFor="edit-message" className="text-white">
                  Mensagem
                </Label>
                <Textarea
                  id="edit-message"
                  name="message"
                  defaultValue={editingAlert.message}
                  required
                  rows={3}
                  className="bg-gray-700 border-gray-600 text-white resize-none"
                />
              </div>
              <div>
                <Label htmlFor="edit-type" className="text-white">
                  Tipo
                </Label>
                <Select name="type" defaultValue={editingAlert.type}>
                  <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-700 border-gray-600">
                    <SelectItem value="info">Informação</SelectItem>
                    <SelectItem value="warning">Aviso</SelectItem>
                    <SelectItem value="error">Erro</SelectItem>
                    <SelectItem value="success">Sucesso</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => setEditingAlert(null)}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                  disabled={updateAlertMutation.isPending}
                >
                  {updateAlertMutation.isPending ? "Salvando..." : "Salvar"}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}