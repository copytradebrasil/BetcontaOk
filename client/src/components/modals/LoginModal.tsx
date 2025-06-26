import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema } from "@shared/schema";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { LogIn, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { z } from "zod";

type LoginFormData = z.infer<typeof loginSchema>;

interface LoginModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onShowRegister: () => void;
  onShowForgotPassword: () => void;
}

export default function LoginModal({ open, onOpenChange, onShowRegister, onShowForgotPassword }: LoginModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        const user = await response.json();
        console.log("Login successful:", user);
        toast({
          title: "Login realizado!",
          description: "Bem-vindo ao BetConta",
        });
        onOpenChange(false);
        // Refresh the page to update auth state
        window.location.reload();
      } else {
        const error = await response.json();
        toast({
          title: "Erro no login",
          description: error.message || "Credenciais inválidas",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Login error:", error);
      toast({
        title: "Erro",
        description: "Erro de conexão. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-betconta-secondary border-betconta-accent w-[95vw] max-w-md mx-auto p-4 sm:p-6 max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-3">
          <div className="flex justify-between items-center">
            <DialogTitle className="text-xl sm:text-2xl font-bold text-white">Entrar</DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="text-gray-400 hover:text-white p-2 h-auto"
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
                  <FormLabel className="text-gray-300 text-sm font-medium">E-mail</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="email"
                      inputMode="email"
                      autoComplete="email"
                      placeholder="seu@email.com"
                      className="bg-betconta-accent border-gray-600 text-white focus:border-betconta-primary h-12 text-base"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-300 text-sm font-medium">Senha</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="password"
                      autoComplete="current-password"
                      placeholder="••••••••"
                      className="bg-betconta-accent border-gray-600 text-white focus:border-betconta-primary h-12 text-base"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-betconta-primary hover:bg-green-500 text-white h-12 text-base font-medium"
            >
              <LogIn className="mr-2 w-4 h-4" />
              {isLoading ? "Entrando..." : "Entrar"}
            </Button>
            
            <div className="text-center pt-2">
              <Button
                type="button"
                variant="link"
                onClick={onShowForgotPassword}
                className="text-betconta-primary hover:text-green-400 text-sm h-10 px-4"
              >
                Esqueci minha senha
              </Button>
            </div>
            
            <div className="text-center pt-1">
              <span className="text-gray-400 text-sm">Não tem conta? </span>
              <Button
                type="button"
                variant="link"
                onClick={onShowRegister}
                className="text-betconta-primary hover:text-green-400 text-sm font-medium h-8 px-2"
              >
                Criar conta
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
