import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { UserCheck, FileText, Target } from "lucide-react";

const affiliateRequestSchema = z.object({
  motivation: z.string().min(50, "Descreva sua motivação em pelo menos 50 caracteres"),
  experience: z.string().min(30, "Descreva sua experiência em pelo menos 30 caracteres"),
  expectedVolume: z.string().min(1, "Volume esperado é obrigatório"),
  whatsapp: z.string().min(10, "WhatsApp é obrigatório"),
});

type AffiliateRequestData = z.infer<typeof affiliateRequestSchema>;

interface AffiliateRequestModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function AffiliateRequestModal({ open, onOpenChange }: AffiliateRequestModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<AffiliateRequestData>({
    resolver: zodResolver(affiliateRequestSchema),
    defaultValues: {
      motivation: "",
      experience: "",
      expectedVolume: "",
      whatsapp: "",
    },
  });

  const requestAffiliateMutation = useMutation({
    mutationFn: async (data: AffiliateRequestData) => {
      return await apiRequest('POST', '/api/affiliate/request', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      toast({
        title: "Solicitação Enviada",
        description: "Sua solicitação de afiliação foi enviada para análise. Aguarde a aprovação.",
      });
      onOpenChange(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao enviar solicitação de afiliação",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: AffiliateRequestData) => {
    requestAffiliateMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-gray-900 border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <UserCheck className="h-5 w-5 text-blue-400" />
            Solicitação de Programa de Afiliados
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-4">
            <h3 className="text-blue-300 font-semibold mb-2">Benefícios do Programa</h3>
            <ul className="text-sm text-gray-300 space-y-1">
              <li>• Comissões por conta filha criada</li>
              <li>• Preço de venda mínimo e máximo por conta já definido</li>
              <li>• Link personalizado para suas vendas</li>
              <li>• Painel de controle completo</li>
            </ul>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="motivation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white flex items-center gap-2">
                      <Target className="h-4 w-4" />
                      Por que deseja ser afiliado?
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Descreva sua motivação para se tornar um afiliado BetConta..."
                        className="bg-gray-800 border-gray-600 text-white"
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="experience"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Experiência anterior
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Conte sobre sua experiência com vendas, marketing digital ou área relacionada..."
                        className="bg-gray-800 border-gray-600 text-white"
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="expectedVolume"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white">Volume esperado (contas/mês)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Ex: 10"
                          className="bg-gray-800 border-gray-600 text-white"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="whatsapp"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white">WhatsApp</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="(11) 99999-9999"
                          className="bg-gray-800 border-gray-600 text-white"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  className="border-gray-600 text-gray-300"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={requestAffiliateMutation.isPending}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {requestAffiliateMutation.isPending ? "Enviando..." : "Enviar Solicitação"}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}