import React, { useState } from 'react'
import { CheckoutModal } from "./CheckoutModal"; // certifique-se de que o CheckoutModal está na mesma pasta

export function UpgradeButton() {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<{ id: string; name: string; price: string } | null>(null)

  // ⚠️ Cole aqui os UUIDs reais da sua tabela 'plans' no Supabase
  const PLANS = [
    {
      id: '1510a441-d454-499d-9c24-d050644fc51a',
      name: 'Mensal',
      price: '29,90',
      description: 'Acesso total mensal',
    },
    {
      id: '9438832c-974d-4775-88f1-99a5e2b2f5a1',
      name: 'Anual',
      price: '299,00',
      description: 'Economize garantindo 12 meses',
    },
  ]

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-lg shadow hover:opacity-90 transition"
      >
        ⚡ Planos / Assinar
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-lg bg-white rounded-2xl p-6 shadow-2xl">
            <button
              onClick={() => {
                setIsOpen(false)
                setSelectedPlan(null)
              }}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 font-bold text-xl"
            >
              ✕
            </button>

            {!selectedPlan ? (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">
                  Escolha seu Plano
                </h2>
                <p className="text-gray-500 text-center text-sm mb-6">
                  Desbloqueie o uso da IA sem interrupções
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {PLANS.map((plan) => (
                    <div
                      key={plan.id}
                      className="border rounded-xl p-4 flex flex-col justify-between bg-gray-50 hover:border-blue-500 transition"
                    >
                      <div>
                        <h3 className="font-bold text-gray-800">{plan.name}</h3>
                        <p className="text-xs text-gray-500 mt-1">{plan.description}</p>
                        <p className="text-2xl font-black text-gray-900 mt-3">
                          R$ {plan.price}
                        </p>
                      </div>

                      <button
                        onClick={() => setSelectedPlan(plan)}
                        className="mt-4 w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-lg transition"
                      >
                        Selecionar
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div>
                <button
                  onClick={() => setSelectedPlan(null)}
                  className="text-xs text-blue-600 font-semibold hover:underline mb-2 inline-block"
                >
                  ← Voltar para a escolha de planos
                </button>

                <CheckoutModal
                  planId={selectedPlan.id}
                  planName={selectedPlan.name}
                  price={selectedPlan.price}
                />
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}