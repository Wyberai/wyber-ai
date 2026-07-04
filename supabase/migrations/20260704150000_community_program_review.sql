-- Community-program review support.
--
-- 1. The program CHECK constraint only allowed the original 4 programs, but the
--    UI later added follow_linkedin / follow_reddit / review_producthunt — so
--    those three submissions were FAILING the insert (constraint violation).
--    Widen it to every program the app actually offers.
-- 2. granted_credits records what an approval paid out, so the admin panel can
--    show it and a revoke can claw back the exact amount.

alter table community_program_submissions
  drop constraint if exists community_program_submissions_program_check;

alter table community_program_submissions
  add constraint community_program_submissions_program_check
  check (program in (
    'blood_donor', 'build_in_public', 'accessibility', 'open_source',
    'follow_linkedin', 'follow_reddit', 'review_producthunt'
  ));

alter table community_program_submissions
  add column if not exists granted_credits integer;

-- Newest-pending-first is how the admin review queue reads them.
create index if not exists community_prog_status_idx
  on community_program_submissions (status, created_at desc);
