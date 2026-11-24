# VaultFinance — Project Progress, Architecture & Future Roadmap

**Document Status**: Cloud Backup & Master Project Plan  
**Owner**: Rafael H. Schwartz (`rafael.h.schwartz@gmail.com`)  
**Active Deployment**: Live on `http://localhost:3000`  
**Workspace Root**: `C:\Users\QueMember\.gemini\antigravity\scratch\finance-hub`  
**Date**: November 24, 2026  

---

## 1. Executive Summary & Vision

**VaultFinance** is a modern, modular, private personal finance management operating system designed to give users comprehensive command over their net worth, monthly cash flow, everyday spending, debt elimination, and long-term savings goals.

Built following a deep collaborative architecture review, the project enforces strict separation of concerns across modules so new financial capabilities can be plugged in continuously without tangling existing code. It features a dual-mode engine: running 100% locally with zero setup overhead out-of-the-box, while maintaining instant readiness for multi-device PostgreSQL cloud synchronization via Supabase.

---

## 2. Completed Milestones & Feature Ledger

| Milestone | Component | Status | Capability Delivered |
| --- | --- | --- | --- |
| M1 | Core Architecture & Engine | Complete | Clean Node.js backend server, JSON persistence layer, and reactive state store. |
| M2 | Dashboard & Net Worth Tracker | Complete | Real-time calculation of Assets (USD 57,820.80) minus Liabilities (USD 1,124.50), trajectory line chart, and spending donut. |
| M3 | Transaction Ledger & CSV Importer | Complete | Searchable ledger with bucket filters (Needs/Wants/Savings/Income) and drag-and-drop CSV importer with regex categorization. |
| M4 | Modular Budgeting Hub | Complete | Four user-selectable views: Category Limits (with 85% alerts), 50/30/20 Rule, Zero-Based Envelopes, and Recurring Bills. |
| M5 | Savings Goals & Milestone Fund | Complete | Visual milestone trackers with target dates and interactive fund transfer/deposit engine. |
| M6 | Debt Elimination Simulator | Complete | Snowball vs. Avalanche comparison engine with interactive extra-payment slider and APR interest savings calculation. |
| M7 | AI & Algorithmic Spending Advisor | Complete | Automated health index scoring (80/100), liquid expense runway calculations (8.2 months), and budget leak warnings. |
| M8 | Privacy & Security Suite | Complete | One-click Privacy Mask blurring all dollar amounts for public screen protection, plus JSON database backup/restore. |
| M9 | Supabase Cloud Ready | Complete | Complete PostgreSQL schema migration script (`supabase-schema.sql`) with Row-Level Security and connection tester. |

---

## 3. Detailed Module Specifications

### 3.1 Real-Time Net Worth & Dashboard Overview
- **Net Worth**: Automatically aggregated across all accounts: checking, high-yield savings (4.75%), brokerage index funds, credit cards, and cash.
- **Runway Metric**: Automatically computes liquid cash reserves divided by monthly average burn rate, displaying exact months of runway (currently 8.2 months).
- **Interactive Visualizations**: Powered by Chart.js with responsive dark-mode palettes, smooth bezier curves, and custom tooltips.

### 3.2 Smart Bank Statement CSV Importer
- **Automated Column Recognition**: Intelligently scans headers for date, description/payee, and amount variants.
- **Algorithmic Categorization Rules**:
  - `Transportation`: Matches Uber, Lyft, Shell, Chevron, Exxon, transit, subway.
  - `Groceries`: Matches Whole Foods, Trader Joe's, Kroger, Safeway, Walmart, Costco, Aldi.
  - `Dining & Social`: Matches restaurants, cafes, Starbucks, Chipotle, sushi, pizza.
  - `Housing & Rent`: Matches apartment, rent, lease, property management.
  - `Utilities`: Matches electric, gas, water, internet, Comcast, Verizon.
  - `Subscriptions`: Matches Netflix, Spotify, Hulu, Apple, Prime, Disney.
  - `Investments`: Matches Vanguard, Fidelity, Schwab, Robinhood, crypto.
- **Pre-Import Verification**: Displays a live 5-row preview showing inferred categories and bucket mappings before committing transactions to state.

### 3.3 Four-in-One Modular Budgeting Hub
The user can toggle seamlessly between four industry methodologies:
1. **Category Limits**: Track individual allowances (e.g. Groceries USD 550, Dining USD 300, Shopping USD 250) with color-coded warning chips when spending reaches 85% or exceeds limits.
2. **50/30/20 Wealth Framework**: Tracks macro allocation against the gold standard:
   - Essential Needs (50% target)
   - Discretionary Wants (30% target)
   - Savings & Debt Payoff (20% target)
3. **Zero-Based Envelopes (YNAB-style)**: Visual allocation interface showing total monthly income and ensuring every dollar is allocated to an envelope until unassigned dollars equal zero.
4. **Recurring Bills Timeline**: Displays fixed commitments (rent, utilities, gym, subscriptions) to compute fixed monthly burn (USD 1,823.37).

### 3.4 Debt Elimination Simulator (Snowball vs. Avalanche)
- **Mathematical Modeling**: Simulates month-by-month amortization for all debts, applying minimum payments and rolling freed-up capital into target balances.
- **Avalanche Strategy**: Prioritizes debts with the highest APR first, minimizing total lifetime interest paid.
- **Snowball Strategy**: Prioritizes debts with the lowest balances first, accelerating psychological wins.
- **Interactive Slider**: Allows testing extra monthly contributions (USD 0 to USD 1,000/mo) with real-time updates to debt-free dates.

### 3.5 Privacy & Security Mode
- **1-Click Public Mask**: An eye toggle in the top navigation bar applies CSS blur filters to all currency values across cards, tables, and chart tooltips.
- **Data Portability**: Full JSON database snapshot export and restore functionality, plus standard CSV transaction exports.

---

## 4. Technical Architecture & Directory Structure

```
finance-hub/
├── index.html                    # Single-Page FinTech Shell (Tailwind CSS, Lucide Icons, Chart.js)
├── server.js                     # High-performance zero-dependency Node HTTP backend
├── supabase-schema.sql           # PostgreSQL schema with Row-Level Security (RLS) & triggers
├── data/
│   └── state.json                # Local JSON state store with auto-persistence
├── docs/
│   └── PROJECT_PLAN_AND_PROGRESS.md # Master project documentation
└── src/
    ├── app.js                    # Core event loop, router, and modal coordinator
    ├── store.js                  # Central reactive store with subscribe/notify architecture
    ├── mockData.js               # Realistic initial financial profile
    ├── utils/
    │   ├── formatters.js         # Currency and privacy masking helpers
    │   ├── csvParser.js          # Bank statement CSV parser & auto-categorizer
    │   ├── debtCalculator.js     # Amortization simulation engine
    │   └── insightsEngine.js     # Health score & spending pattern analyzer
    ├── components/
    │   ├── Sidebar.js            # Navigation bar with active count badges
    │   └── Header.js             # Privacy toggle, currency switcher, and action buttons
    └── modules/
        ├── overview/             # Net Worth cards, metric tiles, and trajectory charts
        ├── transactions/         # Searchable ledger, category filters, CSV importer modal
        ├── budgets/              # Budgeting views: Category, 50/30/20, Envelopes, Bills
        ├── goals/                # Savings goals with interactive deposit transfers
        ├── debt/                 # Debt payoff simulator and amortization chart
        ├── insights/             # AI spending advice and runway analysis
        └── settings/             # Supabase cloud credentials, JSON backup/restore
```

---

## 5. Verification & Testing Evidence

All systems have undergone rigorous automated unit testing and browser UI verification:

1. **Algorithm & Math Verification**:
   - `calculateDebtPayoff`: Validated against test cases; correctly identifies interest savings ($53 saved by Avalanche at current debt configuration).
   - `parseCSV` & `processImportedRows`: Verified across multi-column formats and regex rules.
   - `analyzeFinances`: Verified Net Worth ($56,696.30), Health Score (80/100), and Runway (8.2 months).
2. **Server Verification**:
   - `GET /api/health` returns `200 OK`.
   - Static assets served with strict MIME types (`text/html`, `application/javascript`, `text/css`).
3. **Browser UI Verification**:
   - Tested using Chrome DevTools automated browser agent on `http://localhost:3000`.
   - Verified responsive rendering, privacy blur masking toggle, transaction search/filter tabs, and modal workflows.

---

## 6. Future Expansion Roadmap

### Phase 1: Direct Third-Party Bank API Sync (Plaid / Teller)
- Implement Plaid Link / Teller Connect in `src/modules/transactions/PlaidSyncModal.js`.
- Add server-side token exchange in `server.js` using encrypted secrets.
- Support automated daily account balance and transaction polling.

### Phase 2: Mobile Progressive Web App (PWA) Packaging
- Add `manifest.json` and service worker caching for offline app installation on iOS and Android.
- Add touch gestures (swipe to categorize transactions, swipe to delete).

### Phase 3: Push Notifications & Smart Bill Reminders
- Add browser Web Push notifications for upcoming bills (3 days before due date).
- Budget threshold alerts when a category spending velocity exceeds 90% mid-month.

### Phase 4: Multi-User Collaboration & Household Finances
- Enable shared budgets for couples or family members using Supabase Row-Level Security policies.
- Split transaction calculator for shared expenses (dining, groceries, rent).
