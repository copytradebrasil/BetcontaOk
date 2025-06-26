import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { registerSchema } from "@shared/schema";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { fetchAddressByCep } from "@/lib/cep";
import { UserPlus, X, ChevronLeft, ChevronRight } from "lucide-react";
import type { z } from "zod";

type RegisterFormData = z.infer<typeof registerSchema>;

interface RegisterModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onShowLogin: () => void;
}

export default function RegisterModal({ open, onOpenChange, onShowLogin }: RegisterModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 3;

  const form = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      cpf: "",
      email: "",
      dateOfBirth: "",
      cep: "",
      street: "",
      number: "",
      neighborhood: "",
      city: "",
      state: "",
      complement: "",
      password: "",
      confirmPassword: "",
    },
  });

  // Watch for field interference and fix it
  useEffect(() => {
    const subscription = form.watch((values, { name }) => {
      // Clear number field if it gets contaminated with date data
      if (values.number) {
        const numberValue = values.number;
        // Check for date patterns or excessive length that indicates contamination
        if (numberValue.includes('-') || numberValue.length > 10 || /\d{4}-\d{2}-\d{2}/.test(numberValue)) {
          console.log('Clearing contaminated number field:', numberValue);
          form.setValue('number', '', { shouldValidate: false });
        }
      }
    });
    return () => subscription.unsubscribe();
  }, [form]);

  // Additional protection - clear number field when modal opens
  useEffect(() => {
    if (open) {
      // Reset the form when modal opens to prevent any carried-over data
      form.setValue('number', '');
    }
  }, [open, form]);

  const registerMutation = useMutation({
    mutationFn: async (data: RegisterFormData) => {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Erro ao criar conta");
      }

      return response.json();
    },
    onSuccess: (response) => {
      toast({
        title: "Sucesso",
        description: response.message || "Cadastro realizado com sucesso!",
      });
      onOpenChange(false);
      // Refresh user data and redirect to dashboard since user is now logged in
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao criar conta",
        variant: "destructive",
      });
    },
  });

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const validateCurrentStep = async () => {
    const fieldsToValidate = getFieldsForStep(currentStep);
    const isValid = await form.trigger(fieldsToValidate);
    return isValid;
  };

  const getFieldsForStep = (step: number): (keyof RegisterFormData)[] => {
    switch (step) {
      case 1:
        return ['firstName', 'lastName', 'email', 'cpf', 'dateOfBirth'];
      case 2:
        return ['cep', 'number'];
      case 3:
        return ['password', 'confirmPassword'];
      default:
        return [];
    }
  };

  const handleNext = async () => {
    const isValid = await validateCurrentStep();
    if (isValid) {
      nextStep();
    }
  };

  const onSubmit = async (data: RegisterFormData) => {
    registerMutation.mutate(data);
  };

  const handleCepBlur = async (cep: string) => {
    const cleanCep = cep.replace(/\D/g, "");
    if (cleanCep.length === 8) {
      try {
        const address = await fetchAddressByCep(cleanCep);
        if (address) {
          form.setValue("street", address.logradouro);
          form.setValue("neighborhood", address.bairro);
          form.setValue("city", address.localidade);
          form.setValue("state", address.uf);
        }
      } catch (error) {
        toast({
          title: "Erro",
          description: "CEP não encontrado",
          variant: "destructive",
        });
      }
    }
  };

  const formatCpf = (value: string) => {
    return value
      .replace(/\D/g, "")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
  };

  const formatCep = (value: string) => {
    return value
      .replace(/\D/g, "")
      .replace(/(\d{5})(\d)/, "$1-$2");
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <Card className="bg-betconta-accent border-gray-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-base sm:text-lg">Dados Pessoais</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 pt-0">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem className="space-y-1">
                      <FormLabel className="text-gray-300 text-xs">Nome *</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          value={field.value || ""}
                          placeholder="João"
                          autoComplete="given-name"
                          className="bg-betconta-secondary border-gray-600 text-white focus:border-betconta-primary h-9 text-sm"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem className="space-y-1">
                      <FormLabel className="text-gray-300 text-xs">Sobrenome *</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          value={field.value || ""}
                          placeholder="Silva"
                          autoComplete="family-name"
                          className="bg-betconta-secondary border-gray-600 text-white focus:border-betconta-primary h-9 text-sm"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <FormField
                  control={form.control}
                  name="cpf"
                  render={({ field }) => (
                    <FormItem className="space-y-1">
                      <FormLabel className="text-gray-300 text-xs">CPF *</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          value={field.value || ""}
                          placeholder="000.000.000-00"
                          inputMode="numeric"
                          onChange={(e) => {
                            const formatted = formatCpf(e.target.value);
                            field.onChange(formatted);
                          }}
                          className="bg-betconta-secondary border-gray-600 text-white focus:border-betconta-primary h-9 text-sm"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="dateOfBirth"
                  render={({ field }) => (
                    <FormItem className="space-y-1">
                      <FormLabel className="text-gray-300 text-xs">Data de Nascimento *</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="date"
                          max={new Date().toISOString().split('T')[0]}
                          autoComplete="bday"
                          className="bg-betconta-secondary border-gray-600 text-white focus:border-betconta-primary h-9 text-sm [color-scheme:dark]"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem className="space-y-1">
                    <FormLabel className="text-gray-300 text-xs">E-mail *</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        value={field.value || ""}
                        type="email"
                        inputMode="email"
                        autoComplete="email"
                        placeholder="seu@email.com"
                        className="bg-betconta-secondary border-gray-600 text-white focus:border-betconta-primary h-9 text-sm"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
        );

      case 2:
        return (
          <Card className="bg-betconta-accent border-gray-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-base sm:text-lg">Endereço</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 pt-0">
              <FormField
                control={form.control}
                name="cep"
                render={({ field }) => (
                  <FormItem className="space-y-1">
                    <FormLabel className="text-gray-300 text-xs">CEP *</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        value={field.value || ""}
                        placeholder="00000-000"
                        inputMode="numeric"
                        onChange={(e) => {
                          const formatted = formatCep(e.target.value);
                          field.onChange(formatted);
                        }}
                        onBlur={(e) => handleCepBlur(e.target.value)}
                        className="bg-betconta-secondary border-gray-600 text-white focus:border-betconta-primary h-9 text-sm"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="street"
                render={({ field }) => (
                  <FormItem className="space-y-1">
                    <FormLabel className="text-gray-300 text-xs">Rua</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        value={field.value || ""}
                        placeholder="Preenchimento automático"
                        readOnly
                        className="bg-gray-700 border-gray-600 text-gray-300 cursor-not-allowed h-9 text-sm"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <FormField
                  control={form.control}
                  name="neighborhood"
                  render={({ field }) => (
                    <FormItem className="space-y-1">
                      <FormLabel className="text-gray-300 text-xs">Bairro</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          value={field.value || ""}
                          placeholder="Preenchimento automático"
                          readOnly
                          className="bg-gray-700 border-gray-600 text-gray-300 cursor-not-allowed h-9 text-sm"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem className="space-y-1">
                      <FormLabel className="text-gray-300 text-xs">Cidade</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          value={field.value || ""}
                          placeholder="Preenchimento automático"
                          readOnly
                          className="bg-gray-700 border-gray-600 text-gray-300 cursor-not-allowed h-9 text-sm"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="state"
                render={({ field }) => (
                  <FormItem className="space-y-1">
                    <FormLabel className="text-gray-300 text-xs">Estado</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        value={field.value || ""}
                        placeholder="Preenchimento automático"
                        readOnly
                        className="bg-gray-700 border-gray-600 text-gray-300 cursor-not-allowed h-9 text-sm"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
        );

      case 3:
        return (
          <Card className="bg-betconta-accent border-gray-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-base sm:text-lg">Senha</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 pt-0">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem className="space-y-1">
                      <FormLabel className="text-gray-300 text-xs">Senha *</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="password"
                          autoComplete="new-password"
                          placeholder="••••••••"
                          className="bg-betconta-secondary border-gray-600 text-white focus:border-betconta-primary h-9 text-sm"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem className="space-y-1">
                      <FormLabel className="text-gray-300 text-xs">Confirmar Senha *</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="password"
                          autoComplete="new-password"
                          placeholder="••••••••"
                          className="bg-betconta-secondary border-gray-600 text-white focus:border-betconta-primary h-9 text-sm"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-betconta-secondary border-betconta-accent w-[95vw] max-w-lg mx-auto p-3 sm:p-6 max-h-[95vh] overflow-y-auto">
        <DialogHeader className="pb-2">
          <div className="flex justify-between items-center">
            <div>
              <DialogTitle className="text-lg sm:text-2xl font-bold text-white">Criar Conta</DialogTitle>
              <div className="text-xs text-gray-400 mt-1">
                Passo {currentStep} de {totalSteps}
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="text-gray-400 hover:text-white p-2 h-auto"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
          
          {/* Progress bar */}
          <div className="w-full bg-gray-700 rounded-full h-1.5 mt-3">
            <div 
              className="bg-betconta-primary h-1.5 rounded-full transition-all duration-300 ease-in-out"
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            />
          </div>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" autoComplete="off">
            {/* Honeypot fields to confuse browser autocomplete */}
            <div style={{ display: 'none' }}>
              <input type="text" name="fake_username" tabIndex={-1} autoComplete="off" />
              <input type="email" name="fake_email" tabIndex={-1} autoComplete="off" />
              <input type="date" name="fake_date" tabIndex={-1} autoComplete="off" />
              <input type="text" name="fake_number" tabIndex={-1} autoComplete="off" />
            </div>
            {renderStepContent()}
            
            {/* Navigation buttons */}
            <div className="flex justify-between items-center pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={prevStep}
                disabled={currentStep === 1}
                className="bg-transparent border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white h-9 px-4"
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Anterior
              </Button>
              
              {currentStep < totalSteps ? (
                <Button
                  type="button"
                  onClick={handleNext}
                  className="bg-betconta-primary hover:bg-green-500 text-white h-9 px-6"
                >
                  Próximo
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              ) : (
                <Button
                  type="submit"
                  disabled={registerMutation.isPending}
                  className="bg-betconta-primary hover:bg-green-500 text-white h-9 px-4"
                >
                  <UserPlus className="mr-2 w-4 h-4" />
                  {registerMutation.isPending ? "Criando conta..." : "Criar Conta"}
                </Button>
              )}
            </div>
            
            <div className="text-center pt-2">
              <span className="text-gray-400 text-sm">Já tem conta? </span>
              <Button
                type="button"
                variant="link"
                onClick={onShowLogin}
                className="text-betconta-primary hover:text-green-400 text-sm font-medium h-8 px-2"
              >
                Fazer login
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}