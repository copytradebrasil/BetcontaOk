import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, FileText, User, AlertCircle, ChevronLeft, ChevronRight, X } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface KycModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function KycModal({ open, onOpenChange }: KycModalProps) {
  const [documentFront, setDocumentFront] = useState<File | null>(null);
  const [documentBack, setDocumentBack] = useState<File | null>(null);
  const [selfie, setSelfie] = useState<File | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 2;
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

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

  const submitKycMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const res = await fetch('/api/kyc/submit', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });
      if (!res.ok) {
        throw new Error(`${res.status}: ${res.statusText}`);
      }
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "KYC Enviado",
        description: "Seus documentos foram enviados para análise. Aguarde a verificação.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      onOpenChange(false);
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao enviar documentos",
        variant: "destructive",
      });
    },
  });

  const handleFileChange = (file: File | null, type: 'front' | 'back' | 'selfie') => {
    if (file && file.size > 5 * 1024 * 1024) {
      toast({
        title: "Arquivo muito grande",
        description: "O arquivo deve ter no máximo 5MB",
        variant: "destructive",
      });
      return;
    }
    
    switch (type) {
      case 'front':
        setDocumentFront(file);
        break;
      case 'back':
        setDocumentBack(file);
        break;
      case 'selfie':
        setSelfie(file);
        break;
    }
  };

  const handleSubmit = () => {
    if (!documentFront || !documentBack || !selfie) {
      toast({
        title: "Documentos incompletos",
        description: "Por favor, envie todos os documentos obrigatórios",
        variant: "destructive",
      });
      return;
    }

    const formData = new FormData();
    formData.append('documentFront', documentFront);
    formData.append('documentBack', documentBack);
    formData.append('selfie', selfie);

    submitKycMutation.mutate(formData);
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            {/* Verification Required Alert */}
            <div className="bg-orange-900/20 border border-orange-500/30 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-orange-400 mt-0.5" />
                <div>
                  <h3 className="text-orange-400 font-medium text-base">Verificação Obrigatória</h3>
                  <p className="text-orange-300 text-sm mt-1">
                    Para garantir a segurança da sua conta e cumprir regulamentações bancárias, 
                    você deve enviar os documentos abaixo antes de usar sua conta.
                  </p>
                </div>
              </div>
            </div>

            {/* Important Instructions */}
            <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
              <h3 className="text-blue-400 font-medium mb-3 text-base">Instruções Importantes:</h3>
              <ul className="text-blue-300 text-sm space-y-2">
                <li>• Certifique-se de que os documentos estejam bem iluminados e legíveis</li>
                <li>• Na selfie, segure seu documento próximo ao rosto</li>
                <li>• Todos os dados devem estar visíveis e não cortados</li>
                <li>• Aceitos: RG, CNH ou Passaporte</li>
              </ul>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-3">
            {/* File Uploads - Mobile Optimized */}
            <div className="space-y-3">
              <FileUploadCard
                title="Frente do Documento"
                description="RG, CNH ou Passaporte (frente)"
                file={documentFront}
                onChange={(file) => handleFileChange(file, 'front')}
                icon={FileText}
              />
              
              <FileUploadCard
                title="Verso do Documento"
                description="Verso do seu documento"
                file={documentBack}
                onChange={(file) => handleFileChange(file, 'back')}
                icon={FileText}
              />
              
              <FileUploadCard
                title="Selfie com Documento"
                description="Você segurando o documento próximo ao rosto"
                file={selfie}
                onChange={(file) => handleFileChange(file, 'selfie')}
                icon={User}
              />
            </div>

            {/* Progress - Compact */}
            <div className="bg-gray-800 rounded-lg p-3">
              <div className="flex justify-between text-xs text-gray-400 mb-2">
                <span>Progresso</span>
                <span>{[documentFront, documentBack, selfie].filter(Boolean).length}/3</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-1.5">
                <div 
                  className="bg-betconta-primary h-1.5 rounded-full transition-all duration-300"
                  style={{ width: `${([documentFront, documentBack, selfie].filter(Boolean).length / 3) * 100}%` }}
                />
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const FileUploadCard = ({ 
    title, 
    description, 
    file, 
    onChange, 
    icon: Icon 
  }: {
    title: string;
    description: string;
    file: File | null;
    onChange: (file: File | null) => void;
    icon: any;
  }) => (
    <Card className="bg-gray-800 border-gray-700">
      <CardContent className="p-3">
        <div className="flex items-center space-x-3">
          <Icon className="w-6 h-6 text-blue-400 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-white text-sm">{title}</h3>
          </div>
          
          {file ? (
            <div className="flex items-center space-x-2">
              <div className="flex items-center justify-center w-6 h-6 bg-green-900/30 border border-green-500/50 rounded-full">
                <span className="text-green-400 text-xs">✓</span>
              </div>
              <Button
                onClick={() => onChange(null)}
                variant="ghost"
                size="sm"
                className="text-red-400 hover:bg-red-900/20 h-6 w-6 p-0 text-sm"
              >
                ×
              </Button>
            </div>
          ) : (
            <div>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => onChange(e.target.files?.[0] || null)}
                className="hidden"
                id={`file-${title}`}
              />
              <label
                htmlFor={`file-${title}`}
                className="flex items-center justify-center w-12 h-8 border border-dashed border-gray-600 rounded cursor-pointer hover:border-blue-500 transition-colors"
              >
                <Upload className="w-4 h-4 text-gray-400" />
              </label>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-betconta-secondary border-betconta-accent w-[95vw] max-w-md mx-auto p-3 sm:p-4 max-h-[95vh] overflow-y-auto">
        <DialogHeader className="pb-2">
          <div className="flex justify-between items-center">
            <div>
              <DialogTitle className="text-lg sm:text-xl font-bold text-white">
                Verificação de Identidade (KYC)
              </DialogTitle>
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

        <div className="space-y-3">
          {renderStepContent()}
          
          {/* Navigation buttons */}
          <div className="flex justify-between items-center pt-3">
            <Button
              type="button"
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 1}
              className="bg-transparent border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white h-8 px-3 text-sm"
            >
              <ChevronLeft className="w-3 h-3 mr-1" />
              Anterior
            </Button>
            
            {currentStep < totalSteps ? (
              <Button
                type="button"
                onClick={nextStep}
                className="bg-betconta-primary hover:bg-green-500 text-white h-8 px-4 text-sm"
              >
                Próximo
                <ChevronRight className="w-3 h-3 ml-1" />
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  className="border-gray-600 text-gray-300 hover:text-white h-8 px-3 text-xs"
                >
                  Depois
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={!documentFront || !documentBack || !selfie || submitKycMutation.isPending}
                  className="bg-blue-600 hover:bg-blue-700 text-white h-8 px-3 text-xs"
                >
                  {submitKycMutation.isPending ? "Enviando..." : "Enviar"}
                </Button>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}