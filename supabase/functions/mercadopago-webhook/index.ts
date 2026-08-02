import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Variáveis de ambiente configuradas no Supabase
const MERCADOPAGO_ACCESS_TOKEN = Deno.env.get('MERCADOPAGO_ACCESS_TOKEN')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

// Usa a Service Role Key para ignorar as regras de RLS durante escritas do Webhook
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

Deno.serve(async (req) => {
  // Permite apenas requisições do tipo POST
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 })
  }

  try {
    const payload = await req.json()
    const { type, action, data } = payload

    // O Mercado Pago envia o ID do recurso notificado
    const resourceId = data?.id || payload.id
    const eventType = type || action || 'unknown'

    if (!resourceId) {
      return new Response(JSON.stringify({ message: 'Nenhum ID de recurso encontrado' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // 1. IDEMPOTÊNCIA: Registra o evento na tabela `events`
    // A trava de unicidade no banco (provider + provider_event_id) evita duplo processamento
    const { data: eventRecord, error: eventError } = await supabase
      .from('events')
      .insert({
        provider: 'mercadopago',
        event_type: eventType,
        provider_event_id: String(resourceId),
        payload: payload,
        processed: false,
      })
      .select('id')
      .single()

    if (eventError) {
      // Código '23505' = chave duplicada (já recebemos e processamos este evento)
      if (eventError.code === '23505') {
        return new Response(JSON.stringify({ message: 'Evento ja processado anteriormente' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      }
      throw eventError
    }

    // 2. Trata notificações de PAGAMENTO (Payment)
    if (eventType === 'payment' || eventType === 'payment.created' || eventType === 'payment.updated') {
      await processPayment(String(resourceId), eventRecord.id)
    }

    // 3. Retorna HTTP 200 para que o Mercado Pago saiba que a notificação foi entregue
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error: any) {
    console.error('Erro ao processar Webhook:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})

// Função auxiliar para consultar a API do Mercado Pago e atualizar o banco de dados
async function processPayment(paymentId: string, eventRecordId: string) {
  // Busca as informações reais do pagamento direto no Mercado Pago por segurança
  const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
    headers: {
      Authorization: `Bearer ${MERCADOPAGO_ACCESS_TOKEN}`,
    },
  })

  if (!mpResponse.ok) {
    throw new Error(`Falha ao buscar pagamento no Mercado Pago: ${mpResponse.statusText}`)
  }

  const paymentData = await mpResponse.json()

  // O user_id deve ser passado na propriedade external_reference no momento de gerar o Pix/Cartão
  const userId = paymentData.external_reference
  const statusMP = paymentData.status
  const amountCents = Math.round((paymentData.transaction_amount || 0) * 100)

  if (!userId) {
    console.warn(`Pagamento ${paymentId} recebido sem external_reference (user_id).`)
    return
  }

  // Mapeia os status do Mercado Pago para os Enums do nosso banco de dados
  let mappedPaymentStatus: 'aprovado' | 'recusado' | 'reembolso' | 'cancelamento' = 'recusado'
  if (statusMP === 'approved') mappedPaymentStatus = 'aprovado'
  if (statusMP === 'refunded') mappedPaymentStatus = 'reembolso'
  if (statusMP === 'cancelled') mappedPaymentStatus = 'cancelamento'

  // Localiza a assinatura do usuário
  const { data: sub } = await supabase
    .from('subscriptions')
    .select('id, plan_id, plans(interval_type)')
    .eq('user_id', userId)
    .single()

  if (!sub) {
    console.warn(`Assinatura nao encontrada para o usuario: ${userId}`)
    return
  }

  // Registra no histórico da tabela PAYMENTS
  await supabase.from('payments').insert({
    subscription_id: sub.id,
    user_id: userId,
    provider: 'mercadopago',
    provider_payment_id: String(paymentId),
    amount_cents: amountCents,
    currency: 'BRL',
    status: mappedPaymentStatus,
    paid_at: statusMP === 'approved' ? new Date().toISOString() : null,
    raw_payload: paymentData,
  })

  // Se o pagamento foi aprovado, renova/ativa a assinatura
  if (statusMP === 'approved') {
    const now = new Date()
    const isAnual = sub.plans?.interval_type === 'anual'
    
    // Calcula o vencimento (1 mês ou 1 ano à frente)
    const periodEnd = new Date(now)
    if (isAnual) {
      periodEnd.setFullYear(periodEnd.getFullYear() + 1)
    } else {
      periodEnd.setMonth(periodEnd.getMonth() + 1)
    }

    await supabase
      .from('subscriptions')
      .update({
        status: 'ativo',
        current_period_start: now.toISOString(),
        current_period_end: periodEnd.toISOString(),
        next_payment_at: periodEnd.toISOString(),
        updated_at: now.toISOString(),
      })
      .eq('id', sub.id)
  }

  // Atualiza a tabela de eventos marcando como concluído
  await supabase
    .from('events')
    .update({ processed: true })
    .eq('id', eventRecordId)
}