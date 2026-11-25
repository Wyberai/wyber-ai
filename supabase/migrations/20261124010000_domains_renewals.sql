-- Renewals: a renewal is an order too, so it goes through the same confirm, pay and fulfil path as a purchase.
-- Only widens what commerce_orders.kind may hold. Safe to run more than once. Nothing is deleted.

do $$
declare c text;
begin
  for c in
    select conname from pg_constraint
    where conrelid = 'public.commerce_orders'::regclass and contype = 'c' and pg_get_constraintdef(oid) like '%kind%'
  loop
    execute format('alter table public.commerce_orders drop constraint %I', c);
  end loop;
end $$;

alter table public.commerce_orders
  add constraint commerce_orders_kind_check
  check (kind in ('domain', 'workspace', 'domain_renewal', 'workspace_renewal'));
