-- Chat aluno<->personal (Fase 3a). Só entre pares com client_links ativo.
create table public.messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references auth.users(id) on delete cascade,
  recipient_id uuid not null references auth.users(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 2000),
  created_at timestamptz not null default now()
);

create index messages_participants_idx on public.messages (sender_id, recipient_id, created_at);

alter table public.messages enable row level security;

create policy "participants can read their messages"
  on public.messages for select to authenticated
  using (sender_id = (select auth.uid()) or recipient_id = (select auth.uid()));

create policy "linked users can send messages"
  on public.messages for insert to authenticated
  with check (
    sender_id = (select auth.uid())
    and exists (
      select 1 from public.client_links cl
      where cl.status = 'active'
        and (
          (cl.trainer_id = sender_id and cl.client_id = recipient_id)
          or (cl.client_id = sender_id and cl.trainer_id = recipient_id)
        )
    )
  );

alter publication supabase_realtime add table public.messages;
