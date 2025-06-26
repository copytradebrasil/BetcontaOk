import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Shield,
  TrendingUp,
  PiggyBank,
  Zap,
  Gift,
  BarChart3,
  DollarSign,
} from "lucide-react";
import LoginModal from "@/components/modals/LoginModal";
import RegisterModal from "@/components/modals/RegisterModal";
import ForgotPasswordModal from "@/components/modals/ForgotPasswordModal";

import cie_uma_logo_com_fundo_PNG_com_nome_BetConta__algo_direcionado_pro_esportivo_e_tecnologia__porque___uma_fintech__por_m_o_nome_BetConta_deve_ficar_tudo_junto__1_ from "@assets/cie uma logo com fundo PNG com nome BetConta, algo direcionado pro esportivo e tecnologia, porque é uma fintech, porém o nome BetConta deve ficar tudo junto (1).png";

import ChatGPT_Image_19_de_jun__de_2025__14_09_56 from "@assets/ChatGPT Image 19 de jun. de 2025, 14_09_56.png";

import BetContaLogo from "@assets/Design sem nome (9)_1750366554195.png";

export default function Landing() {
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <img src={BetContaLogo} alt="BetConta" className="h-10 ml-[0px] mr-[0px] pl-[0px] pr-[0px] pt-[5px] pb-[5px]" />
            </div>
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                onClick={() => setShowLogin(true)}
                className="text-gray-600 hover:text-gray-900 bg-[#ffffff]"
              >
                Entrar
              </Button>
              <Button
                onClick={() => setShowRegister(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Cadastrar
              </Button>
            </div>
          </div>
        </div>
      </nav>
      {/* Hero Section */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 text-center mt-[-42px] mb-[-42px] pt-[0px] pb-[0px]">
          <div className="inline-block bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-sm font-semibold mb-4">
            ✨ Nova liquidante, preços justos
          </div>
          <h1 className="font-bold text-gray-900 ml-[-7px] mr-[-7px] text-[28px] mt-[10px] mb-[10px]">
            Escale suas Operações Esportivas com{" "}
            <span className="text-blue-600">Contas em Nossa Fintech</span>
            <br />
            <span className="text-2xl text-gray-700">
              de Fácil Gerenciamento
            </span>
          </h1>
          <p className="text-gray-600 max-w-3xl mx-auto text-center text-[14px] px-4 sm:px-6 mt-[30px] mb-[30px]">
            Chegou uma nova opção no mercado! Liquidante Nova oferece contas
            filhas com preços acessíveis, sem as taxas abusivas do mercado, e
            com foco total em Surebet, Delay e Promoções Esportivas.
          </p>

          <div className="flex flex-wrap justify-center gap-3 text-sm font-medium mt-[50px] mb-[50px]">
            <span className="bg-green-100 text-green-800 px-4 py-2 rounded-full">
              💰 Preço acessível
            </span>
            <span className="bg-blue-100 text-blue-700 px-4 py-2 rounded-full">
              ⚡ KYC Simples
            </span>
            <span className="bg-purple-100 text-purple-700 px-4 py-2 rounded-full">
              🏦 Nova liquidante
            </span>
            <span className="bg-orange-100 text-orange-700 px-4 py-2 rounded-full">
              📱 Sem burocracia
            </span>
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
              className="border-blue-600 hover:bg-blue-50 px-8 py-3 text-[#ffffff]"
            >
              Já tenho conta
            </Button>
          </div>
        </div>
      </section>
      {/* Betting Operations Section */}
      <section className="py-20 bg-gray-50 pt-[40px] pb-[40px]">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-gray-900 text-[22px] pt-[0px] pb-[0px] mt-[10px] mb-[10px] font-bold">
              Desenvolvido para Apostadores que Precisam de Controle Total do
              seu Dinheiro
            </h2>
            <p className="text-lg text-gray-600 mb-6">
              Controle todas as Contas do seu Portfólio em um único aplicativo.
            </p>
            <div className="bg-blue-50 border-l-4 border-blue-400 p-6 max-w-4xl mx-auto mb-8">
              <p className="text-blue-800 font-medium leading-relaxed text-center">
                💡{" "}
                <strong>
                  Entendemos que a nova regulamentação trouxe barreiras para
                  apostadores profissionais.
                </strong>
                Com nossa ferramenta fintech, você gerencia sua conta Master e
                todo seu portfólio de contas em um só aplicativo. Controle
                total, visibilidade completa e gestão centralizada de todas suas
                operações financeiras.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            {[
              {
                icon: <DollarSign className="h-12 w-12 text-green-600" />,
                title: "Gestão Centralizada",
                subtitle: "Conta Master + Portfólio",
                description:
                  "Gerencie sua conta principal e todas as contas do seu portfólio em uma única plataforma. Controle total sobre suas operações financeiras.",
              },
              {
                icon: <Zap className="h-12 w-12 text-blue-600" />,
                title: "Adaptado à Regulação",
                subtitle: "Contorna Barreiras",
                description:
                  "Nossa solução foi desenvolvida pensando nas novas regulamentações, oferecendo alternativas inteligentes para apostadores profissionais.",
              },
              {
                icon: <Shield className="h-12 w-12 text-purple-600" />,
                title: "Controle de Terceiros",
                subtitle: "Segurança e Transparência",
                description:
                  "Use contas de terceiros com total controle e visibilidade. Monitoramento em tempo real de todas suas movimentações financeiras.",
              },
            ].map((operation, index) => (
              <Card
                key={index}
                className="bg-white border-gray-200 hover:border-blue-300 transition-all duration-300 hover:shadow-lg"
              >
                <CardHeader className="text-center pb-4">
                  <div className="mx-auto mb-4 p-3 bg-blue-50 rounded-full w-fit">
                    {operation.icon}
                  </div>
                  <CardTitle className="text-xl font-bold text-gray-900 mb-2">
                    {operation.title}
                  </CardTitle>
                  <p className="text-blue-600 font-medium text-sm">
                    {operation.subtitle}
                  </p>
                </CardHeader>
                <CardContent className="text-center">
                  <p className="text-gray-600 leading-relaxed">
                    {operation.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
      {/* Features */}
      <section className="py-20 bg-white pt-[40px] pb-[40px]">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="font-bold text-gray-900 mb-4 text-[26px]">
              Funcionalidades da Plataforma Fintech
            </h2>
            <p className="text-gray-600 mb-6 text-[16px]">
              Controle total sobre suas operações financeiras em um só lugar
            </p>
            <div className="bg-blue-50 border-l-4 border-blue-400 p-4 max-w-3xl mx-auto mb-8">
              <p className="text-blue-800 font-medium">
                🏦 <strong>Tudo integrado:</strong> Conta Master, contas de
                terceiros, PIX, transferências e relatórios unificados para
                máxima eficiência operacional.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
            {[
              {
                icon: <Shield className="h-12 w-12 text-blue-600" />,
                title: "Dashboard Unificado",
                subtitle: "Visão Completa do Portfólio",
                description:
                  "Monitore todas suas contas, saldos e movimentações em tempo real. Controle centralizado de sua conta Master e contas de terceiros.",
                features: [
                  "Saldos em tempo real",
                  "Histórico unificado",
                  "Alerts automáticos",
                ],
              },
              {
                icon: <PiggyBank className="h-12 w-12 text-green-600" />,
                title: "Gestão Multi-Contas",
                subtitle: "Operação Simplificada",
                description:
                  "Crie e gerencie múltiplas contas filhas com facilidade. Ideal para diferentes estratégias de apostas e segmentação de capital.",
                features: [
                  "Criação rápida",
                  "KYC Simples",
                  "Limites personalizados",
                ],
              },

              {
                icon: <Zap className="h-12 w-12 text-orange-600" />,
                title: "PIX Inteligente",
                subtitle: "Transferências Otimizadas",
                description:
                  "Sistema PIX otimizado para apostadores com transferências instantâneas, programadas e automáticas entre suas contas.",
                features: [
                  "PIX instantâneo",
                  "Transferências Limitadas para Bets",
                ],
              },
            ].map((feature, index) => (
              <Card
                key={index}
                className="bg-white border-gray-200 hover:border-blue-300 transition-all duration-300 hover:shadow-lg"
              >
                <CardHeader className="pb-4">
                  <div className="flex items-start space-x-4">
                    <div className="p-3 bg-blue-50 rounded-full">
                      {feature.icon}
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-xl font-bold text-gray-900 mb-1">
                        {feature.title}
                      </CardTitle>
                      <p className="text-blue-600 font-medium text-sm mb-3">
                        {feature.subtitle}
                      </p>
                      <p className="text-gray-600 leading-relaxed text-sm">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-2">
                    {feature.features.map((feat, idx) => (
                      <div
                        key={idx}
                        className="flex items-center text-sm text-gray-600"
                      >
                        <div className="w-2 h-2 bg-blue-400 rounded-full mr-3"></div>
                        {feat}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
      {/* CTA */}
      <section className="py-20 bg-blue-600">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="font-bold text-white mb-4 text-[26px]">
            Chegou a Hora de Profissionalizar suas Operações
          </h2>
          <p className="text-blue-100 mb-6 text-[16px]">
            Pare de perder dinheiro com taxas altas e processos lentos. Conheça
            a nova opção do mercado
          </p>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 mb-8 max-w-2xl mx-auto">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-green-300 text-xl font-bold">
                  Acessível
                </div>
                <div className="text-sm text-green-200">Cabe no bolso</div>
              </div>
              <div>
                <div className="text-blue-300 text-xl font-bold">Rápido</div>
                <div className="text-sm text-blue-200">Sem burocracia</div>
              </div>
              <div>
                <div className="text-purple-300 text-xl font-bold">Nova</div>
                <div className="text-sm text-purple-200">Nova liquidante</div>
              </div>
            </div>
          </div>
          <Button
            size="lg"
            onClick={() => setShowRegister(true)}
            className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-3 text-lg font-semibold"
          >
            Conhecer Agora
          </Button>
        </div>
      </section>
      {/* Footer */}
      <footer className="bg-black py-12">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <div className="flex justify-center mb-4">
            <img src={BetContaLogo} alt="BetConta" className="h-10" />
          </div>
          <p className="text-gray-400 mb-4">
            O banco digital para apostadores profissionais
          </p>
          <p className="text-gray-500 text-sm">
            © 2024 Nova. Todos os direitos reservados.
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
