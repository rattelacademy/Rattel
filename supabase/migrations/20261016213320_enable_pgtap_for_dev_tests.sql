-- Development test dependency only; this migration must never be applied to production.
create extension if not exists pgtap with schema extensions;
