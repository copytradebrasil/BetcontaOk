import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, TrendingUp, PiggyBank, Zap, Gift, BarChart3 } from "lucide-react";
import LoginModal from "@/components/modals/LoginModal";
import RegisterModal from "@/components/modals/RegisterModal";
import ForgotPasswordModal from "@/components/modals/ForgotPasswordModal";

export default function Landing() {
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="border-b border-gray-200 bg-white">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <img 
              src="/assets/cartos-logo.png" 
              alt="Cartos" 
              className="h-8"
            />
            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                onClick={() => setShowLogin(true)}
                className="text-gray-600 hover:text-blue-600"
              >
                Entrar
              </Button>
              <Button 
                onClick={() => setShowRegister(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Criar Conta
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Banco Digital para{" "}
            <span className="text-blue-600">Apostas Esportivas</span>
          </h1>
          <p className="text-xl text-gray-600 mb-6 max-w-3xl mx-auto">
            O primeiro banco criado especialmente para operações de apostas esportivas profissionais.
            Gerencie Surebet, Delay e Promoções com total segurança e eficiência.
          </p>
          
          <div className="flex flex-wrap justify-center gap-4 text-sm font-medium mb-8">
            <span className="bg-blue-100 text-blue-700 px-4 py-2 rounded-full">✓ Surebet Automático</span>
            <span className="bg-blue-100 text-blue-700 px-4 py-2 rounded-full">✓ Gestão de Delay</span>
            <span className="bg-blue-100 text-blue-700 px-4 py-2 rounded-full">✓ Caça Promoções</span>
            <span className="bg-blue-100 text-blue-700 px-4 py-2 rounded-full">✓ Multi-Contas</span>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg"
              onClick={() => setShowRegister(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3"
            >
              Começar Agora
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              onClick={() => setShowLogin(true)}
              className="border-blue-600 text-blue-600 hover:bg-blue-50 px-8 py-3"
            >
              Já tenho conta
            </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Recursos Principais
            </h2>
            <p className="text-lg text-gray-600">
              Ferramentas desenvolvidas especialmente para apostadores
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: <Shield className="h-8 w-8 text-blue-600" />,
                title: "Segurança Total",
                description: "Proteção bancária com criptografia avançada"
              },
              {
                icon: <TrendingUp className="h-8 w-8 text-blue-600" />,
                title: "Analytics",
                description: "Relatórios detalhados de performance"
              },
              {
                icon: <PiggyBank className="h-8 w-8 text-blue-600" />,
                title: "Gestão de Bankroll",
                description: "Controle inteligente de limites"
              },
              {
                icon: <Zap className="h-8 w-8 text-blue-600" />,
                title: "PIX Instantâneo",
                description: "Transferências em tempo real"
              }
            ].map((feature, index) => (
              <Card key={index} className="border border-gray-200 hover:border-blue-300 transition-colors">
                <CardHeader className="text-center">
                  <div className="mx-auto mb-4">
                    {feature.icon}
                  </div>
                  <CardTitle className="text-lg text-gray-900">
                    {feature.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <p className="text-gray-600 text-sm">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-blue-600 mb-2">10M+</div>
              <div className="text-gray-600">Transações</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-blue-600 mb-2">250K+</div>
              <div className="text-gray-600">Usuários</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-blue-600 mb-2">99.9%</div>
              <div className="text-gray-600">Uptime</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-blue-600">
        <div className="max-w-4xl mx-auto text-center px-4">
          <h2 className="text-3xl font-bold text-white mb-6">
            Pronto para começar?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Crie sua conta gratuita e transforme sua gestão financeira
          </p>
          <Button 
            size="lg"
            onClick={() => setShowRegister(true)}
            className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-3"
          >
            Criar Conta Gratuita
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <div className="flex justify-center mb-4">
            <img 
              src="/assets/cartos-logo.png" 
              alt="Cartos" 
              className="h-8"
            />
          </div>
          <p className="text-gray-400 text-sm">
            © 2024 Cartos. Todos os direitos reservados.
          </p>
        </div>
      </footer>

      {/* Modals */}
      <LoginModal 
        open={showLogin} 
        onOpenChange={setShowLogin}
        onShowRegister={() => {
          setShowLogin(false);
          setShowRegister(true);
        }}
        onShowForgotPassword={() => {
          setShowLogin(false);
          setShowForgotPassword(true);
        }}
      />
      
      <RegisterModal 
        open={showRegister} 
        onOpenChange={setShowRegister}
        onShowLogin={() => {
          setShowRegister(false);
          setShowLogin(true);
        }}
      />
      
      <ForgotPasswordModal 
        open={showForgotPassword} 
        onOpenChange={setShowForgotPassword}
        onShowLogin={() => {
          setShowForgotPassword(false);
          setShowLogin(true);
        }}
      />
    </div>
  );
}