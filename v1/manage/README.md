# Aesthetx Ways Inventory System

Inventory management system for Aesthetx Ways store.

**Live URL:** https://insys.aesthetxways.com

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env.local` from `.env.example`:
```bash
cp .env.example .env.local
```

3. Add your Convex URL (same as main Aesthetx Ways app):
```
NEXT_PUBLIC_CONVEX_URL=your_convex_deployment_url
```

4. Generate Convex types (run from this folder):
```bash
npx convex dev
```

5. Run development server:
```bash
npm run dev
```

The app runs on port 6001 by default.

## Deployment to Vercel

1. Create a new project on Vercel
2. Set the root directory to `insys`
3. Add environment variable `NEXT_PUBLIC_CONVEX_URL`
4. Configure domain as `insys.aesthetxways.com`

## Features

- Dashboard with stock overview
- Product inventory management
- Low stock alerts
- Stock history tracking
- CSV export
- Settings for thresholds

## Tech Stack

- Next.js 15
- Convex (shared backend with main app)
- Tailwind CSS 4
- Recharts
- Lucide Icons
