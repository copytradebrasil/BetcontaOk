import { useEffect, useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import BetContaLogo from "@assets/Design sem nome (9)_1750366876828.png";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import ProfileModal from "@/components/modals/ProfileModal";
import TransactionModals from "@/components/modals/TransactionModals";
import KycModal from "@/components/modals/KycModal";
import CreateChildAccountModal from "@/components/modals/CreateChildAccountModal";
import AffiliateRequestModal from "@/components/modals/AffiliateRequestModal";
import {
  User,
  LogOut,
  ArrowUp,
  ArrowDown,
  QrCode,
  Key,
  FileText,
  ArrowUpDown,
  Plus,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Copy,
  Scan,
  Send,
  DollarSign,
  Info,
  ChevronDown,
  Menu,
  Settings,
  Search,
  X,
} from "lucide-react";
import type {
  User as UserType,
  ChildAccount,
  PixTransaction,
} from "@shared/schema";

export default function Dashboard() {
  const { user, isLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showProfile, setShowProfile] = useState(false);
  const [showTransactionModals, setShowTransactionModals] = useState(false);
  const [showKyc, setShowKyc] = useState(false);
  const [showStatement, setShowStatement] = useState(false);
  const [showCreateChildAccount, setShowCreateChildAccount] = useState(false);
  const [showQrPayment, setShowQrPayment] = useState(false);
  const [selectedChildAccount, setSelectedChildAccount] =
    useState<ChildAccount | null>(null);
  const [showPixKeyLoading, setShowPixKeyLoading] = useState(false);
  const [pixKeyType, setPixKeyType] = useState<string>("");
  const [generatedPixKey, setGeneratedPixKey] = useState<string>("");
  const [selectedChildAccountForPix, setSelectedChildAccountForPix] = useState<ChildAccount | null>(null);
  const [showPixManagementModal, setShowPixManagementModal] = useState(false);
  const [pixActivating, setPixActivating] = useState(false);
  const [pixActivationProgress, setPixActivationProgress] = useState(0);
  const [pixActivationSuccess, setPixActivationSuccess] = useState(false);
  const [showChildStatement, setShowChildStatement] = useState(false);
  
  // PIX countdown timer
  const [pixCountdowns, setPixCountdowns] = useState<{[key: number]: any}>({});
  const [selectedChildForStatement, setSelectedChildForStatement] =
    useState<ChildAccount | null>(null);
  const [expandedAccounts, setExpandedAccounts] = useState<Set<number>>(
    new Set(),
  );
  const [showReceipt, setShowReceipt] = useState(false);
  const [selectedTransaction, setSelectedTransaction] =
    useState<PixTransaction | null>(null);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [selectedChildForTransfer, setSelectedChildForTransfer] =
    useState<ChildAccount | null>(null);
  const [showFeesModal, setShowFeesModal] = useState(false);
  const [showFaqModal, setShowFaqModal] = useState(false);
  const [showKycStatus, setShowKycStatus] = useState(false);
  const [showAffiliateRequest, setShowAffiliateRequest] = useState(false);
  const [selectedAccountForKyc, setSelectedAccountForKyc] =
    useState<ChildAccount | null>(null);
  const [showKycInfo, setShowKycInfo] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showQrCodeRequest, setShowQrCodeRequest] = useState(false);
  const [showRejectedHouses, setShowRejectedHouses] = useState(false);
  const [activeAlert, setActiveAlert] = useState(null);
  const [dismissedAlerts, setDismissedAlerts] = useState(new Set());
  const [lastAlertTimestamps, setLastAlertTimestamps] = useState(new Map());
  const [showTelegramButton, setShowTelegramButton] = useState(() => {
    // Check if button was dismissed in current session
    const sessionDismissed = sessionStorage.getItem('telegramButtonDismissed');
    return !sessionDismissed;
  });

  // Fetch active alerts
  const { data: alerts = [] } = useQuery({
    queryKey: ["/api/alerts"],
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Load dismissed alerts from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('dismissedAlerts');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setDismissedAlerts(new Set(parsed));
      } catch (e) {
        localStorage.removeItem('dismissedAlerts');
      }
    }
    
    const storedTimestamps = localStorage.getItem('alertTimestamps');
    if (storedTimestamps) {
      try {
        const parsed = JSON.parse(storedTimestamps);
        setLastAlertTimestamps(new Map(Object.entries(parsed)));
      } catch (e) {
        localStorage.removeItem('alertTimestamps');
      }
    }
  }, []);

  // Show alert popup for new active alerts
  useEffect(() => {
    if (!alerts || alerts.length === 0 || activeAlert) return;
    
    for (const alert of alerts) {
      if (!alert.isActive) continue;
      
      const alertId = String(alert.id);
      const currentTimestamp = alert.updatedAt;
      const lastKnownTimestamp = lastAlertTimestamps.get(alertId);
      
      // Update timestamp tracking without causing re-render
      if (!lastKnownTimestamp || lastKnownTimestamp !== currentTimestamp) {
        setLastAlertTimestamps(prev => {
          const newMap = new Map(prev);
          newMap.set(alertId, currentTimestamp);
          // Save to localStorage asynchronously
          setTimeout(() => {
            const obj = Object.fromEntries(newMap);
            localStorage.setItem('alertTimestamps', JSON.stringify(obj));
          }, 0);
          return newMap;
        });
        
        // If this is a reactivation (timestamp changed) and alert was dismissed, show it again
        if (lastKnownTimestamp && lastKnownTimestamp !== currentTimestamp && dismissedAlerts.has(alert.id)) {
          setDismissedAlerts(prev => {
            const newSet = new Set(prev);
            newSet.delete(alert.id);
            // Save to localStorage asynchronously
            setTimeout(() => {
              localStorage.setItem('dismissedAlerts', JSON.stringify([...newSet]));
            }, 0);
            return newSet;
          });
          setActiveAlert(alert);
          return;
        }
      }
      
      // Show alert if not dismissed
      if (!dismissedAlerts.has(alert.id)) {
        setActiveAlert(alert);
        return;
      }
    }
  }, [alerts]); // Only depend on alerts to avoid infinite loops

  const dismissAlert = (alertId) => {
    setDismissedAlerts(prev => new Set([...prev, alertId]));
    setActiveAlert(null);
  };

  const dismissAlertPermanently = (alertId) => {
    const newDismissed = new Set([...dismissedAlerts, alertId]);
    setDismissedAlerts(newDismissed);
    localStorage.setItem('dismissedAlerts', JSON.stringify([...newDismissed]));
    setActiveAlert(null);
  };

  // Generate automated KYC timeline based on submission time and account status
  const generateKycTimeline = (
    submissionTime: string | null,
    accountStatus: string = "pending",
  ) => {
    if (!submissionTime) return [];

    const baseTime = new Date(submissionTime);
    const timeline = [];

    // Step 1: Documents received (immediate)
    timeline.push({
      time: baseTime,
      status: "completed",
      title: "Documentos recebidos para KYC",
      description: "Documentos enviados com sucesso para análise",
    });

    // Step 2: After 10 minutes - Sent to analysis sector
    const step2Time = new Date(baseTime.getTime() + 10 * 60 * 1000);
    timeline.push({
      time: step2Time,
      status: "completed",
      title:
        "Documento enviado ao setor de análise e compliance de dados da Cartos",
      description: "Documentos encaminhados para o setor responsável",
    });

    // Step 3: After 5 more minutes (15 total) - Received by Cartos
    const step3Time = new Date(baseTime.getTime() + 15 * 60 * 1000);
    timeline.push({
      time: step3Time,
      status: "completed",
      title: "Documentos recebidos pela Cartos para análise de KYC",
      description: "Cartos confirmou o recebimento dos documentos",
    });

    // Step 4: Responsibility notice
    timeline.push({
      time: null,
      status: "info",
      title:
        "À partir deste processo a responsabilidade de análise de KYC para aprovação ou reprovação é 100% realizada pela liquidante Cartos, onde a BetConta apenas atualiza as informações.",
      description:
        "Após a análise este painel será atualizado lhe informando se a conta está APROVADA ou REPROVADA.",
    });

    // Step 5: Final status based on current account status
    let finalStep;
    switch (accountStatus) {
      case "approved":
        finalStep = {
          time: new Date(),
          status: "completed",
          title: "Conta Aprovada ✅",
          description:
            "KYC aprovado com sucesso pela Cartos. Conta ativa para uso.",
        };
        break;
      case "rejected":
        finalStep = {
          time: new Date(),
          status: "failed",
          title: "Conta Reprovada ❌",
          description:
            "KYC não aprovado pela Cartos. Entre em contato com o suporte.",
        };
        break;
      default:
        finalStep = {
          time: null,
          status: "pending",
          title: "Aguardando aprovação Final",
          description: "Processo em andamento",
        };
    }

    timeline.push(finalStep);
    return timeline;
  };

  // Format time for display
  const formatTimelineDate = (date: Date) => {
    return (
      date.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
      }) +
      " " +
      date.toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
      })
    );
  };

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!isLoading && !user) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [user, isLoading, toast]);

  // Fetch child accounts
  const { data: childAccounts, isLoading: loadingChildAccounts } = useQuery({
    queryKey: ["/api/child-accounts"],
    enabled: !!user,
  });

  // Fetch PIX transactions
  const { data: pixTransactions, isLoading: loadingTransactions } = useQuery({
    queryKey: ["/api/pix-transactions"],
    enabled: !!user,
  });

  // Fetch child transactions
  const { data: childTransactions, isLoading: loadingChildTransactions } =
    useQuery({
      queryKey: [
        "/api/child-accounts",
        selectedChildForStatement?.id,
        "transactions",
      ],
      queryFn: () =>
        fetch(
          `/api/child-accounts/${selectedChildForStatement?.id}/transactions`,
        ).then((res) => res.json()),
      enabled: !!selectedChildForStatement && showChildStatement,
    });

  // Fetch KYC documents for status determination
  const { data: kycDocuments } = useQuery({
    queryKey: ["/api/kyc-documents"],
    enabled: !!user,
  });

  // Function to generate different types of PIX keys
  const generatePixKey = (
    type: string,
    userEmail?: string,
    userCpf?: string,
  ) => {
    switch (type) {
      case "CPF":
        return userCpf || "123.456.789-00";
      case "Email":
        return userEmail || "usuario@exemplo.com";
      case "Aleatória":
        return Array.from(
          { length: 32 },
          () => Math.random().toString(36)[2] || "0",
        ).join("");
      default:
        return "";
    }
  };

  // Function to handle PIX key generation
  const handlePixKeyGeneration = (type: string) => {
    setPixKeyType(type);
    const newKey = generatePixKey(type, user?.email, user?.cpf);
    setGeneratedPixKey(newKey);
    setShowPixKeyLoading(true);

    // Simulate API call but keep modal open
    setTimeout(() => {
      toast({
        title: `Chave PIX ${type} gerada`,
        description: `Nova chave PIX ${type.toLowerCase()} foi criada com sucesso`,
        variant: "default",
      });
    }, 3000);
  };

  // Function to copy PIX key to clipboard
  const copyPixKey = async () => {
    try {
      await navigator.clipboard.writeText(generatedPixKey);
      toast({
        title: "Chave copiada",
        description: "Chave PIX copiada para a área de transferência",
        variant: "default",
      });
    } catch (err) {
      toast({
        title: "Erro ao copiar",
        description: "Não foi possível copiar a chave PIX",
        variant: "destructive",
      });
    }
  };

  const toggleAccountExpansion = (accountId: number) => {
    setExpandedAccounts((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(accountId)) {
        newSet.delete(accountId);
      } else {
        newSet.add(accountId);
      }
      return newSet;
    });
  };

  // Filter child accounts based on search term
  const filteredChildAccounts = useMemo(() => {
    if (!childAccounts || !searchTerm) return childAccounts || [];

    return childAccounts.filter((account: ChildAccount) => {
      const nameMatch = account.name
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase());
      const cpfMatch = account.cpf
        ?.replace(/\D/g, "")
        .includes(searchTerm.replace(/\D/g, ""));
      return nameMatch || cpfMatch;
    });
  }, [childAccounts, searchTerm]);

  // Function to determine account status based on KYC documents
  const getAccountStatus = (account: ChildAccount) => {
    // Check status directly from child account
    switch (account.status) {
      case "approved":
        return {
          status: "Aprovado",
          className:
            "bg-green-600 hover:bg-green-700 text-white cursor-pointer",
          showButton: true,
        };
      case "rejected":
        return {
          status: "Reprovado",
          className: "bg-red-600 hover:bg-red-700 text-white cursor-pointer",
          showButton: true,
        };
      case "pending":
        // Check if KYC documents were submitted
        if (kycDocuments && Array.isArray(kycDocuments)) {
          const accountKyc = kycDocuments.find(
            (doc: any) =>
              doc.childAccountId === account.id && doc.accountType === "child",
          );

          if (accountKyc) {
            return {
              status: "VER STATUS",
              className:
                "bg-yellow-600 hover:bg-yellow-700 text-white cursor-pointer",
              showButton: true,
            };
          }
        }

        return {
          status: "Pendente",
          className: "bg-gray-600 text-white",
          showButton: false,
        };
      default:
        return {
          status: "Pendente",
          className: "bg-gray-600 text-white",
          showButton: false,
        };
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/logout", {
        method: "POST",
        credentials: "include",
      });
      toast({
        title: "Logout realizado",
        description: "Até logo!",
      });
      window.location.reload();
    } catch (error) {
      console.error("Logout error:", error);
      window.location.reload(); // Force reload even if logout fails
    }
  };

  const generatePixKeyMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/user/generate-pix-key", {
        method: "POST",
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to generate PIX key");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({
        title: "Sucesso",
        description: "Nova chave PIX gerada com sucesso!",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Erro",
        description: "Erro ao gerar chave PIX",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-betconta-secondary flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-betconta-primary"></div>
          <p className="mt-4 text-white">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-betconta-secondary">
      {/* Header */}
      <header className="bg-betconta-secondary border-b border-betconta-accent sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <img src={BetContaLogo} alt="BetConta" className="h-8" />
            </div>
            <div className="flex items-center space-x-4">
              {(() => {
                const status = user?.affiliateStatus || "none";

                if (status === "approved") {
                  return (
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-green-600 text-green-600 hover:bg-green-600 hover:text-white text-xs px-3 py-1 bg-green-900/20"
                      onClick={() => (window.location.href = "/affiliate")}
                    >
                      Afiliado
                    </Button>
                  );
                } else if (status === "pending") {
                  return (
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-yellow-600 text-yellow-600 hover:bg-yellow-600 hover:text-white text-xs px-3 py-1 bg-yellow-900/20"
                      disabled
                    >
                      Afiliado Pendente
                    </Button>
                  );
                } else if (status === "rejected") {
                  return (
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-red-600 text-red-600 hover:bg-red-600 hover:text-white text-xs px-3 py-1 bg-red-900/20"
                      onClick={() => setShowAffiliateRequest(true)}
                    >
                      Afiliado
                    </Button>
                  );
                } else {
                  return (
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white text-xs px-3 py-1"
                      onClick={() => setShowAffiliateRequest(true)}
                    >
                      Afiliado
                    </Button>
                  );
                }
              })()}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-gray-400 hover:text-white"
                  >
                    <Menu className="w-5 h-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="bg-gray-800 border-gray-700"
                  align="end"
                >
                  <DropdownMenuItem
                    className="text-white hover:bg-gray-700 cursor-pointer"
                    onClick={() => setShowProfile(true)}
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    Configuração
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-white hover:bg-gray-700 cursor-pointer"
                    onClick={handleLogout}
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Sair
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 mt-[2px] mb-[2px] pt-[10px] pb-[10px]">
        {/* Account Master Card */}
        <Card className="bg-gray-800 border-gray-700 mb-6">
          <CardContent className="p-4 sm:p-6">
            {/* Header with Title, KYC Status and Balance */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-3">
              <div className="flex items-center justify-between sm:justify-start">
                <h3 className="text-white sm:text-xl font-semibold text-[14px]">
                  Saldo Conta Master
                </h3>
                <div className="flex items-center gap-2 sm:hidden">
                  {user?.kycStatus === "pending" ? (
                    <Button
                      size="sm"
                      onClick={() => setShowKyc(true)}
                      className="bg-orange-500 hover:bg-orange-600 text-white text-xs px-2 py-1"
                    >
                      KYC Pendente
                    </Button>
                  ) : user?.kycStatus === "submitted" ? (
                    <Badge className="bg-yellow-600 text-white text-xs">
                      Em Aprovação
                    </Badge>
                  ) : user?.kycStatus === "verified" ? (
                    <Badge className="bg-blue-600 text-white text-xs">
                      Verificada
                    </Badge>
                  ) : (
                    <Badge className="bg-gray-600 text-white text-xs">
                      Pendente
                    </Badge>
                  )}
                </div>
              </div>

              {/* Balance Display - Right Side */}
              <div className="flex items-center gap-2 order-last">
                <div className="text-right">
                  <p className="font-bold text-lg text-[#72fa60]">
                    R${" "}
                    {parseFloat(user.balance || "0").toLocaleString("pt-BR", {
                      minimumFractionDigits: 2,
                    })}
                  </p>
                </div>
                <Button
                  size="sm"
                  onClick={() => {
                    toast({
                      title: "Saldo Atualizado",
                      description: "Seu saldo foi atualizado com sucesso!",
                      variant: "default",
                    });
                  }}
                  className="bg-gray-600 hover:bg-gray-500 text-white text-xs px-2 py-1 h-6"
                >
                  Atualizar Saldo
                </Button>
              </div>

              {/* Desktop KYC Status */}
              <div className="hidden sm:block">
                {user?.kycStatus === "pending" ? (
                  <Button
                    size="sm"
                    onClick={() => setShowKyc(true)}
                    className="bg-orange-500 hover:bg-orange-600 text-white text-xs px-3 py-1"
                  >
                    KYC Pendente
                  </Button>
                ) : user?.kycStatus === "submitted" ? (
                  <Badge className="bg-yellow-600 text-white text-xs">
                    Em Aprovação
                  </Badge>
                ) : user?.kycStatus === "verified" ? (
                  <Badge className="bg-blue-600 text-white text-xs">
                    Verificada
                  </Badge>
                ) : (
                  <Badge className="bg-gray-600 text-white text-xs">
                    Pendente
                  </Badge>
                )}
              </div>
            </div>

            <div className="space-y-4">
              {/* Mobile Layout - Vertical Stack */}
              <div className="block sm:hidden space-y-4">
                {/* Bank Info Row - 3 columns */}
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <p className="text-gray-400 text-xs mb-1">Banco</p>
                    <p className="text-white font-mono text-xs">324</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-xs mb-1">Agência</p>
                    <p className="text-white font-mono text-xs">
                      {user.agency || "0001"}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-xs mb-1">Conta</p>
                    <p className="text-white font-mono text-xs">
                      {user.accountNumber || "N/A"}
                    </p>
                  </div>
                </div>

                {/* PIX Key */}
                <div>
                  <p className="text-gray-400 text-xs mb-1">
                    Chave PIX Depósito Conta Master
                  </p>
                  <div className="flex items-center gap-2">
                    <p className="text-white font-mono text-xs break-all flex-1">
                      {user.pixKey || "Não gerado"}
                    </p>
                    {user.pixKey && (
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(user.pixKey);
                          alert("Chave PIX copiada com sucesso!");
                        }}
                        className="hover:text-blue-300 p-1 rounded transition-colors text-white flex-shrink-0"
                        title="Copiar chave PIX"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    size="sm"
                    onClick={() => setShowTransactionModals(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white text-xs"
                  >
                    <ArrowUp className="w-3 h-3 mr-1" />
                    SAQUE
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => setShowStatement(true)}
                    variant="outline"
                    className="border-blue-600 hover:bg-blue-600 hover:text-white text-xs text-blue-600"
                  >
                    <FileText className="w-3 h-3 mr-1" />
                    Extrato
                  </Button>

                  <Button
                    size="sm"
                    onClick={() => setShowFeesModal(true)}
                    variant="outline"
                    className="border-blue-600 hover:bg-blue-600 hover:text-white text-xs text-blue-600"
                  >
                    <DollarSign className="w-3 h-3 mr-1" />
                    Ver Taxas
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => setShowQrCodeRequest(true)}
                    variant="outline"
                    className="border-green-600 hover:bg-green-600 hover:text-white text-xs text-green-600"
                  >
                    <QrCode className="w-3 h-3 mr-1" />
                    Liberar QR Code
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-yellow-500 text-yellow-500 hover:bg-yellow-500 hover:text-gray-900 font-semibold text-xs"
                    onClick={() => setShowFaqModal(true)}
                  >
                    <Info className="w-3 h-3 mr-1" />
                    Informações
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white font-semibold text-xs"
                    onClick={() => setShowRejectedHouses(true)}
                  >
                    Casas Recusadas
                  </Button>
                </div>
              </div>

              {/* Desktop Layout - Original Grid */}
              <div className="hidden sm:block space-y-3">
                <div className="grid grid-cols-4 gap-3">
                  <div className="min-w-0">
                    <p className="text-gray-400 text-xs mb-1">Banco</p>
                    <p className="text-white font-mono text-sm truncate">
                      324 - Cartos
                    </p>
                  </div>
                  <div className="min-w-0">
                    <p className="text-gray-400 text-xs mb-1">Agência</p>
                    <p className="text-white font-mono text-sm truncate">
                      {user.agency || "0001"}
                    </p>
                  </div>
                  <div className="min-w-0">
                    <p className="text-gray-400 text-xs mb-1">Conta</p>
                    <p className="text-white font-mono text-sm truncate">
                      {user.accountNumber || "Não gerado"}
                    </p>
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-gray-400 text-xs mb-1">Chave PIX</p>
                        <p className="text-white font-mono text-xs truncate">
                          {user.pixKey || "Não gerado"}
                        </p>
                      </div>
                      {user.pixKey && (
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(user.pixKey);
                            alert("Chave PIX copiada com sucesso!");
                          }}
                          className="hover:text-blue-300 p-1 rounded transition-colors text-white flex-shrink-0"
                          title="Copiar chave PIX"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Balance and Actions */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div>
                      <p className="text-gray-400 text-xs mb-1">Saldo</p>
                      <p className="font-bold text-xl text-[#72fa60]">
                        R${" "}
                        {parseFloat(user.balance || "0").toLocaleString(
                          "pt-BR",
                          { minimumFractionDigits: 2 },
                        )}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => {
                        toast({
                          title: "Saldo Atualizado",
                          description: "Seu saldo foi atualizado com sucesso!",
                          variant: "default",
                        });
                      }}
                      className="bg-gray-600 hover:bg-gray-500 text-white text-xs px-2 py-1 h-6"
                    >
                      Atualizar Saldo
                    </Button>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => setShowTransactionModals(true)}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-3 text-xs"
                    >
                      <ArrowUp className="w-4 h-4 mr-1" />
                      SAQUE
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => setShowStatement(true)}
                      variant="outline"
                      className="border-blue-600 hover:bg-blue-600 hover:text-white px-3 text-black bg-white"
                    >
                      <FileText className="w-4 h-4" />
                    </Button>

                    <Button
                      size="sm"
                      onClick={() => setShowFeesModal(true)}
                      variant="outline"
                      className="border-blue-600 hover:bg-blue-600 hover:text-white px-3 text-black bg-white"
                    >
                      <DollarSign className="w-4 h-4 mr-1" />
                      <span className="hidden lg:inline">Taxas</span>
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => setShowQrCodeRequest(true)}
                      variant="outline"
                      className="border-green-600 hover:bg-green-600 hover:text-white px-3 text-black bg-white"
                    >
                      <QrCode className="w-4 h-4 mr-1" />
                      <span className="hidden lg:inline">Liberar QR</span>
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-yellow-500 text-yellow-500 hover:bg-yellow-500 hover:text-gray-900 font-semibold px-3"
                      onClick={() => setShowFaqModal(true)}
                    >
                      <Info className="w-4 h-4 mr-1" />
                      <span className="hidden lg:inline">Info</span>
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white font-semibold px-3"
                      onClick={() => setShowRejectedHouses(true)}
                    >
                      <span className="hidden lg:inline">Recusadas</span>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Child Accounts Table */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <div className="flex items-center justify-between mb-4">
              <CardTitle className="font-semibold tracking-tight text-white text-[16px]">
                Contas Filhas
              </CardTitle>
              <Button
                className="bg-blue-600 hover:bg-blue-700 text-white"
                onClick={() => setShowCreateChildAccount(true)}
              >
                <Plus className="mr-2 w-4 h-4" />
                Nova Conta
              </Button>
            </div>

            {/* Search Field */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Buscar por nome ou CPF..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-gray-900 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500"
              />
            </div>
          </CardHeader>
          <CardContent>
            {/* Desktop Table View */}
            <div className="hidden md:block">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-900">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Nome
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        CPF
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Saldo
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-600">
                    {loadingChildAccounts ? (
                      Array.from({ length: 3 }).map((_, i) => (
                        <tr
                          key={i}
                          className="hover:bg-gray-700 transition-colors"
                        >
                          <td className="px-4 py-3 whitespace-nowrap">
                            <Skeleton className="h-4 w-32" />
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <Skeleton className="h-4 w-28" />
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <Skeleton className="h-4 w-20" />
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <Skeleton className="h-6 w-16 rounded-full" />
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="flex space-x-2">
                              <Skeleton className="h-6 w-6" />
                              <Skeleton className="h-6 w-6" />
                              <Skeleton className="h-6 w-6" />
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : filteredChildAccounts &&
                      filteredChildAccounts.length > 0 ? (
                      filteredChildAccounts.map((account: ChildAccount) => (
                        <tr
                          key={account.id}
                          className="hover:bg-gray-700 transition-colors"
                        >
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="text-white font-medium">
                              {account.name}
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="text-gray-300 font-mono text-sm">
                              {account.cpf}
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="flex items-center gap-1">
                              <div className="text-blue-400 font-semibold">
                                R${" "}
                                {parseFloat(
                                  account.balance || "0",
                                ).toLocaleString("pt-BR", {
                                  minimumFractionDigits: 2,
                                })}
                              </div>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-blue-400 hover:text-blue-300 h-5 w-5 p-0"
                                onClick={() => {
                                  toast({
                                    title: "Saldo atualizado",
                                    description:
                                      "O saldo foi atualizado com sucesso",
                                    variant: "default",
                                  });
                                }}
                              >
                                <RefreshCw className="w-3 h-3" />
                              </Button>
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            {(() => {
                              const statusInfo = getAccountStatus(account);
                              if (statusInfo.showButton) {
                                return (
                                  <Button
                                    size="sm"
                                    className={statusInfo.className}
                                    onClick={() => {
                                      setSelectedAccountForKyc(account);
                                      setShowKycStatus(true);
                                    }}
                                  >
                                    {statusInfo.status}
                                  </Button>
                                );
                              }
                              return (
                                <Badge className={statusInfo.className}>
                                  {statusInfo.status}
                                </Badge>
                              );
                            })()}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm">
                            <div className="flex space-x-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-blue-400 hover:text-blue-300 h-7 w-7 p-0"
                                onClick={() => {
                                  setSelectedChildAccount(account);
                                  setShowQrPayment(true);
                                }}
                                title="QR Payment"
                              >
                                <QrCode className="w-3 h-3" />
                              </Button>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="text-blue-400 hover:text-blue-300 h-7 w-7 p-0"
                                    title="Chave PIX"
                                  >
                                    <Key className="w-3 h-3" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="bg-gray-800 border-gray-700">
                                  <DropdownMenuItem
                                    className="text-white hover:bg-gray-700 cursor-pointer"
                                    onClick={() =>
                                      handlePixKeyGeneration("CPF")
                                    }
                                  >
                                    PIX CPF
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    className="text-white hover:bg-gray-700 cursor-pointer"
                                    onClick={() =>
                                      handlePixKeyGeneration("Aleatória")
                                    }
                                  >
                                    Aleatória
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    className="text-white hover:bg-gray-700 cursor-pointer"
                                    onClick={() =>
                                      handlePixKeyGeneration("Email")
                                    }
                                  >
                                    Email
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-blue-400 hover:text-blue-300 h-7 w-7 p-0"
                                onClick={() => {
                                  setSelectedChildForStatement(account);
                                  setShowChildStatement(true);
                                }}
                                title="Extrato"
                              >
                                <FileText className="w-3 h-3" />
                              </Button>

                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-blue-400 hover:text-blue-300 h-7 w-7 p-0"
                                onClick={() => {
                                  setSelectedChildForTransfer(account);
                                  setShowTransferModal(true);
                                }}
                                title="Enviar saldo para conta mãe"
                              >
                                <Send className="w-3 h-3" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center">
                          {searchTerm ? (
                            <>
                              <p className="text-gray-400">
                                Nenhuma conta encontrada para "{searchTerm}"
                              </p>
                              <p className="text-gray-500 text-sm mt-1">
                                Tente buscar por outro nome ou CPF
                              </p>
                            </>
                          ) : (
                            <>
                              <p className="text-gray-400">
                                Nenhuma conta filha encontrada
                              </p>
                              <p className="text-gray-500 text-sm mt-1">
                                Crie sua primeira conta filha para começar
                              </p>
                            </>
                          )}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-3">
              {loadingChildAccounts ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={i}
                    className="bg-gray-900 rounded-lg p-4 border border-gray-700"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <Skeleton className="h-4 w-32 mb-2" />
                        <Skeleton className="h-3 w-28" />
                      </div>
                      <Skeleton className="h-6 w-16 rounded-full" />
                    </div>
                    <div className="flex justify-between items-center mb-3">
                      <div>
                        <Skeleton className="h-3 w-12 mb-1" />
                        <Skeleton className="h-5 w-20" />
                      </div>
                      <Skeleton className="h-6 w-6" />
                    </div>
                    <div className="flex justify-center space-x-2">
                      <Skeleton className="h-8 w-8" />
                      <Skeleton className="h-8 w-8" />
                      <Skeleton className="h-8 w-8" />
                      <Skeleton className="h-8 w-8" />
                    </div>
                  </div>
                ))
              ) : filteredChildAccounts && filteredChildAccounts.length > 0 ? (
                filteredChildAccounts.map((account: ChildAccount) => {
                  const isExpanded = expandedAccounts.has(account.id);
                  const statusInfo = getAccountStatus(account);

                  return (
                    <div
                      key={account.id}
                      className="bg-gray-900 rounded-lg border border-gray-700 overflow-hidden"
                    >
                      {/* Collapsed Header - Always Visible */}
                      <div
                        className="p-4 cursor-pointer hover:bg-gray-800 transition-colors"
                        onClick={() => toggleAccountExpansion(account.id)}
                      >
                        <div className="flex justify-between items-center">
                          <div className="flex-1">
                            <div className="text-white font-medium text-[12px]">
                              {account.name}
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="text-gray-300 font-mono text-xs">
                                {account.cpf}
                              </div>
                              {account.hasActivePix === true ? (
                                <div className="flex flex-col gap-0.5">
                                  <div className="flex items-center gap-1 bg-green-900/30 px-1.5 py-0.5 rounded-full">
                                    <Key className="w-2.5 h-2.5 text-green-400" />
                                    <span className="text-green-400 text-[10px] font-medium">
                                      PIX Ativo
                                    </span>
                                  </div>
                                  {((pixCountdowns[account.id] && !pixCountdowns[account.id].expired) || 
                                    (account.pixTimeRemaining && !account.pixTimeRemaining.expired)) && (
                                    <div className="text-[9px] text-amber-400 font-medium">
                                      {pixCountdowns[account.id]?.remainingText || account.pixTimeRemaining?.remainingText}
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <div className="flex items-center gap-1 bg-red-900/30 px-1.5 py-0.5 rounded-full">
                                  <Key className="w-2.5 h-2.5 text-red-400" />
                                  <span className="text-red-400 text-[10px]">
                                    Sem PIX
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {statusInfo.showButton ? (
                              <Button
                                size="sm"
                                className={`${statusInfo.className} text-xs px-2 py-0.5`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedAccountForKyc(account);
                                  setShowKycStatus(true);
                                }}
                              >
                                {statusInfo.status}
                              </Button>
                            ) : (
                              <Badge
                                className={`${statusInfo.className} text-xs px-2 py-0.5`}
                              >
                                {statusInfo.status}
                              </Badge>
                            )}
                            <ChevronDown
                              className={`w-3 h-3 text-gray-400 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                            />
                          </div>
                        </div>
                      </div>
                      {/* Expanded Content */}
                      {isExpanded && (
                        <div className="px-3 pb-3 border-t border-gray-700">
                          <div className="flex justify-between items-center mb-3 pt-2">
                            <div>
                              <div className="text-gray-400 text-xs">Saldo</div>
                              <div className="text-blue-400 font-semibold text-sm">
                                R${" "}
                                {parseFloat(
                                  account.balance || "0",
                                ).toLocaleString("pt-BR", {
                                  minimumFractionDigits: 2,
                                })}
                              </div>
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-blue-400 hover:text-blue-300 h-6 w-6 p-0"
                              onClick={(e) => {
                                e.stopPropagation();
                                toast({
                                  title: "Saldo atualizado",
                                  description:
                                    "O saldo foi atualizado com sucesso",
                                  variant: "default",
                                });
                              }}
                            >
                              <RefreshCw className="w-3 h-3" />
                            </Button>
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-blue-400 hover:text-blue-300 h-12 flex flex-col items-center justify-center border border-gray-700"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedChildAccount(account);
                                setShowQrPayment(true);
                              }}
                            >
                              <QrCode className="w-4 h-4 mb-1" />
                              <span className="text-xs font-medium">
                                Pagar QR Code
                              </span>
                            </Button>

                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="text-blue-400 hover:text-blue-300 h-12 flex flex-col items-center justify-center border border-gray-700"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <Key className="w-4 h-4 mb-1" />
                                  <span className="text-xs font-medium">
                                    Chaves PIX
                                  </span>
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent className="bg-gray-800 border-gray-700">
                                <DropdownMenuItem
                                  className="text-white hover:bg-gray-700 cursor-pointer text-sm"
                                  onClick={() => {
                                    setSelectedChildAccountForPix(account);
                                    setPixKeyType("CPF");
                                    setShowPixManagementModal(true);
                                  }}
                                >
                                  PIX CPF
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="text-white hover:bg-gray-700 cursor-pointer text-sm"
                                  onClick={() => {
                                    setSelectedChildAccountForPix(account);
                                    setPixKeyType("Aleatória");
                                    setShowPixManagementModal(true);
                                  }}
                                >
                                  Aleatória
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="text-white hover:bg-gray-700 cursor-pointer text-sm"
                                  onClick={() => {
                                    setSelectedChildAccountForPix(account);
                                    setPixKeyType("Email");
                                    setShowPixManagementModal(true);
                                  }}
                                >
                                  Email
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>

                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-blue-400 hover:text-blue-300 h-12 flex flex-col items-center justify-center border border-gray-700"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedChildForStatement(account);
                                setShowChildStatement(true);
                              }}
                            >
                              <FileText className="w-4 h-4 mb-1" />
                              <span className="text-xs font-medium">
                                Extrato
                              </span>
                            </Button>

                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-blue-400 hover:text-blue-300 h-12 flex flex-col items-center justify-center border border-gray-700"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedChildForTransfer(account);
                                setShowTransferModal(true);
                              }}
                            >
                              <Send className="w-4 h-4 mb-1" />
                              <span className="text-xs font-medium">
                                Enviar Conta Mãe
                              </span>
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8">
                  {searchTerm ? (
                    <>
                      <p className="text-gray-400">
                        Nenhuma conta encontrada para "{searchTerm}"
                      </p>
                      <p className="text-gray-500 text-sm mt-1">
                        Tente buscar por outro nome ou CPF
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-gray-400">
                        Nenhuma conta filha encontrada
                      </p>
                      <p className="text-gray-500 text-sm mt-1">
                        Crie sua primeira conta filha para começar
                      </p>
                    </>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      {/* Modals */}
      <ProfileModal open={showProfile} onOpenChange={setShowProfile} />
      <TransactionModals
        open={showTransactionModals}
        onOpenChange={setShowTransactionModals}
      />
      <KycModal open={showKyc} onOpenChange={setShowKyc} />
      <CreateChildAccountModal
        open={showCreateChildAccount}
        onOpenChange={setShowCreateChildAccount}
      />
      {/* PIX Management Modal */}
      <Dialog open={showPixManagementModal} onOpenChange={setShowPixManagementModal}>
        <DialogContent className="w-[95vw] max-w-md bg-gray-800 border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-white text-lg">
              Gerenciar PIX {pixKeyType}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            {selectedChildAccountForPix && (
              <div className="bg-gray-900 rounded-lg p-3 border border-gray-700">
                <div className="text-sm text-gray-400 mb-1">Conta:</div>
                <div className="text-white font-medium">
                  {selectedChildAccountForPix.name}
                </div>
                <div className="text-gray-300 text-sm font-mono">
                  {selectedChildAccountForPix.cpf}
                </div>
              </div>
            )}

            <div className="space-y-3">
              <div className="text-white text-sm">
                Tipo de chave PIX: <span className="font-semibold text-blue-400">{pixKeyType}</span>
              </div>
              
              {selectedChildAccountForPix?.hasActivePix === true && 
               selectedChildAccountForPix?.activePixKeyType === pixKeyType ? (
                <div className="space-y-3">
                  <div className="bg-green-900/30 border border-green-700 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                      <span className="text-green-400 text-sm font-medium">PIX Ativo</span>
                      {((pixCountdowns[selectedChildAccountForPix.id] && !pixCountdowns[selectedChildAccountForPix.id].expired) || 
                        (selectedChildAccountForPix.pixTimeRemaining && !selectedChildAccountForPix.pixTimeRemaining.expired)) && (
                        <span className="text-amber-400 text-xs font-medium ml-auto">
                          {pixCountdowns[selectedChildAccountForPix.id]?.remainingText || selectedChildAccountForPix.pixTimeRemaining?.remainingText}
                        </span>
                      )}
                    </div>
                    <div className="text-white font-mono text-xs break-all">
                      {selectedChildAccountForPix.activePixKey}
                    </div>
                  </div>
                  
                  {/* Important Alert */}
                  <div className="bg-amber-900/30 border border-amber-700 rounded-lg p-3">
                    <div className="flex items-start gap-2">
                      <div className="w-4 h-4 mt-0.5 bg-amber-500 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-black text-xs font-bold">!</span>
                      </div>
                      <div className="text-amber-200 text-xs">
                        <div className="font-semibold mb-1">Importante:</div>
                        <div>
                          Mesmo com o PIX ativo no BetConta, consulte seu banco particular para verificar se a chave está realmente vinculada e funcionando. Isso evita problemas durante transações.
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <Button
                    className="w-full bg-red-600 hover:bg-red-700 text-white"
                    onClick={async () => {
                      try {
                        const response = await fetch(`/api/child-accounts/${selectedChildAccountForPix.id}/pix-key`, {
                          method: 'DELETE',
                        });

                        if (response.ok) {
                          toast({
                            title: "PIX desativado",
                            description: `Chave PIX ${pixKeyType} foi desativada com sucesso`,
                            variant: "default",
                          });
                          await queryClient.refetchQueries({ queryKey: ["/api/child-accounts"] });
                          setShowPixManagementModal(false);
                        } else {
                          const errorData = await response.json();
                          throw new Error(errorData.message || 'Erro no servidor');
                        }
                      } catch (error) {
                        console.error('PIX deactivation error:', error);
                        toast({
                          title: "Erro ao desativar PIX",
                          description: error instanceof Error ? error.message : "Tente novamente mais tarde.",
                          variant: "destructive",
                        });
                      }
                    }}
                  >
                    Desativar PIX
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Only show PIX Inativo card if not activating and not successful */}
                  {!pixActivating && !pixActivationSuccess && (
                    <div className="bg-red-900/30 border border-red-700 rounded-lg p-3">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                        <span className="text-red-400 text-sm font-medium">PIX Inativo</span>
                      </div>
                      <div className="text-gray-400 text-xs mt-1">
                        Nenhuma chave {pixKeyType} configurada
                      </div>
                    </div>
                  )}
                  
                  {pixActivating ? (
                    <div className="space-y-3">
                      <div className="bg-blue-900/30 border border-blue-700 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                          <span className="text-blue-400 text-sm font-medium">Ativando PIX...</span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${pixActivationProgress}%` }}
                          ></div>
                        </div>
                        <div className="text-center text-xs text-gray-400 mt-1">
                          {Math.round(pixActivationProgress)}%
                        </div>
                      </div>
                    </div>
                  ) : pixActivationSuccess ? (
                    <div className="space-y-3">
                      <div className="bg-green-900/30 border border-green-700 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-4 h-4 bg-green-400 rounded-full flex items-center justify-center">
                            <span className="text-black text-xs font-bold">✓</span>
                          </div>
                          <span className="text-green-400 text-sm font-medium">PIX Ativado com Sucesso!</span>
                        </div>
                        <div className="text-white text-xs">
                          {pixKeyType === "CPF" 
                            ? "Verifique no seu banco se a chave PIX CPF está realmente vinculada antes de usar."
                            : `Chave PIX ${pixKeyType} ativada. Consulte seu banco para confirmar o funcionamento.`
                          }
                        </div>
                      </div>
                      
                      {/* Important Alert - same as when PIX is active */}
                      <div className="bg-amber-900/30 border border-amber-700 rounded-lg p-3">
                        <div className="flex items-start gap-2">
                          <div className="w-4 h-4 mt-0.5 bg-amber-500 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-black text-xs font-bold">!</span>
                          </div>
                          <div className="text-amber-200 text-xs">
                            <div className="font-semibold mb-1">Importante:</div>
                            <div>
                              Mesmo com o PIX ativo no BetConta, consulte seu banco particular para verificar se a chave está realmente vinculada e funcionando. Isso evita problemas durante transações.
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <Button
                      className="w-full bg-green-600 hover:bg-green-700 text-white"
                      onClick={async () => {
                        setPixActivating(true);
                        setPixActivationProgress(0);
                        setPixActivationSuccess(false);
                        
                        // Progress bar animation
                        const progressInterval = setInterval(() => {
                          setPixActivationProgress(prev => {
                            if (prev >= 100) {
                              clearInterval(progressInterval);
                              return 100;
                            }
                            return prev + 10;
                          });
                        }, 1000);
                        
                        try {
                          // Wait for progress to complete
                          await new Promise(resolve => setTimeout(resolve, 10000));
                          
                          const response = await fetch(`/api/child-accounts/${selectedChildAccountForPix?.id}/pix-key`, {
                            method: 'POST',
                            headers: {
                              'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({ keyType: pixKeyType }),
                          });

                          if (response.ok) {
                            const { pixKey } = await response.json();
                            setPixActivationSuccess(true);
                            await queryClient.refetchQueries({ queryKey: ["/api/child-accounts"] });
                          } else {
                            const errorData = await response.json();
                            throw new Error(errorData.message || 'Erro no servidor');
                          }
                        } catch (error) {
                          console.error('PIX activation error:', error);
                          toast({
                            title: "Erro ao ativar PIX",
                            description: error instanceof Error ? error.message : "Tente novamente mais tarde.",
                            variant: "destructive",
                          });
                        } finally {
                          setPixActivating(false);
                          clearInterval(progressInterval);
                        }
                      }}
                    >
                      Ativar PIX
                    </Button>
                  )}
                </div>
              )}
            </div>

            <div className="flex justify-center pt-2">
              <Button
                variant="outline"
                className="border-gray-600 text-gray-300 hover:bg-gray-700"
                onClick={() => {
                  setShowPixManagementModal(false);
                  setPixActivating(false);
                  setPixActivationProgress(0);
                  setPixActivationSuccess(false);
                }}
              >
                Fechar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      {/* PIX Key Loading Modal */}
      <Dialog open={showPixKeyLoading} onOpenChange={() => {}}>
        <DialogContent className="w-[95vw] max-w-md bg-gray-800 border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-white text-lg">
              Chave PIX {pixKeyType}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label className="text-white text-sm">Sua nova chave PIX:</Label>
              <div className="bg-gray-900 rounded-lg p-3 border border-gray-700">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-white font-mono text-sm break-all flex-1">
                    {generatedPixKey}
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-blue-400 hover:text-blue-300 hover:bg-gray-700 flex-shrink-0"
                    onClick={copyPixKey}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex justify-center pt-2">
              <Button
                variant="outline"
                className="border-gray-600 text-gray-300 hover:bg-gray-700"
                onClick={() => setShowPixKeyLoading(false)}
              >
                Fechar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      {/* QR Payment Modal */}
      <Dialog open={showQrPayment} onOpenChange={setShowQrPayment}>
        <DialogContent className="w-[95vw] max-w-md bg-gray-800 border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-white text-lg">
              Pagamento via QR Code
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            {selectedChildAccount && (
              <div className="bg-gray-900 rounded-lg p-3 border border-gray-700">
                <div className="text-sm text-gray-400">Conta selecionada:</div>
                <div className="text-white font-medium">
                  {selectedChildAccount.name}
                </div>
                <div className="text-gray-300 text-sm font-mono">
                  {selectedChildAccount.cpf}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label className="text-white">Código QR do PIX</Label>
              <Textarea
                placeholder="Cole aqui o código QR do PIX para pagamento..."
                className="bg-gray-700 border-gray-600 text-white placeholder-gray-400 resize-none"
                rows={6}
              />
              <p className="text-xs text-gray-400">
                O valor será extraído automaticamente do código QR
              </p>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-700"
                onClick={() => setShowQrPayment(false)}
              >
                Cancelar
              </Button>
              <Button
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                onClick={() => {
                  toast({
                    title: "Pagamento processado",
                    description:
                      "O pagamento via QR Code foi processado com sucesso",
                    variant: "default",
                  });
                  setShowQrPayment(false);
                }}
              >
                <Scan className="w-4 h-4 mr-2" />
                Processar Pagamento
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      {/* Statement Modal */}
      <Dialog open={showStatement} onOpenChange={setShowStatement}>
        <DialogContent className="w-[95vw] max-w-4xl h-[90vh] overflow-y-auto bg-gray-800 border-gray-700 p-3 sm:p-6">
          <DialogHeader className="pb-2">
            <DialogTitle className="text-white text-lg sm:text-xl">
              Extrato de Transações
            </DialogTitle>
          </DialogHeader>

          <div className="mt-2">
            {/* Desktop Table View */}
            <div className="hidden sm:block">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-900">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Data e Hora
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Tipo
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Categoria
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Valor
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Destino/Origem
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-600">
                    {loadingTransactions ? (
                      Array.from({ length: 10 }).map((_, i) => (
                        <tr
                          key={i}
                          className="hover:bg-gray-700 transition-colors"
                        >
                          <td className="px-4 py-3 whitespace-nowrap">
                            <Skeleton className="h-4 w-32" />
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <Skeleton className="h-4 w-16" />
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <Skeleton className="h-4 w-12" />
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <Skeleton className="h-4 w-20" />
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <Skeleton className="h-4 w-28" />
                          </td>
                        </tr>
                      ))
                    ) : pixTransactions && pixTransactions.length > 0 ? (
                      pixTransactions.map((transaction: PixTransaction) => (
                        <tr
                          key={transaction.id}
                          className="hover:bg-gray-700 transition-colors"
                        >
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="text-gray-300 text-xs font-mono">
                              {new Date(transaction.createdAt!).toLocaleString(
                                "pt-BR",
                                {
                                  day: "2-digit",
                                  month: "2-digit",
                                  year: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                },
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span
                              className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                transaction.type === "received"
                                  ? "bg-blue-600 text-white"
                                  : "bg-red-600 text-white"
                              }`}
                            >
                              {transaction.type === "received"
                                ? "Crédito"
                                : "Débito"}
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className="text-gray-300 font-semibold">
                              PIX
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div
                              className={`font-semibold ${
                                transaction.type === "received"
                                  ? "text-blue-400"
                                  : "text-red-400"
                              }`}
                            >
                              {transaction.type === "received" ? "+" : "-"}R${" "}
                              {parseFloat(transaction.amount).toLocaleString(
                                "pt-BR",
                                { minimumFractionDigits: 2 },
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="text-gray-300 font-medium">
                              {transaction.counterpartyName}
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center">
                          <p className="text-gray-400">
                            Nenhuma transação encontrada
                          </p>
                          <p className="text-gray-500 text-sm mt-1">
                            Suas transações aparecerão aqui
                          </p>
                        </td>
                      </tr>
                    )}

                    {/* Example TEV transactions */}
                    <tr className="hover:bg-gray-700 transition-colors">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-gray-300 text-xs font-mono">
                          15/06/2025 14:30
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-600 text-white">
                          Débito
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="text-gray-300 font-semibold">TEV</span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="font-semibold text-red-400">
                          -R$ 150,00
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-gray-300 font-medium">
                          Casa de Apostas Premium
                        </div>
                      </td>
                    </tr>

                    <tr className="hover:bg-gray-700 transition-colors">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-gray-300 text-xs font-mono">
                          14/06/2025 09:15
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-600 text-white">
                          Crédito
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="text-gray-300 font-semibold">TEV</span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="font-semibold text-blue-400">
                          +R$ 500,00
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-gray-300 font-medium">
                          Depósito - Bet365
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile Card View */}
            <div className="sm:hidden space-y-2">
              {loadingTransactions ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="bg-gray-900 rounded-md p-2">
                    <div className="flex justify-between items-start mb-1">
                      <Skeleton className="h-3 w-16" />
                      <Skeleton className="h-4 w-12 rounded-full" />
                    </div>
                    <div className="flex justify-between items-center">
                      <div>
                        <Skeleton className="h-3 w-6 mb-1" />
                        <Skeleton className="h-3 w-20" />
                      </div>
                      <Skeleton className="h-4 w-16" />
                    </div>
                  </div>
                ))
              ) : pixTransactions && pixTransactions.length > 0 ? (
                pixTransactions.map((transaction: PixTransaction) => (
                  <div
                    key={transaction.id}
                    className="bg-gray-900 rounded-md p-2"
                  >
                    <div className="flex justify-between items-start mb-1">
                      <div className="text-gray-400 text-xs font-mono">
                        {new Date(transaction.createdAt!).toLocaleString(
                          "pt-BR",
                          {
                            day: "2-digit",
                            month: "2-digit",
                            hour: "2-digit",
                            minute: "2-digit",
                          },
                        )}
                      </div>
                      <span
                        className={`inline-flex px-1.5 py-0.5 text-xs font-semibold rounded-full ${
                          transaction.type === "received"
                            ? "bg-blue-600 text-white"
                            : "bg-red-600 text-white"
                        }`}
                      >
                        {transaction.type === "received" ? "Crédito" : "Débito"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="text-gray-300 font-semibold text-xs">
                          PIX
                        </div>
                        <div className="text-gray-400 text-xs truncate max-w-[120px]">
                          {transaction.counterpartyName}
                        </div>
                      </div>
                      <div
                        className={`font-semibold text-sm ${
                          transaction.type === "received"
                            ? "text-blue-400"
                            : "text-red-400"
                        }`}
                      >
                        {transaction.type === "received" ? "+" : "-"}R${" "}
                        {parseFloat(transaction.amount).toLocaleString(
                          "pt-BR",
                          { minimumFractionDigits: 2 },
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-6">
                  <p className="text-gray-400">Nenhuma transação encontrada</p>
                  <p className="text-gray-500 text-sm mt-1">
                    Suas transações aparecerão aqui
                  </p>
                </div>
              )}

              {/* Example TEV transactions for mobile */}
              <div className="bg-gray-900 rounded-md p-2">
                <div className="flex justify-between items-start mb-1">
                  <div className="text-gray-400 text-xs font-mono">
                    15/06 14:30
                  </div>
                  <span className="inline-flex px-1.5 py-0.5 text-xs font-semibold rounded-full bg-red-600 text-white">
                    Débito
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <div>
                    <div className="text-gray-300 font-semibold text-xs">
                      TEV
                    </div>
                    <div className="text-gray-400 text-xs truncate max-w-[120px]">
                      Casa de Apostas Premium
                    </div>
                  </div>
                  <div className="font-semibold text-sm text-red-400">
                    -R$ 150,00
                  </div>
                </div>
              </div>

              <div className="bg-gray-900 rounded-md p-2">
                <div className="flex justify-between items-start mb-1">
                  <div className="text-gray-400 text-xs font-mono">
                    14/06 09:15
                  </div>
                  <span className="inline-flex px-1.5 py-0.5 text-xs font-semibold rounded-full bg-blue-600 text-white">
                    Crédito
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <div>
                    <div className="text-gray-300 font-semibold text-xs">
                      TEV
                    </div>
                    <div className="text-gray-400 text-xs truncate max-w-[120px]">
                      Depósito - Bet365
                    </div>
                  </div>
                  <div className="font-semibold text-sm text-blue-400">
                    +R$ 500,00
                  </div>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      {/* Child Account Statement Modal */}
      <Dialog open={showChildStatement} onOpenChange={setShowChildStatement}>
        <DialogContent className="w-[95vw] max-w-4xl h-[90vh] overflow-y-auto bg-gray-800 border-gray-700 p-3 sm:p-6">
          <DialogHeader className="pb-0 mb-2">
            <DialogTitle className="text-white text-lg sm:text-xl">
              Extrato - {selectedChildForStatement?.name}
            </DialogTitle>
            <div className="text-gray-400 text-sm">
              CPF: {selectedChildForStatement?.cpf}
            </div>
          </DialogHeader>

          <div>
            {/* Desktop Table View */}
            <div className="hidden sm:block">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-900">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Data e Hora
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Transação
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Categoria
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Valor
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Destino/Origem
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Comprovante
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-600">
                    {loadingChildTransactions
                      ? Array.from({ length: 10 }).map((_, i) => (
                          <tr
                            key={i}
                            className="hover:bg-gray-700 transition-colors"
                          >
                            <td className="px-4 py-3 whitespace-nowrap">
                              <Skeleton className="h-4 w-32" />
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <Skeleton className="h-4 w-16" />
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <Skeleton className="h-4 w-12" />
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <Skeleton className="h-4 w-20" />
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <Skeleton className="h-4 w-28" />
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <Skeleton className="h-4 w-8" />
                            </td>
                          </tr>
                        ))
                      : childTransactions && childTransactions.length > 0
                        ? childTransactions.map(
                            (transaction: PixTransaction) => (
                              <tr
                                key={transaction.id}
                                className="hover:bg-gray-700 transition-colors"
                              >
                                <td className="px-4 py-3 whitespace-nowrap">
                                  <div className="text-gray-300 text-xs font-mono">
                                    {new Date(
                                      transaction.createdAt!,
                                    ).toLocaleString("pt-BR", {
                                      day: "2-digit",
                                      month: "2-digit",
                                      year: "numeric",
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })}
                                  </div>
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap">
                                  <span
                                    className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                      transaction.type === "received"
                                        ? "bg-blue-600 text-white"
                                        : "bg-red-600 text-white"
                                    }`}
                                  >
                                    {transaction.type === "received"
                                      ? "Crédito"
                                      : "Débito"}
                                  </span>
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap">
                                  <span className="text-gray-300 font-semibold">
                                    PIX
                                  </span>
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap">
                                  <div
                                    className={`font-semibold ${
                                      transaction.type === "received"
                                        ? "text-blue-400"
                                        : "text-red-400"
                                    }`}
                                  >
                                    {transaction.type === "received"
                                      ? "+"
                                      : "-"}
                                    R${" "}
                                    {parseFloat(
                                      transaction.amount,
                                    ).toLocaleString("pt-BR", {
                                      minimumFractionDigits: 2,
                                    })}
                                  </div>
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap">
                                  <div className="text-gray-300 font-medium">
                                    {transaction.counterpartyName}
                                  </div>
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="text-blue-400 hover:text-blue-300"
                                    onClick={() => {
                                      setSelectedTransaction(transaction);
                                      setShowReceipt(true);
                                    }}
                                  >
                                    <FileText className="w-4 h-4" />
                                  </Button>
                                </td>
                              </tr>
                            ),
                          )
                        : null}

                    {/* Example transactions for demonstration */}
                    <tr className="hover:bg-gray-700 transition-colors">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-gray-300 text-xs font-mono">
                          18/06/2025 16:45
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-600 text-white">
                          Crédito
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="text-gray-300 font-semibold">PIX</span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="font-semibold text-blue-400">
                          +R$ 250,00
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-gray-300 font-medium">
                          João Silva Santos
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-blue-400 hover:text-blue-300"
                          onClick={() => {
                            setSelectedTransaction({
                              id: 999,
                              type: "received",
                              amount: "250.00",
                              counterpartyName: "João Silva Santos",
                              createdAt: "2025-06-18T16:45:00Z",
                            } as PixTransaction);
                            setShowReceipt(true);
                          }}
                        >
                          <FileText className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>

                    <tr className="hover:bg-gray-700 transition-colors">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-gray-300 text-xs font-mono">
                          17/06/2025 14:20
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-600 text-white">
                          Débito
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="text-gray-300 font-semibold">TEV</span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="font-semibold text-red-400">
                          -R$ 75,50
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-gray-300 font-medium">
                          Bet365 - Depósito
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-blue-400 hover:text-blue-300"
                          onClick={() => {
                            setSelectedTransaction({
                              id: 998,
                              type: "sent",
                              amount: "75.50",
                              counterpartyName: "Bet365 - Depósito",
                              createdAt: "2025-06-17T14:20:00Z",
                            } as PixTransaction);
                            setShowReceipt(true);
                          }}
                        >
                          <FileText className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>

                    <tr className="hover:bg-gray-700 transition-colors">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-gray-300 text-xs font-mono">
                          16/06/2025 10:30
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-600 text-white">
                          Crédito
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="text-gray-300 font-semibold">TEV</span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="font-semibold text-blue-400">
                          +R$ 300,00
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-gray-300 font-medium">
                          Transferência - Conta Master
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-blue-400 hover:text-blue-300"
                          onClick={() => {
                            setSelectedTransaction({
                              id: 997,
                              type: "received",
                              amount: "300.00",
                              counterpartyName: "Transferência - Conta Master",
                              createdAt: "2025-06-16T10:30:00Z",
                            } as PixTransaction);
                            setShowReceipt(true);
                          }}
                        >
                          <FileText className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile Card View */}
            <div className="sm:hidden space-y-2">
              {loadingChildTransactions ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="bg-gray-900 rounded-md p-2">
                    <div className="flex justify-between items-start mb-1">
                      <Skeleton className="h-3 w-16" />
                      <Skeleton className="h-4 w-12 rounded-full" />
                    </div>
                    <div className="flex justify-between items-center">
                      <div>
                        <Skeleton className="h-3 w-6 mb-1" />
                        <Skeleton className="h-3 w-20" />
                      </div>
                      <Skeleton className="h-4 w-16" />
                    </div>
                  </div>
                ))
              ) : childTransactions && childTransactions.length > 0 ? (
                childTransactions.map((transaction: PixTransaction) => (
                  <div
                    key={transaction.id}
                    className="bg-gray-900 rounded-md p-2"
                  >
                    <div className="flex justify-between items-start mb-1">
                      <div className="text-gray-400 text-xs font-mono">
                        {new Date(transaction.createdAt!).toLocaleString(
                          "pt-BR",
                          {
                            day: "2-digit",
                            month: "2-digit",
                            hour: "2-digit",
                            minute: "2-digit",
                          },
                        )}
                      </div>
                      <span
                        className={`inline-flex px-1.5 py-0.5 text-xs font-semibold rounded-full ${
                          transaction.type === "received"
                            ? "bg-blue-600 text-white"
                            : "bg-red-600 text-white"
                        }`}
                      >
                        {transaction.type === "received" ? "Crédito" : "Débito"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="text-gray-300 font-semibold text-xs">
                          PIX
                        </div>
                        <div className="text-gray-400 text-xs truncate max-w-[120px]">
                          {transaction.counterpartyName}
                        </div>
                      </div>
                      <div
                        className={`font-semibold text-sm ${
                          transaction.type === "received"
                            ? "text-blue-400"
                            : "text-red-400"
                        }`}
                      >
                        {transaction.type === "received" ? "+" : "-"}R${" "}
                        {parseFloat(transaction.amount).toLocaleString(
                          "pt-BR",
                          { minimumFractionDigits: 2 },
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-6">
                  <p className="text-gray-400">Nenhuma transação encontrada</p>
                  <p className="text-gray-500 text-sm mt-1">
                    As transações desta conta aparecerão aqui
                  </p>
                </div>
              )}

              {/* Example transactions for mobile */}
              <div className="bg-gray-900 rounded-md p-2">
                <div className="flex justify-between items-start mb-1">
                  <div className="text-gray-400 text-xs font-mono">
                    18/06 16:45
                  </div>
                  <span className="inline-flex px-1.5 py-0.5 text-xs font-semibold rounded-full bg-blue-600 text-white">
                    Crédito
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <div>
                    <div className="text-gray-300 font-semibold text-xs">
                      PIX
                    </div>
                    <div className="text-gray-400 text-xs truncate max-w-[120px]">
                      João Silva Santos
                    </div>
                  </div>
                  <div className="font-semibold text-sm text-blue-400">
                    +R$ 250,00
                  </div>
                </div>
              </div>

              <div className="bg-gray-900 rounded-md p-2">
                <div className="flex justify-between items-start mb-1">
                  <div className="text-gray-400 text-xs font-mono">
                    17/06 14:20
                  </div>
                  <span className="inline-flex px-1.5 py-0.5 text-xs font-semibold rounded-full bg-red-600 text-white">
                    Débito
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <div>
                    <div className="text-gray-300 font-semibold text-xs">
                      TEV
                    </div>
                    <div className="text-gray-400 text-xs truncate max-w-[120px]">
                      Bet365 - Depósito
                    </div>
                  </div>
                  <div className="font-semibold text-sm text-red-400">
                    -R$ 75,50
                  </div>
                </div>
              </div>

              <div className="bg-gray-900 rounded-md p-2">
                <div className="flex justify-between items-start mb-1">
                  <div className="text-gray-400 text-xs font-mono">
                    16/06 10:30
                  </div>
                  <span className="inline-flex px-1.5 py-0.5 text-xs font-semibold rounded-full bg-blue-600 text-white">
                    Crédito
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <div>
                    <div className="text-gray-300 font-semibold text-xs">
                      TEV
                    </div>
                    <div className="text-gray-400 text-xs truncate max-w-[120px]">
                      Transferência - Conta Master
                    </div>
                  </div>
                  <div className="font-semibold text-sm text-blue-400">
                    +R$ 300,00
                  </div>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      {/* Receipt Modal */}
      <Dialog open={showReceipt} onOpenChange={setShowReceipt}>
        <DialogContent className="fixed left-[50%] top-[50%] z-50 grid translate-x-[-50%] translate-y-[-50%] gap-4 border p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg w-[95vw] max-w-md border-gray-700 bg-[#ffffff] text-[#000000]">
          <DialogHeader>
            <DialogTitle className="font-semibold tracking-tight text-lg text-center text-[#000000]">
              Comprovante de Transação
            </DialogTitle>
          </DialogHeader>

          {selectedTransaction && (
            <div className="space-y-4 mt-4">
              {/* Receipt Header */}
              <div className="text-center border-b border-gray-600 pb-4">
                <img
                  src="/assets/cartos-logo.png"
                  alt="Cartos"
                  className="h-10 mx-auto mb-2"
                />
                <div className="text-sm text-[#000000]">Banco Digital</div>
              </div>

              {/* Transaction Details */}
              <div className="space-y-3">
                <div className="bg-gray-100 rounded-lg p-3 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-[#000000] text-sm">Tipo:</span>
                    <span
                      className={`font-semibold text-sm ${
                        selectedTransaction.type === "received"
                          ? "text-blue-600"
                          : "text-red-600"
                      }`}
                    >
                      {selectedTransaction.type === "received"
                        ? "Crédito"
                        : "Débito"}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-[#000000] text-sm">Valor:</span>
                    <span
                      className={`font-bold text-lg ${
                        selectedTransaction.type === "received"
                          ? "text-blue-600"
                          : "text-red-600"
                      }`}
                    >
                      {selectedTransaction.type === "received" ? "+" : "-"}R${" "}
                      {parseFloat(selectedTransaction.amount).toLocaleString(
                        "pt-BR",
                        { minimumFractionDigits: 2 },
                      )}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-[#000000] text-sm">Data/Hora:</span>
                    <span className="text-[#000000] text-sm font-mono">
                      {new Date(selectedTransaction.createdAt!).toLocaleString(
                        "pt-BR",
                        {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        },
                      )}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-[#000000] text-sm">
                      Destino/Origem:
                    </span>
                    <span className="text-[#000000] text-sm font-medium text-right max-w-[180px] break-words">
                      {selectedTransaction.counterpartyName}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-[#000000] text-sm">
                      ID Transação:
                    </span>
                    <span className="text-[#000000] text-sm font-mono">
                      {selectedTransaction.transactionId ||
                        `CRT${selectedTransaction.id?.toString().padStart(6, "0")}`}
                    </span>
                  </div>
                </div>

                {/* Account Info */}
                <div className="bg-gray-100 rounded-lg p-3 space-y-2">
                  <div className="text-center text-[#000000] text-xs mb-2">
                    Conta
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#000000] text-sm">Nome:</span>
                    <span className="text-[#000000] text-sm">
                      {selectedChildForStatement?.name || "Conta Master"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#000000] text-sm">CPF:</span>
                    <span className="text-[#000000] text-sm font-mono">
                      {selectedChildForStatement?.cpf || "***.***.***-**"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#000000] text-sm">Agência:</span>
                    <span className="text-[#000000] text-sm font-mono">
                      0001
                    </span>
                  </div>
                </div>

                {/* Status */}
                <div className="text-center py-2">
                  <div className="inline-flex items-center bg-blue-600 text-white text-xs px-3 py-1 rounded-full">
                    <div className="w-2 h-2 bg-white rounded-full mr-2"></div>
                    Transação Concluída
                  </div>
                </div>

                {/* Footer */}
                <div className="text-center text-xs text-gray-500 border-t border-gray-300 pt-3">
                  <div>Este comprovante tem validade jurídica</div>
                  <div className="mt-1">
                    Cartos - Banco Digital para Apostas
                  </div>
                  <div className="mt-2 font-mono">
                    {new Date().toLocaleString("pt-BR", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border hover:text-accent-foreground h-10 px-4 py-2 flex-1 border-gray-300 hover:bg-gray-100 text-[#000000] bg-[#ffffff]"
                  onClick={() => setShowReceipt(false)}
                >
                  Fechar
                </Button>
                <Button
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                  onClick={() => {
                    toast({
                      title: "Comprovante salvo",
                      description: "O comprovante foi salvo com sucesso",
                      variant: "default",
                    });
                  }}
                >
                  Salvar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      {/* Transfer Modal */}
      <Dialog open={showTransferModal} onOpenChange={setShowTransferModal}>
        <DialogContent className="fixed left-[50%] top-[50%] z-50 grid translate-x-[-50%] translate-y-[-50%] gap-4 border p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg w-[95vw] max-w-md border-gray-700 bg-[#ffffff] text-[#000000]">
          <DialogHeader>
            <DialogTitle className="font-semibold tracking-tight text-lg text-center text-[#000000]">
              Transferência Realizada
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            {selectedChildForTransfer && (
              <>
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                    <Send className="w-8 h-8 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Saldo Transferido com Sucesso!
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    O saldo da conta filha foi enviado para a conta principal
                  </p>
                </div>

                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">De:</span>
                    <span className="text-sm font-medium text-gray-900">
                      {selectedChildForTransfer.name}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Para:</span>
                    <span className="text-sm font-medium text-gray-900">
                      Conta Principal
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Valor:</span>
                    <span className="text-sm font-medium text-blue-600">
                      R${" "}
                      {parseFloat(
                        selectedChildForTransfer.balance,
                      ).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <RefreshCw className="h-4 w-4 text-yellow-600 mt-0.5" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-yellow-800">
                        <strong>Importante:</strong> Atualize o saldo da conta
                        principal em 30 segundos para ver o valor transferido.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                    onClick={() => {
                      setShowTransferModal(false);
                      toast({
                        title: "Transferência concluída",
                        description:
                          "O saldo foi transferido para a conta principal",
                        variant: "default",
                      });
                    }}
                  >
                    Entendi
                  </Button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
      {/* Fees Modal */}
      <Dialog open={showFeesModal} onOpenChange={setShowFeesModal}>
        <DialogContent className="w-[95vw] max-w-md bg-[#ffffff] border-gray-200 p-3 sm:p-6">
          <DialogHeader className="text-center pb-3">
            <DialogTitle className="text-lg font-bold text-[#000000] flex items-center justify-center gap-2">
              <DollarSign className="w-5 h-5 text-blue-600" />
              Taxas Operacionais
            </DialogTitle>
            <p className="text-xs text-gray-600 mt-1">
              Confira todas as taxas aplicadas
            </p>
          </DialogHeader>

          <div className="space-y-2">
            {/* Custo Mensal */}
            <div className="flex justify-between items-center p-2 bg-gray-50 rounded border border-gray-200">
              <div className="flex-1 pr-2">
                <h4 className="font-semibold text-gray-900 text-xs">
                  Custo Mensal por Conta Filha
                </h4>
                <p className="text-xs text-gray-600">Descontado na aprovação</p>
              </div>
              <div className="text-right">
                <span className="font-bold text-blue-600 text-sm">
                  R$ 90,00
                </span>
              </div>
            </div>

            {/* PIX In */}
            <div className="flex justify-between items-center p-2 bg-gray-50 rounded border border-gray-200">
              <div className="flex-1 pr-2">
                <h4 className="font-semibold text-gray-900 text-xs">PIX In</h4>
                <p className="text-xs text-gray-600">Por entrada de saldo</p>
              </div>
              <div className="text-right">
                <span className="font-bold text-blue-600 text-sm">R$ 0,50</span>
              </div>
            </div>

            {/* Saque */}
            <div className="flex justify-between items-center p-2 bg-gray-50 rounded border border-gray-200">
              <div className="flex-1 pr-2">
                <h4 className="font-semibold text-gray-900 text-xs">
                  Saque Conta Master
                </h4>
                <p className="text-xs text-gray-600">Por saque realizado</p>
              </div>
              <div className="text-right">
                <span className="font-bold text-blue-600 text-sm">R$ 2,00</span>
              </div>
            </div>

            {/* QR Code */}
            <div className="flex justify-between items-center p-2 bg-gray-50 rounded border border-gray-200">
              <div className="flex-1 pr-2">
                <h4 className="font-semibold text-gray-900 text-xs">
                  Pagamento QR Code
                </h4>
                <p className="text-xs text-gray-600">Por pagamento realizado</p>
              </div>
              <div className="text-right">
                <span className="font-bold text-blue-600 text-sm">R$ 0,50</span>
              </div>
            </div>
          </div>

          {/* Aviso */}
          <div className="bg-blue-50 border border-blue-200 rounded p-2 mt-3">
            <div className="flex items-start gap-2">
              <DollarSign className="h-3 w-3 text-blue-600 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-blue-800">
                <strong>Importante:</strong> Taxas descontadas automaticamente
                do saldo da conta master. Mantenha saldo suficiente para evitar
                bloqueio.
              </p>
            </div>
          </div>

          {/* Botão */}
          <div className="pt-3">
            <Button
              className="w-full bg-blue-600 hover:bg-blue-700 text-white h-8 text-sm"
              onClick={() => setShowFeesModal(false)}
            >
              Entendi
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      {/* FAQ Modal */}
      <Dialog open={showFaqModal} onOpenChange={setShowFaqModal}>
        <DialogContent className="w-[95vw] max-w-2xl h-[85vh] overflow-y-auto bg-white border-gray-200 p-3 sm:p-6">
          <DialogHeader className="pb-3">
            <DialogTitle className="text-black text-lg font-bold">
              FAQ - Informações Importantes
            </DialogTitle>
          </DialogHeader>

          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-1">
              <AccordionTrigger className="text-left font-medium text-gray-900 text-sm">
                1. Posso usar o banco para outras finalidades que não sejam
                apostas esportivas?
              </AccordionTrigger>
              <AccordionContent>
                <p className="text-gray-700 text-xs leading-relaxed">
                  <strong>R:</strong> Não, a BetConta possui bloqueios
                  protegendo a operação exclusivamente para o nicho de Bet's,
                  evitando golpes diversos.
                </p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-2">
              <AccordionTrigger className="text-left font-medium text-gray-900 text-sm">
                2. Consigo receber PIX de outras titularidades?
              </AccordionTrigger>
              <AccordionContent>
                <p className="text-gray-700 text-xs leading-relaxed">
                  <strong>R:</strong> Não, qualquer valor não relacionado a BET
                  será devolvido automaticamente, reforçando a segurança do
                  sistema.
                </p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-3">
              <AccordionTrigger className="text-left font-medium text-gray-900 text-sm">
                3. Por que não consigo depositar na Conta Master?
              </AccordionTrigger>
              <AccordionContent>
                <div className="text-gray-700 text-xs leading-relaxed">
                  <p>
                    <strong>R:</strong> A conta Master só recebe depósito dos
                    seguintes bancos:
                  </p>
                  <ul className="mt-1 ml-3 space-y-0.5 list-disc text-xs">
                    <li>Itaú, Banco do Brasil, Bradesco</li>
                    <li>Caixa, Santander, Nubank</li>
                    <li>Inter, PagBank, Neon</li>
                    <li>C6 Bank, PicPay, Mercado Pago</li>
                  </ul>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-4">
              <AccordionTrigger className="text-left font-medium text-gray-900 text-sm">
                4. Com KYC pendente posso criar chaves PIX?
              </AccordionTrigger>
              <AccordionContent>
                <p className="text-gray-700 text-xs leading-relaxed">
                  <strong>R:</strong> Não, pois a conta ainda não existe no
                  banco por não ter sido aprovada.
                </p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-5">
              <AccordionTrigger className="text-left font-medium text-gray-900 text-sm">
                5. Conta não sai de "Aguardando aprovação", o que pode ser?
              </AccordionTrigger>
              <AccordionContent>
                <p className="text-gray-700 text-xs leading-relaxed">
                  <strong>R:</strong> Pode ser falta de saldo na Conta Master
                  para descontar o custo, ou a Liquidante pode estar solicitando
                  alteração documental.
                </p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-6">
              <AccordionTrigger className="text-left font-medium text-gray-900 text-sm">
                6. Chave PIX CPF não está ativando, o que pode ser?
              </AccordionTrigger>
              <AccordionContent>
                <p className="text-gray-700 text-xs leading-relaxed">
                  <strong>R:</strong> Aguarde alguns segundos e consulte seu
                  banco para certificar que o PIX estava disponível para
                  vinculação.
                </p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-7">
              <AccordionTrigger className="text-left font-medium text-gray-900 text-sm">
                7. Posso alterar a chave PIX Email depois de criada?
              </AccordionTrigger>
              <AccordionContent>
                <p className="text-gray-700 text-xs leading-relaxed">
                  <strong>R:</strong> Não, uma vez criada não há como trocar.
                </p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-8">
              <AccordionTrigger className="text-left font-medium text-gray-900 text-sm">
                8. Saque da casa de aposta caiu na conta filha, como sacar?
              </AccordionTrigger>
              <AccordionContent>
                <p className="text-gray-700 text-xs leading-relaxed">
                  <strong>R:</strong> Clique no ícone atualizar saldo na conta
                  filha, depois clique no ícone Enviar para transferir para a
                  conta mãe.
                </p>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          <div className="flex justify-center pt-3 border-t border-gray-200 mt-3">
            <Button
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 h-8 text-sm"
              onClick={() => setShowFaqModal(false)}
            >
              Fechar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      {/* KYC Status Modal */}
      <Dialog open={showKycStatus} onOpenChange={setShowKycStatus}>
        <DialogContent className="w-[95vw] max-w-2xl bg-gray-800 border-gray-700 max-h-[90vh] overflow-y-auto">
          <DialogHeader className="sticky top-0 bg-gray-800 z-10 pb-2">
            <DialogTitle className="text-white text-lg md:text-xl">
              Status KYC - {selectedAccountForKyc?.name}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 md:space-y-6 mt-2 md:mt-4">
            {selectedAccountForKyc && (
              <div className="bg-gray-900 rounded-lg p-3 md:p-4 border border-gray-700">
                <div className="text-xs md:text-sm text-gray-400 mb-2">
                  Conta selecionada:
                </div>
                <div className="text-white font-medium text-sm md:text-base">
                  {selectedAccountForKyc.name}
                </div>
                <div className="text-gray-300 text-xs md:text-sm font-mono">
                  {selectedAccountForKyc.cpf}
                </div>
              </div>
            )}

            {/* Automated Status Timeline */}
            <div className="space-y-3 md:space-y-4">
              <h3 className="text-white font-medium text-sm md:text-base">
                Timeline do Processo
              </h3>
              <div className="space-y-2 md:space-y-3">
                {(() => {
                  // Get KYC submission time from the selected account or KYC documents
                  const submissionTime =
                    selectedAccountForKyc?.createdAt ||
                    (kycDocuments && kycDocuments.length > 0
                      ? kycDocuments[0].submittedAt
                      : null);

                  const timeline = generateKycTimeline(
                    submissionTime,
                    selectedAccountForKyc?.status,
                  );

                  return timeline.map((item, index) => {
                    let statusColor = "bg-gray-500";
                    let textColor = "text-gray-500";

                    if (item.status === "completed") {
                      statusColor = "bg-green-500";
                      textColor = "text-white";
                    } else if (item.status === "pending") {
                      statusColor = "bg-yellow-500";
                      textColor = "text-white";
                    } else if (item.status === "info") {
                      statusColor = "bg-blue-500";
                      textColor = "text-blue-200";
                    }

                    return (
                      <div
                        key={index}
                        className="flex items-start gap-2 md:gap-3"
                      >
                        <div
                          className={`w-2 h-2 md:w-3 md:h-3 ${statusColor} rounded-full mt-1 flex-shrink-0`}
                        ></div>
                        <div className="flex-1 min-w-0">
                          <div
                            className={`${textColor} text-xs md:text-sm font-medium leading-tight`}
                          >
                            {item.time
                              ? `${formatTimelineDate(item.time)} - `
                              : ""}
                            {item.title}
                          </div>
                          <div className="text-gray-400 text-xs mt-1 leading-tight">
                            {item.description}
                          </div>
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>

            {/* KYC Information Collapsible Button */}
            <div className="mb-3 md:mb-4">
              <Button
                variant="outline"
                className="w-full border-red-500 bg-red-50 text-red-700 hover:bg-red-100 hover:border-red-600 flex items-center justify-between shadow-sm h-auto py-2 md:py-3"
                onClick={() => setShowKycInfo(!showKycInfo)}
              >
                <span className="font-semibold text-xs md:text-sm leading-tight">
                  ⚠️ INFORMAÇÕES IMPORTANTES DO KYC
                </span>
                <ChevronDown
                  className={`w-3 h-3 md:w-4 md:h-4 transition-transform ${showKycInfo ? "rotate-180" : ""}`}
                />
              </Button>

              {showKycInfo && (
                <div className="bg-red-50 border-l-4 border-red-500 p-3 md:p-4 rounded-b mt-1">
                  <div className="space-y-1 md:space-y-2 text-red-800 text-xs">
                    <div>
                      • <strong>Tempo médio de aprovação:</strong> 48h úteis
                    </div>
                    <div>
                      • <strong>Horário de análise:</strong> Aprovação e Análise
                      do KYC é feito pela liquidante apenas em horário comercial
                      das 08h às 17h
                    </div>
                    <div>
                      • <strong>Reenvio de documentos:</strong> Em caso de
                      documentos ou selfie reprovadas, a liquidante poderá pedir
                      novas imagens
                    </div>
                    <div>
                      • <strong>Responsabilidade:</strong> Não é a BetConta que
                      é responsável pela aprovação ou reprovação de contas e
                      tempo de aprovação
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Status Summary */}
            {selectedAccountForKyc?.status === "approved" && (
              <div className="p-4 bg-green-900 border border-green-700 rounded-lg mb-4">
                <div className="text-green-400 font-semibold text-sm md:text-base">
                  ✅ Conta Aprovada
                </div>
                <div className="text-green-300 text-xs md:text-sm mt-1">
                  Sua conta foi aprovada e está ativa para uso
                </div>
              </div>
            )}
            {selectedAccountForKyc?.status === "rejected" && (
              <div className="p-4 bg-red-900 border border-red-700 rounded-lg mb-4">
                <div className="text-red-400 font-semibold text-sm md:text-base">
                  ❌ Conta Reprovada
                </div>
                <div className="text-red-300 text-xs md:text-sm mt-1">
                  Entre em contato com o suporte para mais informações
                </div>
              </div>
            )}

            <div className="flex justify-center pt-2 md:pt-4">
              <Button
                variant="outline"
                className="border-gray-600 text-gray-300 hover:bg-gray-700 px-6 md:px-8 py-2"
                onClick={() => setShowKycStatus(false)}
              >
                Fechar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      <CreateChildAccountModal
        open={showCreateChildAccount}
        onOpenChange={setShowCreateChildAccount}
      />
      <AffiliateRequestModal
        open={showAffiliateRequest}
        onOpenChange={setShowAffiliateRequest}
      />
      {/* QR Code Request Modal */}
      <Dialog open={showQrCodeRequest} onOpenChange={setShowQrCodeRequest}>
        <DialogContent className="w-[95vw] max-w-md bg-gray-800 border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-white text-lg">
              Liberar QR Code
            </DialogTitle>
          </DialogHeader>

          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const formData = new FormData(e.target as HTMLFormElement);
              
              try {
                const response = await fetch('/api/qr-code-requests', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    isBettingHouse: formData.get('isBettingHouse'),
                    isChinese: formData.get('isChinese'),
                    houseName: formData.get('houseName'),
                    qrCode: formData.get('qrCode'),
                  }),
                });

                if (response.ok) {
                  toast({
                    title: "Pedido recebido com sucesso",
                    description:
                      "Recebemos seu pedido e será analisado. A casa será adicionada na lista de casas que aceitam a Cartos.",
                    variant: "default",
                  });
                  setShowQrCodeRequest(false);
                } else {
                  throw new Error('Failed to submit request');
                }
              } catch (error) {
                toast({
                  title: "Erro ao enviar pedido",
                  description: "Tente novamente mais tarde.",
                  variant: "destructive",
                });
              }
            }}
            className="space-y-4 mt-4"
          >
            {/* É para casa de aposta? */}
            <div className="space-y-2">
              <Label className="text-white text-sm">
                O QR code é para uma casa de aposta?
              </Label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-white text-sm">
                  <input
                    type="radio"
                    name="isBettingHouse"
                    value="sim"
                    required
                    className="text-blue-600"
                  />
                  Sim
                </label>
                <label className="flex items-center gap-2 text-white text-sm">
                  <input
                    type="radio"
                    name="isBettingHouse"
                    value="nao"
                    required
                    className="text-blue-600"
                  />
                  Não
                </label>
              </div>
            </div>

            {/* É chinesa? */}
            <div className="space-y-2">
              <Label className="text-white text-sm">
                A casa de aposta é chinesa?
              </Label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-white text-sm">
                  <input
                    type="radio"
                    name="isChinese"
                    value="sim"
                    required
                    className="text-blue-600"
                  />
                  Sim
                </label>
                <label className="flex items-center gap-2 text-white text-sm">
                  <input
                    type="radio"
                    name="isChinese"
                    value="nao"
                    required
                    className="text-blue-600"
                  />
                  Não
                </label>
              </div>
            </div>

            {/* Nome da casa */}
            <div className="space-y-2">
              <Label htmlFor="houseName" className="text-white text-sm">
                Qual nome da casa de aposta?
              </Label>
              <Input
                id="houseName"
                name="houseName"
                placeholder="Ex: Bet365, Betano, etc..."
                required
                className="bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500"
              />
            </div>

            {/* QR Code */}
            <div className="space-y-2">
              <Label htmlFor="qrCode" className="text-white text-sm">
                Envie o QR Code para analisarmos
              </Label>
              <Textarea
                id="qrCode"
                name="qrCode"
                placeholder="Cole aqui o código QR..."
                required
                rows={4}
                className="bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500 resize-none"
              />
              <p className="text-xs text-gray-400">
                Cole o código QR completo que você recebeu da casa de apostas
              </p>
            </div>

            {/* Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-700"
                onClick={() => setShowQrCodeRequest(false)}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
              >
                <Send className="w-4 h-4 mr-2" />
                Enviar
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
      {/* Rejected Houses Modal */}
      <Dialog open={showRejectedHouses} onOpenChange={setShowRejectedHouses}>
        <DialogContent className="w-[95vw] max-w-md bg-gray-800 border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-white text-[14px] text-center">
              Casas que{" "}
              <span className="text-red-500 font-bold">NÃO PAGAM</span> saque
              para a Cartos
            </DialogTitle>
          </DialogHeader>

          <div className="mt-4">
            <div className="space-y-2">
              {["Bet365", "Cassino Pix", "Bet7k", "MC Games"].map(
                (house, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 p-2 bg-gray-900 rounded border border-red-500/20"
                  >
                    <div className="w-1.5 h-1.5 bg-red-500 rounded-full flex-shrink-0"></div>
                    <span className="text-white text-sm font-medium">
                      {house}
                    </span>
                    <div className="ml-auto">
                      <span className="text-red-500 text-lg">⚠️</span>
                    </div>
                  </div>
                ),
              )}
            </div>

            <div className="mt-4 p-3 bg-red-900/20 border border-red-500/30 rounded">
              <div className="flex items-start gap-2">
                <span className="text-red-500 text-base flex-shrink-0">⚠️</span>
                <div>
                  <p className="text-red-400 font-semibold text-xs">Atenção!</p>
                  <p className="text-red-300 text-xs mt-0.5">
                    Essas casas não processam saques para contas da Cartos.
                    Evite fazer depósitos nessas plataformas.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-center pt-3">
              <Button
                variant="outline"
                size="sm"
                className="border-gray-600 text-gray-300 hover:bg-gray-700 px-6"
                onClick={() => setShowRejectedHouses(false)}
              >
                Fechar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      {/* Alert Popup */}
      <Dialog open={!!activeAlert} onOpenChange={(open) => !open && setActiveAlert(null)}>
        <DialogContent className="bg-gray-800 border-gray-700 w-[95vw] max-w-md mx-auto p-4 rounded-lg">
          <DialogHeader className="space-y-3">
            <div className="flex items-center justify-center">
              <span className="text-2xl">
                {activeAlert?.type === "error" ? "❌" : 
                 activeAlert?.type === "warning" ? "⚠️" : 
                 activeAlert?.type === "success" ? "✅" : "ℹ️"}
              </span>
            </div>
            <DialogTitle className="text-white text-center font-semibold">
              {activeAlert?.title}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <p className="text-gray-300 text-sm text-center leading-relaxed">
              {activeAlert?.message}
            </p>
            
            <div className="p-3 bg-blue-900/20 border border-blue-500/30 rounded-lg">
              <div className="flex items-center gap-2">
                <span className="text-blue-400 text-sm">ℹ️</span>
                <p className="text-blue-300 text-xs">
                  <span className="font-semibold">Sistema:</span> Mensagem da administração
                </p>
              </div>
            </div>
          </div>
          
          <div className="pt-2">
            <Button
              className="w-full bg-blue-600 hover:bg-blue-700 py-3 font-medium"
              onClick={() => dismissAlertPermanently(activeAlert?.id)}
            >
              Não ver essa mensagem novamente
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      {/* Telegram Floating Button */}
      {showTelegramButton && (
        <div className="fixed bottom-6 right-3 z-50">
          <div className="relative">
            {/* Close Button */}
            <button
              onClick={() => {
                setShowTelegramButton(false);
                sessionStorage.setItem('telegramButtonDismissed', 'true');
              }}
              className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs transition-all duration-200 hover:scale-110 z-10"
              title="Fechar"
            >
              <X className="w-3 h-3" />
            </button>
            
            {/* Telegram Button with Animation */}
            <button
              onClick={() => window.open('https://t.me/freebetprobrasil/382448', '_blank')}
              className="bg-blue-500 hover:bg-blue-600 text-white rounded-full p-4 shadow-xl transition-all duration-300 hover:scale-110 flex items-center justify-center animate-bounce"
              title="Fale conosco no Telegram"
              style={{
                animationDuration: '2s',
                animationIterationCount: 'infinite'
              }}
            >
              <svg
                className="w-6 h-6"
                fill="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
