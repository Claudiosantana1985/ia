CREATE TABLE public.whatsapp_threads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wa_id text NOT NULL UNIQUE,
  profile_name text,
  last_message_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.whatsapp_threads TO service_role;
ALTER TABLE public.whatsapp_threads ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.whatsapp_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id uuid NOT NULL REFERENCES public.whatsapp_threads(id) ON DELETE CASCADE,
  wa_message_id text UNIQUE,
  role text NOT NULL CHECK (role IN ('user','assistant')),
  content text NOT NULL DEFAULT '',
  media_type text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.whatsapp_messages TO service_role;
ALTER TABLE public.whatsapp_messages ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_whatsapp_messages_thread ON public.whatsapp_messages (thread_id, created_at);