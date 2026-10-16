# Academy app foundation

This repository started with a README only. Phase 1 adds a minimal React, TypeScript, and Vite foundation for the approved Stitch component system.

## Local setup

1. Install dependencies with `npm ci`.
2. Copy `.env.example` to `.env.local` and use the local Supabase URL and publishable key printed by `supabase status`.
3. Run `supabase start` and `supabase db reset` to apply local migrations.
4. Run `npm run dev` to view the component library.

Never put a service-role or secret key in a `VITE_` variable. The Data API uses a publishable key and relies on database grants and RLS.

## Database migration safety

The migration in `supabase/migrations/` and its paired rollback script are for local development or an explicitly approved staging branch only. No remote project is linked in this checkout. Never apply them to the production project. Review the rollback script and back up staging data before applying a staging migration.

The foundation keeps currency as a per-record ISO code and stores parent invoice totals separately from teacher earnings. It does not define proration, payment methods, refunds, a base currency, or flat versus per-lesson prices.
