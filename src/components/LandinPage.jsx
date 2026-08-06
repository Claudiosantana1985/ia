import React from 'react';

export default function LandingPage({ onStartCheckout }) {
  const handleCheckout = () => {
    if (onStartCheckout) {
      onStartCheckout();
    } else {
      // Redireciona para a rota de checkout/registro do sistema
      window.location.href = '/checkout';
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">

      {/* NAVBAR */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-black tracking-wider text-amber-500">AUTO24</span>
            <span className="text-xs bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded font-bold">PRO</span>
          </div>
          <nav className="hidden md:flex gap-8 text-sm font-medium text-slate-300">
            <a href="#recursos" className="hover:text-amber-400 transition">Recursos</a>
            <a href="#oficinas" className="hover:text-amber-400 transition">Para Oficinas</a>
            <a href="#amadores" className="hover:text-amber-400 transition">Para Entusiastas</a>
            <a href="#planos" className="hover:text-amber-400 transition">Planos</a>
          </nav>
          <button 
            onClick={handleCheckout}
            className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2 rounded-lg text-sm transition">
            Acessar Plataforma
          </button>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 text-amber-400 px-4 py-1.5 rounded-full text-xs sm:text-sm font-semibold mb-6">
          ⚡ INTELIGÊNCIA ARTIFICIAL AUTOMOTIVA
        </div>
        <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight max-w-4xl mx-auto leading-tight mb-6">
          Diagnóstico preciso do seu veículo em segundos — <span className="text-amber-500">antes de trocar a primeira peça.</span>
        </h1>
        <p className="text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto mb-10">
          O assistente virtual que analisa códigos DTC, sintomas e barulhos para entregar o passo a passo exato de testes, reparos e especificações de peças.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <button 
            onClick={handleCheckout}
            className="w-full sm:w-auto bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-lg px-8 py-4 rounded-xl shadow-lg shadow-amber-500/20 transition transform hover:-translate-y-0.5">
            🚀 Testar o Auto24 Pro Agora
          </button>
        </div>
        <p className="text-xs text-slate-500 mt-4">✓ Teste sem risco • Acesso imediato no celular e PC</p>
      </section>

      {/* RECURSOS / SEGMENTAÇÃO */}
      <section id="recursos" className="py-16 bg-slate-900 border-y border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-white mb-12">Projetado para quem vive a mecânica na prática</h2>
          <div className="grid md:grid-cols-2 gap-8">
            
            {/* CARD MECÂNICOS */}
            <div id="oficinas" className="bg-slate-950 p-8 rounded-2xl border border-slate-800 relative hover:border-amber-500/50 transition">
              <div className="text-amber-500 text-sm font-bold uppercase tracking-wider mb-2">🛠️ Para o Mecânico & Dono de Oficina</div>
              <h3 className="text-2xl font-bold text-white mb-4">Aumente a rotatividade do seu pátio</h3>
              <ul className="space-y-3 text-slate-300">
                <li className="flex items-start gap-2">
                  <span className="text-amber-500 font-bold">✓</span> <strong>Fim do Chutômetro:</strong> Receba a ordem lógica de testes do componente mais simples ao mais complexo.
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-500 font-bold">✓</span> <strong>Análise Avançada de DTC:</strong> Interprete códigos de falha com contexto real de defeitos crônicos.
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-500 font-bold">✓</span> <strong>Economia de Tempo:</strong> Resolva falhas elétricas e mecânicas misteriosas no mesmo dia.
                </li>
              </ul>
            </div>

            {/* CARD AMADORES */}
            <div id="amadores" className="bg-slate-950 p-8 rounded-2xl border border-slate-800 relative hover:border-amber-500/50 transition">
              <div className="text-amber-500 text-sm font-bold uppercase tracking-wider mb-2">🏎️ Para o Entusiasta & Hobbysta</div>
              <h3 className="text-2xl font-bold text-white mb-4">Tenha total controle sobre o seu carro</h3>
              <ul className="space-y-3 text-slate-300">
                <li className="flex items-start gap-2">
                  <span className="text-amber-500 font-bold">✓</span> <strong>Zero Enrola:</strong> Saiba exatamente qual é o defeito antes de pedir orçamentos.
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-500 font-bold">✓</span> <strong>Guia de Peças Exato:</strong> Identifique o código e as especificações corretas para o seu projeto.
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-500 font-bold">✓</span> <strong>Aprendizado Prático:</strong> Entenda causas de barulhos, vibrações e luzes no painel de forma simples.
                </li>
              </ul>
            </div>

          </div>
        </div>
      </section>

      {/* COMO FUNCIONA */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl font-bold text-white mb-12">Como funciona em 3 passos simples</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="p-6 bg-slate-900 rounded-xl border border-slate-800">
            <div className="w-12 h-12 bg-amber-500/10 text-amber-500 font-black rounded-full flex items-center justify-center mx-auto mb-4 text-xl">1</div>
            <h4 className="text-xl font-bold text-white mb-2">Descreva o Problema</h4>
            <p className="text-slate-400 text-sm">Digite os sintomas, insira códigos de falha (DTC) ou relate barulhos específicos do veículo.</p>
          </div>
          <div className="p-6 bg-slate-900 rounded-xl border border-slate-800">
            <div className="w-12 h-12 bg-amber-500/10 text-amber-500 font-black rounded-full flex items-center justify-center mx-auto mb-4 text-xl">2</div>
            <h4 className="text-xl font-bold text-white mb-2">Análise da IA</h4>
            <p className="text-slate-400 text-sm">A plataforma cruza dados de manuais técnicos e histórico de falhas automotivas.</p>
          </div>
          <div className="p-6 bg-slate-900 rounded-xl border border-slate-800">
            <div className="w-12 h-12 bg-amber-500/10 text-amber-500 font-black rounded-full flex items-center justify-center mx-auto mb-4 text-xl">3</div>
            <h4 className="text-xl font-bold text-white mb-2">Receba a Solução</h4>
            <p className="text-slate-400 text-sm">Tenha em mãos o checklist de testes, diagnósticos prováveis e lista de peças.</p>
          </div>
        </div>
      </section>

      {/* PLANOS E CHECKOUT */}
      <section id="planos" className="py-16 bg-slate-900 border-t border-slate-800">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Invista na ferramenta que se paga no primeiro uso</h2>
          <p className="text-slate-400 mb-10">Economize tempo de bancada e evite a compra de peças desnecessárias.</p>
          
          <div className="bg-slate-950 p-8 rounded-2xl border-2 border-amber-500 relative shadow-2xl">
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-500 text-slate-950 font-bold text-xs uppercase px-3 py-1 rounded-full">OFERTA DE LANÇAMENTO</span>
            <h3 className="text-2xl font-bold text-white mt-2">Acesso Anual Ilimitado</h3>
            <div className="my-6">
              <span className="text-4xl font-black text-amber-500">12x de R$ 29,90</span>
              <span className="block text-xs text-slate-400 mt-1">ou R$ 297,00 à vista via Pix</span>
            </div>
            <ul className="text-left space-y-3 text-slate-300 text-sm mb-8">
              <li className="flex items-center gap-2">⚡ Diagnósticos Ilimitados com Inteligência Artificial</li>
              <li className="flex items-center gap-2">⚡ Leitura e Interpretação de Códigos DTC (OBD2)</li>
              <li className="flex items-center gap-2">⚡ Guia de Peças e Especificações Técnicas</li>
              <li className="flex items-center gap-2">⚡ Suporte Prioritário e Atualizações Contínuas</li>
            </ul>
            <button 
              onClick={handleCheckout}
              className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-lg py-4 rounded-xl transition">
              Garantir Meu Acesso Agora
            </button>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-8 border-t border-slate-800 text-center text-xs text-slate-500">
        <p>&copy; Auto24 Pro — Todos os direitos reservados.</p>
      </footer>

    </div>
  );
}