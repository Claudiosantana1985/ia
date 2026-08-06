import { createFileRoute, Link } from "@tanstack/react-router";
import { Activity, BatteryCharging, Camera, Cpu, Gauge, MessageCircle, Wrench, Car, Zap, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import logo from "@/assets/autoia-logo.png";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "AutoIA Pro — Diagnóstico Automotivo Inteligente" },
      {
        name: "description",
        content:
          "IA especializada em diagnóstico automotivo, elétrica, injeção eletrônica e códigos de falha. Feito para mecânicos e entusiastas.",
      },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
      {/* HEADER */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logo} alt="AutoIA Pro" className="h-8 w-8" />
            <span className="text-xl font-bold tracking-wider text-amber-500">AutoIA Pro</span>
          </div>
          <Button asChild size="sm" className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold">
            <Link to="/auth">Acessar Plataforma</Link>
          </Button>
        </div>
      </header>

      {/* HERO SECTION */}
      <main>
        <section className="py-20 px-6 max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 text-amber-400 px-4 py-1.5 rounded-full text-xs font-semibold mb-6">
            <Zap className="h-4 w-4" /> INTELIGÊNCIA ARTIFICIAL AUTOMOTIVA
          </div>
          <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight max-w-4xl mx-auto leading-tight mb-6">
            Diagnóstico preciso do seu veículo em segundos — <span className="text-amber-500">antes de trocar a primeira peça.</span>
          </h1>
          <p className="text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto mb-10">
            O assistente virtual que analisa códigos DTC, sintomas e barulhos para entregar o passo a passo exato de testes, reparos e peças necessárias.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button asChild size="lg" className="w-full sm:w-auto bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-lg px-8 py-6 rounded-xl shadow-lg shadow-amber-500/20">
              <Link to="/auth">🚀 Testar o AutoIA Pro Agora</Link>
            </Button>
          </div>
          <p className="text-xs text-slate-500 mt-4">✓ Acesso imediato no celular e PC</p>
        </section>

        {/* DUAS SOLUÇÕES */}
        <section className="py-16 bg-slate-900 border-y border-slate-800">
          <div className="max-w-6xl mx-auto px-6">
            <h2 className="text-3xl font-bold text-center text-white mb-12">Projetado para quem vive a mecânica na prática</h2>
            <div className="grid md:grid-cols-2 gap-8">
              
              {/* CARD MECÂNICOS */}
              <div className="bg-slate-950 p-8 rounded-2xl border border-slate-800 relative hover:border-amber-500/50 transition">
                <div className="flex items-center gap-2 text-amber-500 text-sm font-bold uppercase tracking-wider mb-2">
                  <Wrench className="h-4 w-4" /> Para o Mecânico & Dono de Oficina
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">Aumente a rotatividade do seu pátio</h3>
                <ul className="space-y-3 text-slate-300">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                    <span><strong>Fim do Chutômetro:</strong> Receba a ordem lógica de testes do componente mais simples ao mais complexo.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                    <span><strong>Análise Avançada de DTC:</strong> Interprete códigos de falha com contexto real de defeitos crônicos.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                    <span><strong>Economia de Tempo:</strong> Resolva falhas elétricas e mecânicas misteriosas no mesmo dia.</span>
                  </li>
                </ul>
              </div>

              {/* CARD AMADORES */}
              <div className="bg-slate-950 p-8 rounded-2xl border border-slate-800 relative hover:border-amber-500/50 transition">
                <div className="flex items-center gap-2 text-amber-500 text-sm font-bold uppercase tracking-wider mb-2">
                  <Car className="h-4 w-4" /> Para o Entusiasta & Hobbysta
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">Tenha total controle sobre o seu carro</h3>
                <ul className="space-y-3 text-slate-300">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                    <span><strong>Zero Enrola:</strong> Saiba exatamente qual é o defeito antes de pedir orçamentos na oficina.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                    <span><strong>Guia de Peças Exato:</strong> Identifique o código e as especificações corretas para o seu projeto.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                    <span><strong>Aprendizado Prático:</strong> Entenda causas de barulhos e luzes no painel de forma simples.</span>
                  </li>
                </ul>
              </div>

            </div>
          </div>
        </section>

        {/* RECURSOS */}
        <section className="py-16 max-w-6xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center text-white mb-12">Recursos completos do AutoIA Pro</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <div className="bg-slate-900 p-6 rounded-xl border border-slate-800">
              <Activity className="h-6 w-6 text-amber-500 mb-4" />
              <h3 className="font-bold text-white text-lg">Diagnóstico Guiado</h3>
              <p className="text-slate-400 text-sm mt-2">Roteiro de testes organizados por probabilidade antes de trocar peças.</p>
            </div>
            <div className="bg-slate-900 p-6 rounded-xl border border-slate-800">
              <Cpu className="h-6 w-6 text-amber-500 mb-4" />
              <h3 className="font-bold text-white text-lg">Injeção & DTCs</h3>
              <p className="text-slate-400 text-sm mt-2">Interpretação detalhada de códigos de falha, live data e sensores da ECU.</p>
            </div>
            <div className="bg-slate-900 p-6 rounded-xl border border-slate-800">
              <BatteryCharging className="h-6 w-6 text-amber-500 mb-4" />
              <h3 className="font-bold text-white text-lg">Elétrica Automotiva</h3>
              <p className="text-slate-400 text-sm mt-2">Análise de queda de tensão, massa, fuga de corrente e redes CAN.</p>
            </div>
            <div className="bg-slate-900 p-6 rounded-xl border border-slate-800">
              <Camera className="h-6 w-6 text-amber-500 mb-4" />
              <h3 className="font-bold text-white text-lg">Análise Multimídia</h3>
              <p className="text-slate-400 text-sm mt-2">Envie foto da tela do scanner, osciloscópio ou peça para diagnóstico instantâneo.</p>
            </div>
            <div className="bg-slate-900 p-6 rounded-xl border border-slate-800">
              <Gauge className="h-6 w-6 text-amber-500 mb-4" />
              <h3 className="font-bold text-white text-lg">Valores de Referência</h3>
              <p className="text-slate-400 text-sm mt-2">Tabelas de torques, pressões e faixas de medição técnica.</p>
            </div>
            <div className="bg-slate-900 p-6 rounded-xl border border-slate-800">
              <MessageCircle className="h-6 w-6 text-amber-500 mb-4" />
              <h3 className="font-bold text-white text-lg">Histórico por Veículo</h3>
              <p className="text-slate-400 text-sm mt-2">Mantenha todos os diagnósticos salvos para consultar quando quiser.</p>
            </div>
          </div>
        </section>

        {/* CTA FINAL */}
        <section className="border-t border-slate-800 bg-slate-900 py-16 text-center">
          <div className="max-w-3xl mx-auto px-6">
            <h2 className="text-3xl font-bold text-white">Pronto para acelerar seus diagnósticos?</h2>
            <p className="mt-4 text-slate-400">
              Experimente agora mesmo com um caso real da sua oficina ou da sua garagem.
            </p>
            <Button asChild size="lg" className="mt-8 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-lg px-8 py-6 rounded-xl">
              <Link to="/auth">Criar Conta no AutoIA Pro</Link>
            </Button>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-800 py-8 text-center text-xs text-slate-500">
        AutoIA Pro — suporte técnico automotivo assistido por IA.
      </footer>
    </div>
  );
}