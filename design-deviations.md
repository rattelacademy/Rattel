# Design deviations

## Recorded during Phase 1

- The visible Stitch screens and design-system boards are the approved visual source, per the user's clarification. The companion text `DESIGN.md` is not used to make design decisions.
- The repo had no `public/brand/logo.svg`; the supplied `logo.png` is embedded without visual edits in the required SVG path and is rendered only by the shared `Logo` component.
- The repo was README-only, so a React + TypeScript + Vite shell is being established as a new implementation choice, not reported as an existing stack.

## Recorded during app shell implementation

- The 16 Stitch references are represented by the sign-in/MFA flow and 15 role-aware app screens. Dynamic business records are not available in the connected production project, so several screens use clearly labeled Stitch sample data or empty states; forms that would write live data remain disabled until the development schema is verified online.
- Supabase development branching is unavailable on the connected plan. The development project creation tool returned a project reference, but subsequent project access and migration application were denied; no migration was applied. RLS tests remain authored but unexecuted.
- The checked-out repository has no PRD.md or AGENTS.md / Copilot instruction file. Business behavior beyond the supplied Stitch visuals and explicit financial isolation rules remains unimplemented until those requirements are available.
