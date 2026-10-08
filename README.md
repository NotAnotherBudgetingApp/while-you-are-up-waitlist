# while you're up — waitlist site

Standalone static marketing page (no build step) for capturing waitlist signups ahead of launch. Lives as a sibling to the Xcode project; shares no code with the SwiftUI app.

## Status

- **Phase A (done):** folder scaffold, Supabase backend, working signup logic.
- **Phase B (done):** real design tokens, copy, and imagery pulled from Figma (file "While You're Up — Design", `4DgEdesJbAXD0QEsbEUUnP`) — Brand Overview (`0:1`) and Design System (`56:2`) pages for tokens/copy, App Page Design (`144:2`) for the hero device screenshot and logo asset. See `css/tokens.css` for the sourced values.

## Backend

- Supabase project: `while-you-are-up` (ref `rkjttzaqwtnpyonygtcl`, region `ap-southeast-2` / Sydney), in the same org as the unrelated "NABA" project — kept as a separate project so data/keys don't mix.
- Table: `public.waitlist_signups` (email, unique + format-checked, plus nullable `source`/`utm_*`/`referrer` for later marketing analysis). RLS enabled with a single `insert`-only policy for the `anon` role — no read/update/delete policy exists, so the publishable key in `js/app.js` can only append rows, never read them back.
- No referral/queue mechanic by design (v1 is plain email capture).
- Spam mitigation: hidden honeypot field + client-side email regex + a DB-level check constraint. No CAPTCHA/rate-limiting yet — documented upgrade path if needed later is a Supabase Edge Function (using `service_role` server-side) in front of the insert, plus something like Cloudflare Turnstile.

## Local preview

```bash
cd waitlist-site
python3 -m http.server 8000
```

Then open `http://localhost:8000`.

## Design source

- Colors: Forest Dark `#2C3322`, Sage Green `#9BA383`, Warm Tan `#CFA779`, Cream Base `#FAF8F5`, Neutral Dark `#1E2215`, Neutral Light `#F1F2ED`.
- Type: Fraunces (display/headings) + Instrument Sans (body/UI), self-hosted from `fonts/` (variable woff2, latin + latin-ext subsets; SIL OFL 1.1 licenses alongside). The page makes no third-party requests except the signup POST to Supabase.
- `assets/logo-mark.svg` — the real brand mark, exported directly from Figma (not redrawn).
- `assets/hero-today-screen.png` — a real screenshot of the app's "Today" screen from the App Page Design file, shown in the hero's phone mockup.
- Copy ("home admin, sorted.", the feature descriptions) is adapted from the actual brand tagline and app screens rather than invented from scratch.

## Next step

Not yet designed in Figma: the "user flow diagram v4" file page hasn't been incorporated (it describes navigation/flow, not visual style, so it wasn't needed for this static page). Revisit if a future onboarding-style waitlist flow is wanted. Domain go-live (pointing `whileyoureup.app` at a host) is still a separate, later step.
