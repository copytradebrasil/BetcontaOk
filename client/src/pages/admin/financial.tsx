import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate, formatCurrency } from "@/lib/utils";
import { ArrowDown, ArrowUp } from "lucide-react";
import type { PixTransaction } from "@shared/schema";

const Badge = ({ children, className, variant }: { children: React.ReactNode; className?: string; variant?: string }) => (
  <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${className}`}>
    {children}
  </span>
);

export default function Financial() {
  const { data: transactions, isLoading } = useQuery<PixTransaction[]>({
    queryKey: ["/api/admin/financial"],
  });

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-700 rounded w-1/4"></div>
          <div className="h-96 bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  const deposits = transactions?.filter(t => t.type === 'deposit') || [];
  const withdrawals = transactions?.filter(t => t.type === 'withdrawal') || [];
  
  const totalDeposits = deposits.reduce((sum, t) => sum + parseFloat(t.amount), 0);
  const totalWithdrawals = withdrawals.reduce((sum, t) => sum + parseFloat(t.amount), 0);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white">Financeiro</h1>
        <div className="text-sm text-gray-400">
          Total: {transactions?.length || 0} transações
        </div>
      </div>

      {/* Resumo Financeiro */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">PIX IN (Depósitos)</CardTitle>
            <ArrowDown className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{formatCurrency(totalDeposits)}</div>
            <p className="text-xs text-gray-500">{deposits.length} transações</p>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">PIX OUT (Saques)</CardTitle>
            <ArrowUp className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{formatCurrency(totalWithdrawals)}</div>
            <p className="text-xs text-gray-500">{withdrawals.length} transações</p>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Saldo Líquido</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${totalDeposits - totalWithdrawals >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {formatCurrency(totalDeposits - totalWithdrawals)}
            </div>
            <p className="text-xs text-gray-500">Entrada - Saída</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de Transações */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Todas as Transações PIX</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left text-gray-400 p-2">ID</th>
                  <th className="text-left text-gray-400 p-2">Tipo</th>
                  <th className="text-left text-gray-400 p-2">Valor</th>
                  <th className="text-left text-gray-400 p-2">Status</th>
                  <th className="text-left text-gray-400 p-2">User ID</th>
                  <th className="text-left text-gray-400 p-2">Child ID</th>
                  <th className="text-left text-gray-400 p-2">Destinatário</th>
                  <th className="text-left text-gray-400 p-2">Descrição</th>
                  <th className="text-left text-gray-400 p-2">Data</th>
                </tr>
              </thead>
              <tbody>
                {transactions?.map((transaction) => (
                  <tr key={transaction.id} className="border-b border-gray-700 hover:bg-gray-750">
                    <td className="p-2 text-white font-mono">{transaction.id}</td>
                    <td className="p-2">
                      <Badge 
                        variant={transaction.type === 'deposit' ? 'default' : 'destructive'}
                        className={transaction.type === 'deposit' ? 'bg-green-600' : 'bg-red-600'}
                      >
                        <div className="flex items-center gap-1">
                          {transaction.type === 'deposit' ? <ArrowDown className="h-3 w-3" /> : <ArrowUp className="h-3 w-3" />}
                          {transaction.type === 'deposit' ? 'PIX IN' : 'PIX OUT'}
                        </div>
                      </Badge>
                    </td>
                    <td className={`p-2 font-mono font-bold ${transaction.type === 'deposit' ? 'text-green-400' : 'text-red-400'}`}>
                      {transaction.type === 'deposit' ? '+' : '-'}{formatCurrency(parseFloat(transaction.amount))}
                    </td>
                    <td className="p-2">
                      <Badge 
                        variant={
                          transaction.status === 'completed' ? 'default' : 
                          transaction.status === 'pending' ? 'secondary' : 
                          'destructive'
                        }
                        className={
                          transaction.status === 'completed' ? 'bg-green-600' : 
                          transaction.status === 'pending' ? 'bg-yellow-600' : 
                          'bg-red-600'
                        }
                      >
                        {transaction.status || 'pending'}
                      </Badge>
                    </td>
                    <td className="p-2 text-gray-400 font-mono text-xs">{transaction.userId}</td>
                    <td className="p-2 text-gray-400 font-mono">{transaction.childAccountId || "-"}</td>
                    <td className="p-2 text-gray-300">{transaction.counterpartyName || "-"}</td>
                    <td className="p-2 text-gray-300 max-w-32 truncate">{transaction.description || "-"}</td>
                    <td className="p-2 text-gray-400">{formatDate(transaction.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {(!transactions || transactions.length === 0) && (
            <div className="text-center py-8 text-gray-400">
              Nenhuma transação encontrada
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}