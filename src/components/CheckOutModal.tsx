import React, { useState, useEffect } from 'react'
import { supabase } from "@/integrations/supabase/client"

interface CheckoutModalProps {
  planId: string
  planName: string
  price: string
}

export function CheckoutModal({ planId, planName, price }: CheckoutModalProps) {
  const [loading, setLoading] = useState(false)
  const [pixData, setPixData] = useState<{
    qr_code: string
    qr_code_base64: string
  } | null>(null)
  const [copied, setCopied] = useState(false)

  // Função para gerar Cobrança PIX
  async function handleGeneratePix() {
    try {
      setLoading(true)
      const { data: { session } } = await supabase.auth.getSession()

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/create-checkout`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({
            plan_id: planId,
            payment_method: 'pix',
          }),
        }
      )

      const data = await response.json()
      if (!response.ok) throw new Error(data.error)

      setPixData({
        qr_code: data.qr_code,
        qr_code_base64: data.qr_code_base64,
      })
    } catch (err: any) {
      alert(`Erro ao gerar PIX: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  // Função para abrir Checkout Transparente / Cartão
  async function handleRedirectCheckout() {
    try {
      setLoading(true)
      const { data: { session } } = await supabase.auth.getSession()

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/create-checkout`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({
            plan_id: planId,
            payment_method: 'card',
          }),
        }
      )

      const data = await response.json()
      if (!response.ok) throw new Error(data.error)

      // Redireciona o usuário para a página segura do Mercado Pago
      window.location.href = data.init_point
    } catch (err: any) {
      alert(`Erro ao redirecionar para o checkout: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  // Copiar chave Pix
  function copyToClipboard() {
    if (pixData?.qr_code) {
      navigator.clipboard.writeText(pixData.qr_code)
      setCopied(true)
      setTimeout(() => setCopied(false), 3000)
    }
  }

  return (
    <div className="p-6 bg-white rounded-xl shadow-md border max-w-md mx-auto">
      <h3 className="text-xl font-bold mb-1">Assinar {planName}</h3>
      <p className="text-gray-600 mb-6">Valor: R$ {price}</p>

      {!pixData ? (
        <div className="flex flex-col gap-3">
          <button
            onClick={handleGeneratePix}
            disabled={loading}
            className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition"
          >
            {loading ? 'Gerando...' : 'Pagar com PIX (Aprovação Imediata)'}
          </button>

          <button
            onClick={handleRedirectCheckout}
            disabled={loading}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition"
          >
            {loading ? 'Carregando...' : 'Pagar com Cartão / Outros'}
          </button>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4">
          <p className="text-sm text-gray-600 text-center">
            Escaneie o QR Code abaixo com o aplicativo do seu banco:
          </p>

          <img
            src={`data:image/jpeg;base64,${pixData.qr_code_base64}`}
            alt="QR Code PIX"
            className="w-48 h-48 border p-2 rounded-lg"
          />

          <button
            onClick={copyToClipboard}
            className="w-full py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium rounded-lg text-sm transition"
          >
            {copied ? '✓ Chave Copiada!' : 'Copiar Chave PIX'}
          </button>
        </div>
      )}
    </div>
  )
}