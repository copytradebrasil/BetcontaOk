import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowUp, X, AlertTriangle, DollarSign } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { formatCurrency, formatCpf } from "@/lib/utils";

const withdrawalSchema = z.object({
  amount: z.string().min(1, "Valor é obrigatório"),
});

type WithdrawalFormData = z.infer<typeof withdrawalSchema>;

interface TransactionModalsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function TransactionModals({ open, onOpenChange }: TransactionModalsProps) {
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const { user } = useAuth();
  
  const withdrawForm = useForm<WithdrawalFormData>({
    resolver: zodResolver(withdrawalSchema),
    defaultValues: {
      amount: "",
    },
  });

  const handleWithdrawSubmit = (data: WithdrawalFormData) => {
    console.log("Withdrawal:", data);
    setShowWithdrawModal(false);
    withdrawForm.reset();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-betconta-secondary border-betconta-accent w-[95vw] max-w-md mx-auto p-3 sm:p-6 max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-2">
          <div className="flex justify-between items-center">
            <DialogTitle className="text-lg sm:text-xl font-bold text-white">Transações</DialogTitle>
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

        <div className="text-center py-4 sm:py-6">
          <ArrowUp className="w-12 h-12 sm:w-16 sm:h-16 text-betconta-primary mx-auto mb-3 sm:mb-4" />
          <h3 className="text-white text-base sm:text-lg font-semibold mb-2">Saque da Conta Master</h3>
          <p className="text-gray-400 mb-4 text-sm sm:text-base px-2">
            Realize saques da sua conta master para sua conta bancária externa
          </p>
          <Button 
            className="bg-betconta-primary hover:bg-green-500 text-white h-10 sm:h-12 px-6 font-medium"
            onClick={() => setShowWithdrawModal(true)}
          >
            Realizar Saque
          </Button>
        </div>
      </DialogContent>

      {/* Withdrawal Modal */}
      <Dialog open={showWithdrawModal} onOpenChange={setShowWithdrawModal}>
        <DialogContent className="bg-betconta-secondary border-betconta-accent w-[95vw] max-w-sm mx-auto p-3 sm:p-4 max-h-[95vh] overflow-y-auto">
          <DialogHeader className="pb-2">
            <div className="flex justify-between items-center">
              <DialogTitle className="text-base font-bold text-white">Realizar Saque</DialogTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowWithdrawModal(false)}
                className="text-gray-400 hover:text-white p-1 h-auto"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </DialogHeader>

          <div className="space-y-3">
            {/* Fee Information - Compact */}
            <div className="bg-blue-900/30 border border-blue-600 rounded-lg p-2.5">
              <div className="flex items-center gap-2 mb-1">
                <DollarSign className="w-3 h-3 text-blue-400" />
                <span className="text-blue-400 font-medium text-xs">Taxa de Saque</span>
              </div>
              <p className="text-white font-bold text-base">R$ 2,00</p>
              <p className="text-gray-400 text-xs">Taxa fixa por operação</p>
            </div>

            {/* Security Alert - Compact */}
            <Alert className="border-yellow-500 bg-yellow-900/20 p-2.5">
              <AlertTriangle className="w-3 h-3 text-yellow-500" />
              <AlertDescription className="text-yellow-200 font-medium text-xs">
                Saque só pode ser realizado para o mesmo CPF cadastrado.
              </AlertDescription>
            </Alert>

            <Form {...withdrawForm}>
              <form onSubmit={withdrawForm.handleSubmit(handleWithdrawSubmit)} className="space-y-3">
                {/* Amount Field */}
                <FormField
                  control={withdrawForm.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white font-medium text-xs">Valor do Saque</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="R$ 0,00"
                          {...field}
                          type="text"
                          inputMode="numeric"
                          className="bg-betconta-accent border-gray-600 text-white placeholder-gray-400 focus:border-betconta-primary h-10 text-base font-medium text-center"
                          onChange={(e) => {
                            const value = e.target.value.replace(/\D/g, '');
                            const formatted = formatCurrency(parseInt(value || '0') / 100);
                            field.onChange(`R$ ${formatted}`);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* CPF Display */}
                <div className="space-y-1.5">
                  <label className="text-white font-medium text-xs">CPF Cadastrado</label>
                  <Input
                    value={(user as any)?.cpf ? formatCpf((user as any).cpf) : "***.***.***-**"}
                    disabled
                    className="bg-gray-700 border-gray-600 text-gray-300 cursor-not-allowed h-9 text-sm text-center"
                  />
                  <p className="text-xs text-gray-400 text-center">
                    Saque para conta bancária vinculada
                  </p>
                </div>

                {/* Total Cost Summary - Compact */}
                <div className="bg-gray-800 border border-gray-600 rounded-lg p-2.5">
                  <div className="text-xs text-gray-400 mb-2 text-center">Resumo do Saque</div>
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300 text-xs">Valor solicitado:</span>
                      <span className="text-white font-medium text-sm">{withdrawForm.watch('amount') || 'R$ 0,00'}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300 text-xs">Taxa de saque:</span>
                      <span className="text-white font-medium text-sm">R$ 2,00</span>
                    </div>
                    <div className="border-t border-gray-600 pt-1.5 mt-1.5">
                      <div className="flex justify-between items-center">
                        <span className="text-white font-semibold text-xs">Total debitado:</span>
                        <span className="text-blue-400 font-bold text-base">
                          {withdrawForm.watch('amount') 
                            ? `R$ ${(parseFloat(withdrawForm.watch('amount').replace(/[^\d,]/g, '').replace(',', '.')) + 2).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                            : 'R$ 2,00'
                          }
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons - Mobile Optimized */}
                <div className="flex gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowWithdrawModal(false)}
                    className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-700 h-10 text-sm font-medium"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 bg-betconta-primary hover:bg-green-500 text-white h-10 text-sm font-medium"
                  >
                    Confirmar Saque
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}