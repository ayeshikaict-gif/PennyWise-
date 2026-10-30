# PennyWise — Personal Finance Dashboard 💰

> **"Make managing money as easy as sending a message."**

PennyWise is a modern, responsive, highly accessible Personal Finance Dashboard designed for everyone — students managing allowances, employees budgeting salaries, parents running households, freelancers handling irregular income, and retirees managing pensions.

---

## 🌟 Key Features

### 1. Overview Dashboard (The 5 Core Answers)
- **Total Balance**: Combined balance across your cash wallets and bank accounts.
- **Income (Money In)**: Total earnings received in the selected period (this week, this month, last month, this year).
- **Expenses (Money Out)**: Total expenses recorded in the period.
- **Safe to Spend**: An intelligent estimate of your remaining spending allowance after accounting for upcoming unpaid bills and reserved budget commitments, with an informative breakdown explanation.
- **Savings Progress**: Total progress across all your active savings milestones.

### 2. Quick 1-Click Transaction Entry
- Instant shortcuts for frequent daily expenses (**Coffee/Tea**, **Groceries**, **Transit/Bus**, **Fuel**, **Lunch**, **Salary**).
- Tabbed entry for **Money Out (Expenses)**, **Money In (Income)**, and **Internal Transfers**.
- Clean currency auto-formatting, date defaults to today, and optional notes/tags/payment methods.

### 3. Strict Financial Integrity Rules
- **Internal Transfers Invariance**: Inter-account transfers (e.g., ATM withdrawal from Bank to Cash Wallet) debit the source account and credit the destination account. They **NEVER** count as income or expense in reports or dashboard totals.
- **Precise Decimal Math**: Floating-point drift (e.g., `0.1 + 0.2 = 0.30000000000000004`) is strictly prevented via cent-level rounding and precision utilities.

### 4. Envelopes & Budget Management
- Overall monthly spending ceiling and category-specific budget envelopes.
- Clear visual indicators: **Green (< 80%)**, **Amber (80–99%)**, and **Red (100%+)**.
- Exceeding a budget displays gentle warnings without ever blocking your transactions ("You decide how to manage your money").
- **1-Click Copy**: Copy budget envelopes from previous months to the current month in one click.

### 5. Friendly Savings Goals
- Set targets for laptops, vacations, emergency rainy-day cushions, or tuition.
- Visual percentage bars and target date countdowns.
- Automated calculation of **Recommended Monthly Savings** to reach goals on time.
- Add and withdraw money modal with audit logs.

### 6. Accounts & Multi-Wallet Tracking
- Track **Cash Pocket**, **Savings Accounts**, **Current Accounts**, and **Digital Wallets**.
- Exclude specific accounts (e.g. separate business accounts) from total dashboard net worth.
- Archive old accounts without losing historical transaction records.

### 7. Bills & Payment Reminders
- Schedule recurring bills (Electricity, Water, Fiber Internet, Subscriptions).
- One-click **"Mark as Paid"** with optional automatic expense transaction logging to keep account balances synchronized.
- Overdue and upcoming payment warning badges.

### 8. Reports & Automated Insights
- 6-month historical cash flow trends and category distribution charts.
- **Automated Plain-Language Insights**:
  - *"Your recorded income was higher than your spending by Rs. 35,000 this month."*
  - *"Food and groceries is your largest spending category this month (34%)."*
  - *"You have used 83% of your Transportation budget."*
- **Printable Statements**: Clean print-media layout ready for PDF export or paper printing.
- **CSV Data Export**: Download transaction history filtered by date or type.

### 9. Accessibility For All Ages
- **Comfortable Text Size (A+)**: Header toggle for larger, readable typography.
- **Simplified Easy Mode**: Streamlined view with 5 primary sections, larger controls, and zero banking jargon ("Money In", "Money Out", "Safe to Spend").
- **Theme Support**: Clean Light neutral theme with emerald accents and Dark theme.
- **Instant Demo Sandbox Mode**: Explore with pre-seeded realistic Sri Lankan data (LKR Rs.) in 1 click without registration.

---

## 🛠️ Tech Stack & Architecture

- **Frontend**: React 18, TypeScript, Tailwind CSS, Lucide React icons, Recharts.
- **Backend API**: Node.js, Express, TypeScript, Prisma ORM.
- **Database**: SQLite (out-of-the-box zero setup) with full relational normalization (foreign keys, cascading deletes, indexes). Compatible with PostgreSQL via Prisma connection string.
- **Security**: JWT authentication, bcryptjs password hashing, server-side Zod validation.
- **Testing**: Vitest test runner with automated calculation unit tests and full End-to-End API tests.

---

## 🚀 Quick Start Guide

### Prerequisites
- Node.js (v18 or higher)
- npm (v9 or higher)

### Installation

1. **Clone the repository and install dependencies:**
   ```bash
   cd Finance_Dashboard
   npm run install:all
   ```

2. **Initialize Database and Seed Demo Data:**
   ```bash
   cd server
   npx prisma db push
   npm run seed
   ```

3. **Start the Application:**
   ```bash
   # From root directory:
   npm run dev
   ```
   Or run the unified built server:
   ```bash
   cd server
   npm start
   ```

4. **Open in Browser:**
   - **Frontend App**: `http://localhost:3000` (Vite dev) or `http://localhost:5000` (Full-stack)
   - **Backend API**: `http://localhost:5000/api/health`

---

## 🧪 Running Automated Tests

Run the Vitest test suite covering financial precision arithmetic, transfer isolation, budget thresholds, and E2E endpoints:

```bash
cd server
npm test
```

Result:
```text
✓ src/utils/math.test.ts (5 tests)
✓ src/services/balance.service.test.ts (3 tests)
✓ src/e2e.test.ts (7 tests)

Test Files  3 passed (3)
Tests       15 passed (15)
```

---

## 👤 Instant Demo Credentials

For quick evaluation without registering:
- Click **"Launch 1-Click Demo Sandbox"** on the login screen.
- Or log in manually:
  - **Email**: `demo@pennywise.local`
  - **Password**: `pennywise_demo_2026`

Pre-seeded with:
- **Accounts**: Cash Wallet (Rs. 15,000), Commercial Bank Savings (Rs. 185,000), FriMi Digital Wallet (Rs. 12,500).
- **35+ Transactions**: Salaries, freelance UI projects, Keells groceries, fuel, Uber rides, subscriptions.
- **Budgets**: Food & Groceries (Rs. 45,000), Transport (Rs. 20,000), Electricity & Water (Rs. 15,000).
- **Savings Goals**: Work/Study Laptop (Target Rs. 250,000), Emergency Fund (Target Rs. 500,000).
- **Upcoming Bills**: CEB Electricity, Dialog Home Broadband, National Water Board.

---

## 📄 License
MIT © PennyWise Team
