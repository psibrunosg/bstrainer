drop policy if exists "user manages own body measurements"
  on public.body_measurements;

create policy "athlete manages own body measurements"
  on public.body_measurements for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "trainer manages linked client body measurements"
  on public.body_measurements for all to authenticated
  using ((select public.trains_client(user_id)))
  with check ((select public.trains_client(user_id)));

grant select, insert, update, delete on public.body_measurements to authenticated;
