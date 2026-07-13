-- Billing: subscriptions + entitlements (schema pronto, provedor plugado no V2)

create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null unique references public.organizations(id) on delete cascade,
  tier text not null default 'starter' check (tier in ('starter', 'pro', 'ai')),
  status text not null default 'active' check (status in ('trialing', 'active', 'past_due', 'canceled')),
  provider text,
  provider_customer_id text,
  provider_subscription_id text,
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Derivada do tier; permite grandfathering e overrides sem if-tier no código.
create table public.entitlements (
  org_id uuid not null references public.organizations(id) on delete cascade,
  feature_key text not null,
  limit_value integer,
  primary key (org_id, feature_key)
);

create trigger subscriptions_updated_at before update on public.subscriptions
  for each row execute function public.set_updated_at();
