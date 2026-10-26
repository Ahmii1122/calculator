# CalcDaily

Free online calculators for dates, money, health, and math. [https://calcdaily.app](https://calcdaily.app)

## Getting started

Copy `.env.example` to `.env.local` and set the site URL:

```bash
cp .env.example .env.local
```

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) locally. Production builds require `NEXT_PUBLIC_SITE_URL=https://calcdaily.app`.

## Scripts

- `npm run dev` — generate holiday data, then start the Next.js dev server
- `npm run build` — production build (requires `NEXT_PUBLIC_SITE_URL`)
- `npm test` — Vitest unit tests

## Deploy

Set `NEXT_PUBLIC_SITE_URL=https://calcdaily.app` in the hosting environment. Preview deployments are `noindex` when `VERCEL_ENV` is not `production`.
