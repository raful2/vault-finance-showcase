# VaultFinance 🛡️
> All-in-One Personal Finance, Budgeting & Net Worth Operating System

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fraful2%2Fvault-finance)
![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)
![Architecture: Modular](https://img.shields.io/badge/Architecture-Modular-emerald.svg)
![Database: Supabase%20Ready](https://img.shields.io/badge/Cloud-Supabase%20Ready-3ecf8e.svg)

**VaultFinance** is a modern, modular, private personal finance management application designed to give you complete visibility and control over your net worth, cash flow, daily spending, debt elimination, and long-term milestones.

---

## 🌟 Key Features

### 1. 📊 Net Worth & Cash Flow Dashboard
- Real-time calculation of **Total Net Worth** (Assets minus Liabilities).
- Dynamic **Expense Runway** calculation (liquid cash reserves divided by average monthly burn).
- Smooth interactive **Trajectory Curve** and **Spending Breakdown Donut Chart** powered by Chart.js.

### 2. 💳 Smart Bank Statement CSV Importer
- Drag & drop bank statements from **Chase, Bank of America, Wells Fargo, Amex, Capital One, Revolut**, etc.
- Automated column header detection for Date, Payee, and Amount.
- **Regex Auto-Categorization**: Automatically categorizes transactions into essential **Needs**, discretionary **Wants**, and **Savings** with a 5-row preview before importing.

### 3. 🎯 4-in-1 Modular Budgeting Hub
Switch between four budgeting methodologies at any time:
- **Category Limits**: Track allowances with visual progress bars and warnings when spending reaches $\ge 85\%$ or exceeds limits.
- **50/30/20 Rule**: Macro health breakdown tracking Essential Needs (50%), Lifestyle Wants (30%), and Savings (20%).
- **Zero-Based Envelopes (YNAB-style)**: Assign every single dollar of monthly income until unallocated cash equals $0.
- **Recurring Bills Calendar**: Timeline of fixed commitments (rent, utilities, gym, subscriptions) tracking fixed monthly burn.

### 4. ⚡ Debt Elimination Simulator (Snowball vs. Avalanche)
- Simulates month-by-month amortization for credit cards, auto loans, and student debt.
- Direct mathematical comparison between **Avalanche** (highest APR first, mathematically lowest interest) and **Snowball** (lowest balance first, quick psychological wins).
- Interactive **Extra Monthly Payment Slider** ($0 to $1,000/mo) with real-time updates to debt-free dates and interest saved.

### 5. 💡 Algorithmic Spending Advisor & Health Score
- Proprietary **Financial Health Score (0–100)** factoring in savings rate, emergency reserve coverage, and debt-to-income balance.
- Automated flags for spending anomalies, budget leak warnings, and compound interest reduction opportunities.

### 6. 🔒 Complete Privacy & Security Suite
- **1-Click Privacy Blur**: Eye icon toggle blurs all dollar amounts with CSS masking for safe public coffee-shop use or screen sharing.
- **Data Portability**: Full JSON database backup and restore, plus CSV transaction exports.

### 7. ☁️ Dual-Mode Engine (Local + Supabase Cloud)
- **Local Engine**: Runs out-of-the-box with zero configuration and local JSON persistence in `data/state.json`.
- **Supabase Cloud Sync**: Ready for multi-device cloud synchronization. Includes complete PostgreSQL migration script (`supabase-schema.sql`) with Row-Level Security (RLS) policies.

---

## 🚀 Quick Start (Local Run)

```bash
# 1. Clone repository
git clone https://github.com/raful2/vault-finance.git
cd vault-finance

# 2. Start local server
node server.js
```
Open **`http://localhost:3000`** in any web browser.

---

## ⚡ 1-Click Cloud Deployment to Vercel

VaultFinance is configured with Vercel serverless API routes (`/api/health`, `/api/state`, `/api/supabase/test`) and `vercel.json`:

1. Click **[Deploy with Vercel](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fraful2%2Fvault-finance)**
2. Select your GitHub account and click **Create**
3. Your live personal finance web app will be instantly live on a secure HTTPS URL with global edge performance!

---

## 📁 Project Architecture

```
finance-hub/
├── index.html                    # Single-page UI shell (Tailwind CSS, Lucide, Chart.js)
├── vercel.json                   # Vercel serverless deployment routing
├── server.js                     # Local zero-dependency Node HTTP backend
├── supabase-schema.sql           # PostgreSQL cloud schema with Row-Level Security
├── api/                          # Vercel Serverless Functions
│   ├── health.js
│   ├── state.js
│   └── supabase-test.js
├── docs/                         # Master Project Plan & Documentation
└── src/
    ├── app.js                    # Reactive router & modal coordinator
    ├── store.js                  # Central reactive store & persistence
    ├── utils/
    │   ├── csvParser.js          # Bank statement CSV parser & auto-categorizer
    │   ├── debtCalculator.js     # Snowball vs. Avalanche simulation engine
    │   ├── insightsEngine.js     # Health score & spending pattern analyzer
    │   └── formatters.js         # Multi-currency & Privacy Blur masking
    ├── components/
    │   ├── Header.js
    │   └── Sidebar.js
    └── modules/
        ├── overview/             # Net Worth hero, metrics, trajectory charts
        ├── transactions/         # Searchable ledger, category filters, CSV modal
        ├── budgets/              # Category Limits, 50/30/20, Envelopes, Bills
        ├── goals/                # Savings goals with direct fund allocations
        ├── debt/                 # Debt payoff simulator & trajectory chart
        ├── insights/             # AI spending advisor & runway analysis
        └── settings/             # Supabase cloud credentials & backups
```

---

## 📄 License
MIT © Rafael H. Schwartz
