import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const MERCADOPAGO_ACCESS_TOKEN = Deno.env.get('MERCADOPAGO_ACCESS_TOKEN')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Trata requisições de preflight CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { plan_id, payment_method } = await req.json()

    // Valida o usuário autenticado a partir do Token do cabeçalho
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Não autorizado' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    
    // Pega as informações do usuário logado através do token Supabase
    const userClient = createClient(SUPABASE_URL, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } },
    })
    const { data: { user }, error: userError } = await userClient.auth.getUser()

    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Usuário não encontrado' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Busca o plano selecionado no banco
    const { data: plan, error: planError } = await supabase
      .from('plans')
      .select('*')
      .eq('id', plan_id)
      .single()

    if (planError || !plan) {
      return new Response(JSON.stringify({ error: 'Plano não encontrado' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const amountInReais = plan.price_cents / 100

    // ==========================================
    // OPÇÃO A: Geração de Cobrança PIX Direta
    // ==========================================
    if (payment_method === 'pix') {
      const mpResponse = await fetch('https://api.mercadopago.com/v1/payments', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${MERCADOPAGO_ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
          'X-Idempotency-Key': `${user.id}-${plan.id}-${Date.now()}`,
        },
        body: JSON.stringify({
          transaction_amount: amountInReais,
          description: `Assinatura Plano ${plan.name}`,
          payment_method_id: 'pix',
          payer: {
            email: user.email,
          },
          external_reference: user.id,
        }),
      })

      const paymentData = await mpResponse.json()

      if (!mpResponse.ok) {
        throw new Error(paymentData.message || 'Erro ao gerar Pix no Mercado Pago')
      }

      const pointOfInteraction = paymentData.point_of_interaction?.transaction_data

      return new Response(
        JSON.stringify({
          payment_type: 'pix',
          payment_id: paymentData.id,
          qr_code: pointOfInteraction?.qr_code,
          qr_code_base64: pointOfInteraction?.qr_code_base64,
          ticket_url: pointOfInteraction?.ticket_url,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // ==========================================
    // OPÇÃO B: Preferência de Checkout Mercado Pago (Cartão/Outros)
    // ==========================================
    
    // Trata o Origin com fallback para evitar erros em ambiente local/HTTPS
    const originHeader = req.headers.get('origin') || 'http://localhost:3000'
    const isLocalhost = originHeader.includes('localhost') || originHeader.includes('127.0.0.1')

    const preferenceBody: Record<string, any> = {
      items: [
        {
          title: `Assinatura Plano ${plan.name}`,
          quantity: 1,
          currency_id: 'BRL',
          unit_price: amountInReais,
        },
      ],
      payer: {
        email: user.email,
      },
      external_reference: user.id,
    }

    // Só adiciona back_urls e auto_return se NÃO for localhost (Mercado Pago bloqueia localhost)
    if (!isLocalhost) {
      preferenceBody.back_urls = {
        success: `${originHeader}/checkout/sucesso`,
        failure: `${originHeader}/checkout/erro`,
        pending: `${originHeader}/checkout/pendente`,
      }
      preferenceBody.auto_return = 'approved'
    }

    const preferenceResponse = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${MERCADOPAGO_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(preferenceBody),
    })

    const preferenceData = await preferenceResponse.json()

    if (!preferenceResponse.ok) {
      console.error('Erro detalhado MP Preference:', preferenceData)
      throw new Error(preferenceData.message || preferenceData.cause?.[0]?.description || 'Erro ao criar preferência de checkout')
    }

    return new Response(
      JSON.stringify({
        payment_type: 'checkout',
        init_point: preferenceData.init_point, // URL para checkout do cartão
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error: any) {
    console.error('Erro na Edge Function create-checkout:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})