-- domain_purchases (migration 035) enabled RLS with only a SELECT policy --
-- there was never an INSERT or UPDATE policy, so every purchase attempt via
-- the user-session client (src/app/api/domain/purchase/route.ts) was silently
-- blocked by RLS, surfacing as the generic "Failed to create purchase record".

create policy "Users can create their own domain purchases"
  on public.domain_purchases for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own domain purchases"
  on public.domain_purchases for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
