import { SupabaseClient } from '@supabase/supabase-js'

export type SubscriptionStatus =
  | 'trial'
  | 'ativo'
  | 'expirado'
  | 'cancelado'
  | 'past_due'
  | 'paused'

export interface UserSubscription {
  id: string
  user_id: string
  plan_id: string
  status: SubscriptionStatus
  trial_ends_at: string | null
  current_period_end: string | null
  plans?: {
    name: string
    slug: string
  }
}

export interface AccessCheckResult {
  hasAccess: boolean
  reason: 'active_subscription' | 'active_trial' | 'trial_expired' | 'subscription_expired' | 'no_subscription'
  daysRemaining: number | null
}

/**
 * Função pura que avalia se a assinatura/trial concede acesso à IA
 */
export function checkAiAccess(subscription: UserSubscription | null): AccessCheckResult {
  if (!subscription) {
    return {
      hasAccess: false,
      reason: 'no_subscription',
      daysRemaining: null,
    }
  }

  const now = new Date()

  // 1. Validação de Plano Ativo Pago
  if (subscription.status === 'ativo') {
    if (subscription.current_period_end) {
      const endDate = new Date(subscription.current_period_end)
      if (endDate > now) {
        const diffTime = endDate.getTime() - now.getTime()
        const daysRemaining = Math.ceil(diffTime / (1000 * 3600 * 24))
        return { hasAccess: true, reason: 'active_subscription', daysRemaining }
      }
    } else {
      // Se for ativo sem data limite cadastrada (ex: plano ilimitado)
      return { hasAccess: true, reason: 'active_subscription', daysRemaining: null }
    }
  }

  // 2. Validação de Período de Trial
  if (subscription.status === 'trial') {
    if (subscription.trial_ends_at) {
      const trialEnd = new Date(subscription.trial_ends_at)
      if (trialEnd > now) {
        const diffTime = trialEnd.getTime() - now.getTime()
        const daysRemaining = Math.ceil(diffTime / (1000 * 3600 * 24))
        return { hasAccess: true, reason: 'active_trial', daysRemaining }
      }
    }
    return { hasAccess: false, reason: 'trial_expired', daysRemaining: 0 }
  }

  // 3. Status expirado, cancelado ou em atraso
  return {
    hasAccess: false,
    reason: 'subscription_expired',
    daysRemaining: 0,
  }
}

/**
 * Busca a assinatura no Supabase e verifica a permissão
 */
export async function getUserAiAccess(
  supabase: SupabaseClient,
  userId: string
): Promise<AccessCheckResult> {
  const { data, error } = await supabase
    .from('subscriptions')
    .select('*, plans(name, slug)')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) {
    console.error('Erro ao verificar assinatura:', error)
    return { hasAccess: false, reason: 'no_subscription', daysRemaining: null }
  }

  return checkAiAccess(data as UserSubscription | null)
}