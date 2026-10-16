# GitHub, Supabase, and Cloudflare URLs

## Two different GitHub links

- GitHub repository deployment is already connected to the Cloudflare Pages project `rattelacademy`. The `main` branch is production; other branches create previews.
- GitHub social login is a separate optional provider. If enabled in Supabase Auth, the GitHub OAuth application's **Authorization callback URL** must be:

  `https://qhwanxjjwakrhnxkrxri.supabase.co/auth/v1/callback`

  The GitHub OAuth application's Client ID and Client Secret must also be configured in Supabase Auth. Do not put the Client Secret in this repository or in a `VITE_` variable.

## App callback and Supabase URL configuration

The app builds its OAuth return URL from `window.location.origin`, so the same callback route works for the production site, a Pages preview, or localhost:

`<current-origin>/auth/callback`

Set the Supabase Auth **Site URL** to the production app origin:

`https://rattelacademy.pages.dev`

Add these **Redirect URLs** in Supabase Auth:

```text
https://rattelacademy.pages.dev/auth/callback
https://*.rattelacademy.pages.dev/auth/callback
http://localhost:5173/auth/callback
http://127.0.0.1:5173/auth/callback
```

The wildcard covers one subdomain label used by Cloudflare's unique deployment URLs and branch aliases. Keep the production URL explicit.

## Cloudflare Pages variables

Both the Preview and Production environments need these build-time variables:

```text
VITE_SUPABASE_URL=https://qhwanxjjwakrhnxkrxri.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<Supabase publishable key>
```

Only the publishable key belongs in the browser build. Never use a service-role key or secret key in a `VITE_` variable.

The repository's `supabase/config.toml` contains the corresponding local redirect allowlist. The hosted Supabase Auth URL configuration is managed separately in the Supabase dashboard.
