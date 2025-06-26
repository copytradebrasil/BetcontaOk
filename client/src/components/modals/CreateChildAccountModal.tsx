import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, AlertTriangle, Calendar as CalendarIcon, Upload, Eye, CheckCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { formatCpf, formatPhone, formatCep, cn } from "@/lib/utils";
import { fetchAddressByCep } from "@/lib/cep";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";

// Step 1 Schema
const step1Schema = z.object({
  name: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
  cpf: z.string().min(11, "CPF deve ter 11 dígitos"),
  whatsapp: z.string().min(10, "WhatsApp deve ter pelo menos 10 dígitos"),
  email: z.string().email("Email inválido"),
  dateOfBirth: z.date({ required_error: "Data de nascimento é obrigatória" }),
});

// Step 2 Schema  
const step2Schema = z.object({
  rgNumber: z.string().min(6, "Número do RG é obrigatório"),
  rgExpeditionDate: z.date({ required_error: "Data de expedição é obrigatória" }),
  rgExpeditionOrgan: z.string().min(2, "Órgão expedidor é obrigatório"),
  rgExpeditionUf: z.string().min(2, "UF é obrigatória"),
  motherName: z.string().min(3, "Nome da mãe é obrigatório"),
  cep: z.string().min(8, "CEP deve ter 8 dígitos"),
  street: z.string().min(3, "Endereço é obrigatório"),
  number: z.string().min(1, "Número é obrigatório"),
  neighborhood: z.string().min(2, "Bairro é obrigatório"),
  city: z.string().min(2, "Cidade é obrigatória"),
  state: z.string().min(2, "Estado é obrigatório"),
});

// Step 3 Schema
const step3Schema = z.object({
  documentFront: z.any().refine((file) => file && file.length > 0, "Documento frente é obrigatório"),
  documentBack: z.any().refine((file) => file && file.length > 0, "Documento verso é obrigatório"),
  selfie: z.any().refine((file) => file && file.length > 0, "Selfie é obrigatória"),
});

type Step1Data = z.infer<typeof step1Schema>;
type Step2Data = z.infer<typeof step2Schema>;
type Step3Data = z.infer<typeof step3Schema>;

interface CreateChildAccountModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const UF_OPTIONS = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", 
  "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN", 
  "RS", "RO", "RR", "SC", "SP", "SE", "TO"
];

export default function CreateChildAccountModal({ open, onOpenChange }: CreateChildAccountModalProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [step1Data, setStep1Data] = useState<Step1Data | null>(null);
  const [step2Data, setStep2Data] = useState<Step2Data | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Preview states for images
  const [documentFrontPreview, setDocumentFrontPreview] = useState<string | null>(null);
  const [documentBackPreview, setDocumentBackPreview] = useState<string | null>(null);
  const [selfiePreview, setSelfiePreview] = useState<string | null>(null);

  // Form instances
  const step1Form = useForm<Step1Data>({
    resolver: zodResolver(step1Schema),
    defaultValues: {
      name: "",
      cpf: "",
      whatsapp: "",
      email: "",
    },
  });

  const step2Form = useForm<Step2Data>({
    resolver: zodResolver(step2Schema),
    defaultValues: {
      rgNumber: "",
      rgExpeditionOrgan: "",
      rgExpeditionUf: "",
      motherName: "",
      cep: "",
      street: "",
      number: "",
      neighborhood: "",
      city: "",
      state: "",
    },
  });

  const step3Form = useForm<Step3Data>({
    resolver: zodResolver(step3Schema),
  });

  // Mutations
  const checkCpfMutation = useMutation({
    mutationFn: async (cpf: string) => {
      const response = await fetch('/api/check-cpf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cpf }),
      });
      const data = await response.json();
      return data.exists;
    },
  });

  const checkRgMutation = useMutation({
    mutationFn: async (rgNumber: string) => {
      const response = await fetch('/api/check-rg', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rgNumber }),
      });
      const data = await response.json();
      return data.exists;
    },
  });

  const createAccountMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      await apiRequest("POST", "/api/child-accounts", formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/child-accounts"] });
      toast({
        title: "Sucesso",
        description: "Conta filha criada com sucesso!",
      });
      onOpenChange(false);
      resetForm();
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Erro ao criar conta filha",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setCurrentStep(1);
    setStep1Data(null);
    setStep2Data(null);
    setDocumentFrontPreview(null);
    setDocumentBackPreview(null);
    setSelfiePreview(null);
    step1Form.reset();
    step2Form.reset();
    step3Form.reset();
  };

  // Handle CEP lookup
  const handleCepChange = async (cep: string) => {
    if (cep.length === 8) {
      const addressData = await fetchAddressByCep(cep);
      if (addressData && !addressData.erro) {
        step2Form.setValue("street", addressData.logradouro);
        step2Form.setValue("neighborhood", addressData.bairro);
        step2Form.setValue("city", addressData.localidade);
        step2Form.setValue("state", addressData.uf);
      }
    }
  };

  // File preview handlers
  const handleFilePreview = (file: File, setPreview: (url: string) => void) => {
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  // Step 1 Submit
  const handleStep1Submit = async (data: Step1Data) => {
    console.log("Step 1 submit data:", data);
    
    // Check if CPF already exists
    const cpfExists = await checkCpfMutation.mutateAsync(data.cpf);
    if (cpfExists) {
      toast({
        title: "CPF já cadastrado",
        description: "Este CPF já está cadastrado no sistema",
        variant: "destructive",
      });
      return;
    }

    setStep1Data(data);
    console.log("Step 1 data saved:", data);
    setCurrentStep(2);
  };

  // Step 2 Submit
  const handleStep2Submit = async (data: Step2Data) => {
    // Check if RG already exists
    const rgExists = await checkRgMutation.mutateAsync(data.rgNumber);
    if (rgExists) {
      toast({
        title: "RG já cadastrado",
        description: "Este número de RG já está cadastrado no sistema",
        variant: "destructive",
      });
      return;
    }

    setStep2Data(data);
    console.log("Step 2 data saved:", data);
    setCurrentStep(3);
  };

  // Step 3 Submit - usando abordagem alternativa
  const handleStep3Submit = async (data: Step3Data) => {
    console.log("=== STEP 3 SUBMIT START ===");

    if (!step1Data || !step2Data) {
      toast({
        title: "Erro",
        description: "Dados dos passos anteriores foram perdidos. Reinicie o processo.",
        variant: "destructive",
      });
      return;
    }

    try {
      // 1. Primeiro enviar dados sem arquivos via JSON
      const accountData = {
        ...step1Data,
        ...step2Data,
        dateOfBirth: step1Data.dateOfBirth?.toISOString(),
        rgExpeditionDate: step2Data.rgExpeditionDate?.toISOString(),
      };

      console.log("Sending account data:", accountData);

      const response = await fetch('/api/child-accounts-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(accountData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao criar conta');
      }

      const result = await response.json();
      console.log("Account created:", result);

      // 2. Depois enviar arquivos se existirem
      if (data.documentFront?.[0] || data.documentBack?.[0] || data.selfie?.[0]) {
        const formData = new FormData();
        formData.append('childAccountId', result.childAccount.id.toString());
        
        if (data.documentFront?.[0]) {
          formData.append("documentFront", data.documentFront[0]);
        }
        if (data.documentBack?.[0]) {
          formData.append("documentBack", data.documentBack[0]);
        }
        if (data.selfie?.[0]) {
          formData.append("selfie", data.selfie[0]);
        }

        const uploadResponse = await fetch('/api/upload-kyc-documents', {
          method: 'POST',
          credentials: 'include',
          body: formData,
        });

        if (!uploadResponse.ok) {
          console.warn("Falha no upload de documentos, mas conta foi criada");
        }
      }

      toast({
        title: "Sucesso!",
        description: "Conta filha criada com sucesso!",
      });

      queryClient.invalidateQueries({ queryKey: ["/api/child-accounts"] });
      onOpenChange(false);
      setCurrentStep(1);
      setStep1Data(null);
      setStep2Data(null);

    } catch (error: any) {
      console.error("Error creating account:", error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao criar conta filha",
        variant: "destructive",
      });
    }
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case 1: return "Informações Pessoais";
      case 2: return "Documentos e Endereço";
      case 3: return "Upload de Documentos";
      default: return "";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-betconta-secondary border-betconta-accent w-[95vw] max-w-lg max-h-[90vh] overflow-y-auto p-3 sm:p-6">
        <DialogHeader className="pb-3">
          <div className="flex justify-between items-center">
            <DialogTitle className="text-lg font-bold text-white">
              Nova Conta - {getStepTitle()}
            </DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="text-gray-400 hover:text-white h-8 w-8 p-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>

        {/* Progress Bar */}
        <div className="space-y-1 mb-4">
          <div className="flex justify-between text-xs text-gray-400">
            <span>Etapa {currentStep} de 3</span>
            <span>{Math.round((currentStep / 3) * 100)}%</span>
          </div>
          <Progress value={(currentStep / 3) * 100} className="w-full h-1" />
        </div>

        <div className="space-y-4">
          {/* Step 1: Personal Information */}
          {currentStep === 1 && (
            <Form {...step1Form}>
              <form onSubmit={step1Form.handleSubmit(handleStep1Submit)} className="space-y-3">
                <FormField
                  control={step1Form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white text-sm">Nome Completo</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Digite o nome completo"
                          {...field}
                          className="bg-betconta-accent border-gray-600 text-white h-9"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-3">
                  <FormField
                    control={step1Form.control}
                    name="cpf"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white text-sm">CPF</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="000.000.000-00"
                            {...field}
                            onChange={(e) => {
                              const value = e.target.value.replace(/\D/g, '');
                              field.onChange(value);
                            }}
                            className="bg-betconta-accent border-gray-600 text-white h-9"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={step1Form.control}
                    name="whatsapp"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white text-sm">WhatsApp</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="(11) 99999-9999"
                            {...field}
                            onChange={(e) => {
                              const value = e.target.value.replace(/\D/g, '');
                              field.onChange(value);
                            }}
                            className="bg-betconta-accent border-gray-600 text-white h-9"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={step1Form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white text-sm">Email</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="email@exemplo.com"
                          {...field}
                          className="bg-betconta-accent border-gray-600 text-white h-9"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={step1Form.control}
                  name="dateOfBirth"
                  render={({ field }) => {
                    const [displayValue, setDisplayValue] = React.useState(
                      field.value ? format(field.value, "dd/MM/yyyy") : ""
                    );

                    return (
                      <FormItem>
                        <FormLabel className="text-white text-sm">Data de Nascimento</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="DD/MM/AAAA"
                            value={displayValue}
                            onChange={(e) => {
                              const value = e.target.value;
                              // Allow only numbers and slashes
                              const cleaned = value.replace(/[^\d/]/g, '');
                              
                              // Auto-format as DD/MM/YYYY
                              let formatted = cleaned;
                              if (cleaned.length >= 3 && !cleaned.includes('/')) {
                                formatted = cleaned.slice(0, 2) + '/' + cleaned.slice(2);
                              }
                              if (cleaned.length >= 5 && formatted.split('/').length === 2) {
                                const parts = formatted.split('/');
                                formatted = parts[0] + '/' + parts[1].slice(0, 2) + '/' + parts[1].slice(2);
                              }
                              
                              // Limit to DD/MM/YYYY format
                              if (formatted.length > 10) {
                                formatted = formatted.slice(0, 10);
                              }
                              
                              setDisplayValue(formatted);
                              
                              // Try to parse the date when complete
                              if (formatted.length === 10 && formatted.split('/').length === 3) {
                                const [day, month, year] = formatted.split('/').map(Number);
                                if (day && month && year && day <= 31 && month <= 12 && year >= 1900 && year <= new Date().getFullYear()) {
                                  const date = new Date(year, month - 1, day);
                                  if (date.getDate() === day && date.getMonth() === month - 1 && date.getFullYear() === year) {
                                    field.onChange(date);
                                  }
                                }
                              }
                            }}
                            className="bg-betconta-accent border-gray-600 text-white h-9"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    );
                  }}
                />

                <Button
                  type="submit"
                  className="w-full bg-betconta-primary hover:bg-green-500 text-white h-9 text-sm mt-4"
                  disabled={checkCpfMutation.isPending}
                >
                  {checkCpfMutation.isPending ? "Verificando..." : "Próximo"}
                </Button>
              </form>
            </Form>
          )}

          {/* Step 2: Documents and Address */}
          {currentStep === 2 && (
            <Form {...step2Form}>
              <form onSubmit={step2Form.handleSubmit(handleStep2Submit)} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <FormField
                    control={step2Form.control}
                    name="rgNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white text-sm">Número do RG</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="12.345.678-9"
                            {...field}
                            className="bg-betconta-accent border-gray-600 text-white h-9"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={step2Form.control}
                    name="rgExpeditionDate"
                    render={({ field }) => {
                      const [displayValue, setDisplayValue] = React.useState(
                        field.value ? format(field.value, "dd/MM/yyyy") : ""
                      );

                      return (
                        <FormItem>
                          <FormLabel className="text-white text-sm">Data de Expedição</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="DD/MM/AAAA"
                              value={displayValue}
                              onChange={(e) => {
                                const value = e.target.value;
                                // Allow only numbers and slashes
                                const cleaned = value.replace(/[^\d/]/g, '');
                                
                                // Auto-format as DD/MM/YYYY
                                let formatted = cleaned;
                                if (cleaned.length >= 3 && !cleaned.includes('/')) {
                                  formatted = cleaned.slice(0, 2) + '/' + cleaned.slice(2);
                                }
                                if (cleaned.length >= 5 && formatted.split('/').length === 2) {
                                  const parts = formatted.split('/');
                                  formatted = parts[0] + '/' + parts[1].slice(0, 2) + '/' + parts[1].slice(2);
                                }
                                
                                // Limit to DD/MM/YYYY format
                                if (formatted.length > 10) {
                                  formatted = formatted.slice(0, 10);
                                }
                                
                                setDisplayValue(formatted);
                                
                                // Try to parse the date when complete
                                if (formatted.length === 10 && formatted.split('/').length === 3) {
                                  const [day, month, year] = formatted.split('/').map(Number);
                                  if (day && month && year && day <= 31 && month <= 12 && year >= 1900 && year <= new Date().getFullYear()) {
                                    const date = new Date(year, month - 1, day);
                                    if (date.getDate() === day && date.getMonth() === month - 1 && date.getFullYear() === year) {
                                      field.onChange(date);
                                    }
                                  }
                                }
                              }}
                              className="bg-betconta-accent border-gray-600 text-white h-9"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      );
                    }}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <FormField
                    control={step2Form.control}
                    name="rgExpeditionOrgan"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white text-sm">Órgão Expedidor</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="SSP"
                            {...field}
                            className="bg-betconta-accent border-gray-600 text-white h-9"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={step2Form.control}
                    name="rgExpeditionUf"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white text-sm">UF</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-betconta-accent border-gray-600 text-white h-9">
                              <SelectValue placeholder="UF" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {UF_OPTIONS.map((uf) => (
                              <SelectItem key={uf} value={uf}>
                                {uf}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={step2Form.control}
                  name="motherName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white text-sm">Nome da Mãe</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Nome completo da mãe"
                          {...field}
                          className="bg-betconta-accent border-gray-600 text-white h-9"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={step2Form.control}
                  name="cep"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white text-sm">CEP</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="00000-000"
                          {...field}
                          onChange={(e) => {
                            const value = e.target.value.replace(/\D/g, '');
                            field.onChange(value);
                            if (value.length === 8) {
                              handleCepChange(value);
                            }
                          }}
                          className="bg-betconta-accent border-gray-600 text-white h-9"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2">
                    <FormField
                      control={step2Form.control}
                      name="street"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white text-sm">Endereço</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Rua, avenida..."
                              {...field}
                              className="bg-betconta-accent border-gray-600 text-white h-9"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={step2Form.control}
                    name="number"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white text-sm">Número</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="123"
                            {...field}
                            className="bg-betconta-accent border-gray-600 text-white h-9"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <FormField
                    control={step2Form.control}
                    name="neighborhood"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white text-sm">Bairro</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Bairro"
                            {...field}
                            className="bg-betconta-accent border-gray-600 text-white h-9"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={step2Form.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white text-sm">Cidade</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Cidade"
                            {...field}
                            className="bg-betconta-accent border-gray-600 text-white h-9"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={step2Form.control}
                  name="state"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white text-sm">Estado</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Estado"
                          {...field}
                          className="bg-betconta-accent border-gray-600 text-white h-9"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex gap-3 pt-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setCurrentStep(1)}
                    className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-700 h-9 text-sm"
                  >
                    Voltar
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 bg-betconta-primary hover:bg-green-500 text-white h-9 text-sm"
                    disabled={checkRgMutation.isPending}
                  >
                    {checkRgMutation.isPending ? "Verificando..." : "Próximo"}
                  </Button>
                </div>
              </form>
            </Form>
          )}

          {/* Step 3: Document Upload */}
          {currentStep === 3 && (
            <Form {...step3Form}>
              <form onSubmit={step3Form.handleSubmit(handleStep3Submit)} className="space-y-6">
                <Alert className="border-blue-500 bg-blue-50 dark:bg-blue-900/20">
                  <AlertTriangle className="w-4 h-4 text-blue-600" />
                  <AlertDescription className="text-blue-800 dark:text-blue-200">
                    Envie fotos nítidas dos documentos (RG ou CNH) e uma selfie segurando o documento.
                  </AlertDescription>
                </Alert>

                {/* Document Front */}
                <FormField
                  control={step3Form.control}
                  name="documentFront"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white">Documento Frente (RG ou CNH)</FormLabel>
                      <FormControl>
                        <div className="space-y-2">
                          <Input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                field.onChange(e.target.files);
                                handleFilePreview(file, setDocumentFrontPreview);
                              }
                            }}
                            className="bg-betconta-accent border-gray-600 text-white"
                          />
                          {documentFrontPreview && (
                            <div className="relative">
                              <img 
                                src={documentFrontPreview} 
                                alt="Preview frente" 
                                className="max-w-full h-32 object-cover rounded border"
                              />
                              <Button
                                type="button"
                                size="sm"
                                variant="ghost"
                                className="absolute top-1 right-1 text-white bg-black/50"
                                onClick={() => window.open(documentFrontPreview, '_blank')}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Document Back */}
                <FormField
                  control={step3Form.control}
                  name="documentBack"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white">Documento Verso (RG ou CNH)</FormLabel>
                      <FormControl>
                        <div className="space-y-2">
                          <Input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                field.onChange(e.target.files);
                                handleFilePreview(file, setDocumentBackPreview);
                              }
                            }}
                            className="bg-betconta-accent border-gray-600 text-white"
                          />
                          {documentBackPreview && (
                            <div className="relative">
                              <img 
                                src={documentBackPreview} 
                                alt="Preview verso" 
                                className="max-w-full h-32 object-cover rounded border"
                              />
                              <Button
                                type="button"
                                size="sm"
                                variant="ghost"
                                className="absolute top-1 right-1 text-white bg-black/50"
                                onClick={() => window.open(documentBackPreview, '_blank')}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Selfie */}
                <FormField
                  control={step3Form.control}
                  name="selfie"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white">Selfie Segurando o Documento</FormLabel>
                      <FormControl>
                        <div className="space-y-2">
                          <Input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                field.onChange(e.target.files);
                                handleFilePreview(file, setSelfiePreview);
                              }
                            }}
                            className="bg-betconta-accent border-gray-600 text-white"
                          />
                          {selfiePreview && (
                            <div className="relative">
                              <img 
                                src={selfiePreview} 
                                alt="Preview selfie" 
                                className="max-w-full h-32 object-cover rounded border"
                              />
                              <Button
                                type="button"
                                size="sm"
                                variant="ghost"
                                className="absolute top-1 right-1 text-white bg-black/50"
                                onClick={() => window.open(selfiePreview, '_blank')}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setCurrentStep(2)}
                    className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-700"
                  >
                    Voltar
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 bg-betconta-primary hover:bg-green-500 text-white"
                    disabled={createAccountMutation.isPending}
                  >
                    {createAccountMutation.isPending ? "Criando..." : "Criar Conta"}
                  </Button>
                </div>
              </form>
            </Form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}