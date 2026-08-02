-- =====================================================
-- 1. TIPOS E ENUMS
-- =====================================================

CREATE TYPE public.plan_type AS ENUM (
  'trial',
  'mensal',
  'anual'
);

CREATE TYPE public.subscription_status AS ENUM (
  'trial',
  'ativo',
  'expirado',
  'cancelado',
  'past_due',
  'paused'
);

CREATE TYPE public.payment_status AS ENUM (
  'aprovado',
  'recusado',
  'reembolso',
  'cancelamento',
  'renovacao'
);

-- =====================================================
-- 2. TABELA PLANS
-- =====================================================

CREATE TABLE public.plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  price_cents integer NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'BRL',
  interval_type public.plan_type NOT NULL DEFAULT 'mensal',
  trial_days integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated users can view active plans"
ON public.plans
FOR SELECT
TO authenticated
USING (active = true);

GRANT SELECT ON public.plans TO authenticated;
GRANT ALL ON public.plans TO service_role;

-- =====================================================
-- 3. TABELA SUBSCRIPTIONS
-- =====================================================

CREATE TABLE public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  user_id uuid NOT NULL UNIQUE
    REFERENCES auth.users(id) ON DELETE CASCADE,
    
  plan_id uuid NOT NULL
    REFERENCES public.plans(id),
    
  plan_type public.plan_type NOT NULL DEFAULT 'trial',
  status public.subscription_status NOT NULL DEFAULT 'trial',
  
  provider text NOT NULL DEFAULT 'mercadopago',
  provider_subscription_id text UNIQUE,
  
  trial_starts_at timestamptz,
  trial_ends_at timestamptz,
  
  current_period_start timestamptz NOT NULL DEFAULT now(),
  current_period_end timestamptz,
  next_payment_at timestamptz,
  
  cancel_at_period_end boolean NOT NULL DEFAULT false,
  
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users can view own subscription"
ON public.subscriptions
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

GRANT SELECT ON public.subscriptions TO authenticated;
GRANT ALL ON public.subscriptions TO service_role;

CREATE INDEX subscriptions_user_idx ON public.subscriptions(user_id);
CREATE INDEX subscriptions_status_idx ON public.subscriptions(status);
CREATE INDEX subscriptions_provider_idx ON public.subscriptions(provider, provider_subscription_id);

-- =====================================================
-- 4. TABELA PAYMENTS (Histórico Financeiro)
-- =====================================================

CREATE TABLE public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  subscription_id uuid NOT NULL
    REFERENCES public.subscriptions(id) ON DELETE CASCADE,
    
  user_id uuid NOT NULL
    REFERENCES auth.users(id) ON DELETE CASCADE,
    
  provider text NOT NULL DEFAULT 'mercadopago',
  provider_payment_id text UNIQUE,
  
  amount_cents integer NOT NULL,
  currency text NOT NULL DEFAULT 'BRL',
  
  status public.payment_status NOT NULL,
  paid_at timestamptz,
  
  raw_payload jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users can view own payments"
ON public.payments
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

GRANT SELECT ON public.payments TO authenticated;
GRANT ALL ON public.payments TO service_role;

CREATE INDEX payments_subscription_idx ON public.payments(subscription_id);
CREATE INDEX payments_user_idx ON public.payments(user_id);
CREATE INDEX payments_provider_idx ON public.payments(provider, provider_payment_id);

-- =====================================================
-- 5. TABELA EVENTS (Auditoria e Webhook)
-- =====================================================

CREATE TABLE public.events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  provider text NOT NULL DEFAULT 'mercadopago',
  event_type text NOT NULL,
  provider_event_id text,
  
  processed boolean NOT NULL DEFAULT false,
  error_message text,
  
  payload jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  
  CONSTRAINT unique_provider_event UNIQUE (provider, provider_event_id)
);

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "deny direct access to events"
ON public.events
FOR ALL
TO authenticated
USING (false);

GRANT ALL ON public.events TO service_role;

CREATE INDEX events_provider_idx ON public.events(provider);
CREATE INDEX events_processed_idx ON public.events(processed);

-- =====================================================
-- 6. SEEDING INICIAL DOS PLANOS
-- =====================================================

INSERT INTO public.plans (slug, name, description, price_cents, interval_type, trial_days)
VALUES 
  ('trial-30d', 'Trial 30 Dias', 'Degustação gratuita da IA', 0, 'trial', 30),
  ('mensal', 'Plano Mensal', 'Acesso mensal ilimitado à IA', 2990, 'mensal', 0),
  ('anual', 'Plano Anual', 'Acesso anual ilimitado à IA com desconto', 19900, 'anual', 0)
ON CONFLICT (slug) DO NOTHING;