# Academy app foundation

This repository started with a README only. Phase 1 adds a minimal React, TypeScript, and Vite foundation for the approved Stitch component system.

## Online development setup

1. Install dependencies with `npm ci`.
2. Copy `.env.example` to `.env.local` and set the hosted Supabase URL and publishable key for a development project.
3. Apply reviewed migrations only to that development project using the Supabase dashboard or connected Supabase tooling. Do not use the production project for schema testing.
4. Run `npm run dev` to view the app against the hosted development project.

Never put a service-role or secret key in a `VITE_` variable. The Data API uses a publishable key and relies on database grants and RLS.

## Database migration safety

The migrations in `supabase/migrations/` and their paired rollback script are for an isolated development project only. Never apply them to the production project. Review the rollback script before applying a migration.

The foundation keeps currency as a per-record ISO code and stores parent invoice totals separately from teacher earnings. It does not define proration, payment methods, refunds, a base currency, or flat versus per-lesson prices.
