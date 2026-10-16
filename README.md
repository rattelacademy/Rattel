# Academy app foundation

This repository started with a README only. Phase 1 adds a minimal React, TypeScript, and Vite foundation for the approved Stitch component system.

## Online development setup

1. Install dependencies with `npm ci`.
2. Copy `.env.example` to `.env.local` and set the hosted Supabase URL and publishable key for a development project.
3. Apply reviewed migrations only to that development project using the Supabase dashboard or connected Supabase tooling. Do not use the production project for schema testing.
4. Run `npm run dev` to view the app against the hosted development project.

### First development owner and accounts

Create the first owner identity in the development project's Auth dashboard, verify its email, then run `supabase/ops/bootstrap_first_owner.sql` after replacing its email placeholder. The script refuses to run if an owner role already exists or the email is not found. Do not run it against production. Once signed in, the owner can assign or remove teacher and parent roles for existing Auth profiles from the account screen. New Auth identities still need to be created/invited through the Supabase Auth dashboard.

Never put a service-role or secret key in a `VITE_` variable. The Data API uses a publishable key and relies on database grants and RLS.

## Database migration safety

The migrations in `supabase/migrations/` and their paired rollback script are for an isolated development project only. Never apply them to the production project. Review the rollback script before applying a migration.

The foundation keeps currency as a per-record ISO code and stores parent invoice totals separately from teacher earnings. It does not define proration, payment methods, refunds, a base currency, or flat versus per-lesson prices.
