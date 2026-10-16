# Design deviations and unavailable references

- The checked-out repository does not contain `docs/PRD.md`, `AGENTS.md`, `.github/copilot-instructions.md`, or `design/stitch/`. Their absence was confirmed during implementation; product rules and visual fidelity that depend on them remain unverified.
- The approved Stitch screens and board were identified by the user as the visual source, and the companion design text was explicitly excluded. No Stitch screen exports or board assets are present in this checkout, so the current implementation cannot be pixel-checked against the 16 screens.
- The supplied raster logo is installed at `public/brand/logo.svg` and is rendered by the single shared `<Logo />` component. A text fallback appears only if that asset cannot load.
- The repository's initial commit contained a README only. The React, TypeScript, and Vite foundation is a new implementation choice, not an existing stack discovered in the initial app.
- No pricing, proration, payment method, refund, or base currency decision has been invented. Financial read models remain isolated and business rules that depend on those choices are deliberately unconfigured.
- Only isolated development Supabase has received migrations and function deployments. Production has not been changed. The current Cloudflare login did not expose a Rattel Pages project, so no Cloudflare deployment has been performed.
