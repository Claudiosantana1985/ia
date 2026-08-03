import { createFileRoute, Link } from "@tanstack/react-router";
import { Activity, BatteryCharging, Camera, Cpu, Gauge, MessageCircle } from "lucide-react";
import { UpgradeButton } from "@/components/UpgradeButton";
import { Button } from "@/components/ui/button";
import logo from "@/assets/autoia-logo.png";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "AutoIA Pro — Consultor automotivo com Inteligência Artificial" },
      {
        name: "description",
        content:
          "IA especializada em diagnóstico automotivo, elétrica, injeção eletrônica e códigos de falha. Envie fotos, áudios e PDFs e receba um roteiro técnico passo a passo.",
      },
      { property: "og:title", content: "AutoIA Pro — Consultor automotivo com Inteligência Artificial" },
      {
        property: "og:description",
        content:
          "IA especializada em diagnóstico automotivo, elétrica, injeção eletrônica e códigos de falha. Envie fotos, áudios e PDFs e receba um roteiro técnico passo a passo.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

const FEATURES = [
  {
    icon: Activity,
    title: "Diagnóstico guiado",
    text: "Roteiro de testes por probabilidade, antes de trocar qualquer peça.",
  },
  {
    icon: Cpu,
    title: "Injeção e códigos de falha",
    text: "Interpretação de DTCs, live data, sensores e estratégias da ECU.",
  },
  {
    icon: BatteryCharging,
    title: "Elétrica automotiva",
    text: "Queda de tensão, massa, fuga de corrente, CAN e esquemas explicados.",
  },
  {
    icon: Camera,
    title: "Envie foto, áudio e PDF",
    text: "Mostre a tela do scanner, o osciloscópio ou a peça e receba a leitura.",
  },
  {
    icon: Gauge,
    title: "Medições e valores",
    text: "Faixas de referência, torques e procedimentos com fonte técnica.",
  },
  {
    icon: MessageCircle,
    title: "Histórico por veículo",
    text: "Cada atendimento fica salvo na sua conta para retomar depois.",
  },
];

function Landing() { <UpgradeButton />
  return  (  
    <div className="min-h-screen bg-background">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <div className="flex items-center gap-3">
          <img src={logo} alt="AutoIA Pro" width={36} height={36} className="h-9 w-9" />
          <span className="font-display text-lg font-semibold">AutoIA Pro</span>
        </div>
        <Button asChild size="sm">
          <Link to="/auth">Entrar</Link>
        </Button>
      </header>

      <main>
        <section className="bg-hero-gradient">
          <div className="mx-auto max-w-4xl px-6 py-24 text-center">
            <span className="inline-flex items-center rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-primary">
              Consultor técnico automotivo por IA
            </span>
            <h1 className="mt-6 font-display text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
              Diagnóstico preciso antes de trocar a peça
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-base text-muted-foreground sm:text-lg">
              O AutoIA Pro entende sintomas, códigos de falha, esquemas elétricos e imagens do scanner —
              e devolve um plano de testes na ordem certa, com valores de referência.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Button asChild size="lg">
                <Link to="/auth">Começar agora</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/auth">Já tenho conta</Link>
              </Button>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 py-20">
          <h2 className="text-center font-display text-2xl font-semibold sm:text-3xl">
            Feito para quem vive dentro da oficina
          </h2>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feature) => (
              <article
                key={feature.title}
                className="rounded-2xl border border-border bg-card p-6 shadow-panel"
              >
                <feature.icon className="h-5 w-5 text-primary" />
                <h3 className="mt-4 text-base font-semibold">{feature.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{feature.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="border-t border-border">
          <div className="mx-auto max-w-3xl px-6 py-16 text-center">
            <h2 className="font-display text-2xl font-semibold">
              Teste com um caso real da sua bancada
            </h2>
            <p className="mt-3 text-sm text-muted-foreground">
              Descreva o veículo, o sintoma e o que já foi verificado. Em segundos você tem o próximo
              teste.
            </p>
            <Button asChild size="lg" className="mt-6">
              <Link to="/auth">Criar conta gratuita</Link>
            </Button>
          </div>
        </section>
      </main>

      <footer className="border-t border-border py-8 text-center text-xs text-muted-foreground">
        AutoIA Pro — suporte técnico automotivo assistido por IA.
      </footer>
    </div>
  );
}
