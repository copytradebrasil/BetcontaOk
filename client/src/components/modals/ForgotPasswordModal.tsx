import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { forgotPasswordSchema } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Send, X } from "lucide-react";
import type { z } from "zod";

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

interface ForgotPasswordModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onShowLogin: () => void;
}

export default function ForgotPasswordModal({ open, onOpenChange, onShowLogin }: ForgotPasswordModalProps) {
  const { toast } = useToast();

  const form = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const forgotPasswordMutation = useMutation({
    mutationFn: async (data: ForgotPasswordFormData) => {
      await apiRequest("POST", "/api/forgot-password", data);
    },
    onSuccess: () => {
      toast({
        title: "Sucesso",
        description: "Link de recuperação enviado para seu e-mail!",
      });
      onOpenChange(false);
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Erro ao enviar link de recuperação",
        variant: "destructive",
      });
    },
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    forgotPasswordMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-betconta-secondary border-betconta-accent sm:max-w-[425px]">
        <DialogHeader>
          <div className="flex justify-between items-center">
            <DialogTitle className="text-2xl font-bold text-white">Recuperar Senha</DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="text-gray-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-300">E-mail</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="email"
                      placeholder="seu@email.com"
                      className="bg-betconta-accent border-gray-600 text-white focus:border-betconta-primary"
                    />
                  </FormControl>
                  <FormMessage />
                  <p className="text-gray-400 text-sm mt-2">
                    Enviaremos um link para redefinir sua senha
                  </p>
                </FormItem>
              )}
            />
            
            <Button
              type="submit"
              disabled={forgotPasswordMutation.isPending}
              className="w-full bg-betconta-primary hover:bg-green-500 text-white"
            >
              <Send className="mr-2 w-4 h-4" />
              {forgotPasswordMutation.isPending ? "Enviando..." : "Enviar Link"}
            </Button>
            
            <div className="text-center">
              <Button
                type="button"
                variant="link"
                onClick={onShowLogin}
                className="text-betconta-primary hover:text-green-400 text-sm"
              >
                Voltar ao login
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
