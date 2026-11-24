# Fraud Radar · Frontend

Next.js platform for fraud teams. Talks to the FastAPI backend in `../backend`.

| Page | Who | What it does |
|---|---|---|
| **Home** `/` | Everyone | Landing page: what the platform does, model performance, how it works |
| **Project** `/about` | Everyone | Data, model, threshold, leakage prevention, limitations and stack |
| **Log in / Get started** | Everyone | Sign in or create an analyst account |
| **Dashboard** `/dashboard` | Analysts | KPIs, highest-risk transactions, model metrics, alerts by hour, fraud by segment |
| **Alert queue** `/alerts` | Analysts | Transactions by risk. Open one to see its reasons and mark it as confirmed fraud, legitimate or escalated |
| **Evaluate** `/evaluate` | Analysts | Score a new transaction, or edit a real alert and see how the risk moves. Every result is saved |
| **History** `/history` | Analysts | Your saved predictions |
| **Profile** `/profile` | Analysts | Edit your name and company, change your password |
| **Admin** `/admin` | Admins | Users (role, activate/deactivate), all predictions and the activity log |

## Run locally

The backend must be running on port 8000 first.

```bash
cd page/frontend
npm install
npm run dev
```

Open http://localhost:3000 and log in with the default admin (**admin@fraudradar.dev / admin1234**)
or create an analyst account.

To point to another API URL, copy `.env.example` to `.env.local` and edit `NEXT_PUBLIC_API_URL`.

## Stack
Next.js 15 (App Router) · React 19 · TypeScript · hand-built SVG charts and illustrations · plain CSS.
