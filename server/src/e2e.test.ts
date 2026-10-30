import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app, server } from './index';
import { prisma } from './utils/prisma';

describe('PennyWise End-to-End API Integration', () => {
  let token: string;
  let testUserId: string;
  let cashAccountId: string;
  let bankAccountId: string;
  let expenseCategoryId: string;

  beforeAll(async () => {
    // 1. Health check
    const health = await request(app).get('/api/health');
    expect(health.status).toBe(200);
    expect(health.body.status).toBe('ok');

    // 2. Demo Sandbox Login
    const demoRes = await request(app).post('/api/auth/demo');
    expect(demoRes.status).toBe(200);
    expect(demoRes.body.token).toBeDefined();
    expect(demoRes.body.user.email).toBe('demo@pennywise.local');

    // 3. Register a test user for isolated test flow
    const email = `e2e_${Date.now()}@pennywise.local`;
    const regRes = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'E2E Test User',
        email,
        password: 'password123',
        currency: 'LKR',
      });

    expect(regRes.status).toBe(201);
    token = regRes.body.token;
    testUserId = regRes.body.user.id;

    // Get accounts created during registration
    const accs = await request(app)
      .get('/api/accounts')
      .set('Authorization', `Bearer ${token}`);
    expect(accs.status).toBe(200);
    expect(accs.body.length).toBeGreaterThanOrEqual(2);
    cashAccountId = accs.body.find((a: any) => a.type === 'CASH').id;
    bankAccountId = accs.body.find((a: any) => a.type === 'SAVINGS').id;

    // Get default categories
    const cats = await request(app)
      .get('/api/categories?type=EXPENSE')
      .set('Authorization', `Bearer ${token}`);
    expect(cats.status).toBe(200);
    expenseCategoryId = cats.body[0].id;
  });

  afterAll(async () => {
    if (testUserId) {
      await prisma.user.delete({ where: { id: testUserId } });
    }
    server.close();
  });

  it('records income and calculates positive cash flow', async () => {
    const res = await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${token}`)
      .send({
        type: 'INCOME',
        amount: 150000,
        accountId: bankAccountId,
        description: 'Monthly Salary Credit',
        paymentMethod: 'ONLINE_TRANSFER',
      });

    expect(res.status).toBe(201);
    expect(res.body.transaction.amount).toBe(150000);

    const summary = await request(app)
      .get('/api/transactions/summary')
      .set('Authorization', `Bearer ${token}`);

    expect(summary.status).toBe(200);
    expect(summary.body.income).toBe(150000);
    expect(summary.body.expenses).toBe(0);
    expect(summary.body.netCashFlow).toBe(150000);
  });

  it('records an expense and updates net cash flow & account balance', async () => {
    const res = await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${token}`)
      .send({
        type: 'EXPENSE',
        amount: 25000,
        accountId: bankAccountId,
        categoryId: expenseCategoryId,
        description: 'Monthly Groceries & Produce',
        paymentMethod: 'BANK_CARD',
      });

    expect(res.status).toBe(201);

    const summary = await request(app)
      .get('/api/transactions/summary')
      .set('Authorization', `Bearer ${token}`);

    expect(summary.body.income).toBe(150000);
    expect(summary.body.expenses).toBe(25000);
    expect(summary.body.netCashFlow).toBe(125000);
  });

  it('performs an inter-account transfer without altering income, expenses, or combined net worth', async () => {
    const transferRes = await request(app)
      .post('/api/accounts/transfer')
      .set('Authorization', `Bearer ${token}`)
      .send({
        fromAccountId: bankAccountId,
        toAccountId: cashAccountId,
        amount: 10000,
        description: 'ATM Cash Withdrawal',
      });

    expect(transferRes.status).toBe(201);

    // Verify summary: income, expenses, and total balance must remain invariant to internal transfers!
    const summary = await request(app)
      .get('/api/transactions/summary')
      .set('Authorization', `Bearer ${token}`);

    expect(summary.body.income).toBe(150000);
    expect(summary.body.expenses).toBe(25000);
    expect(summary.body.netCashFlow).toBe(125000);
    expect(summary.body.totalBalance).toBe(125000); // 150000 - 25000

    // Check individual account balances
    const accs = await request(app)
      .get('/api/accounts')
      .set('Authorization', `Bearer ${token}`);

    const bank = accs.body.find((a: any) => a.id === bankAccountId);
    const cash = accs.body.find((a: any) => a.id === cashAccountId);

    expect(bank.currentBalance).toBe(115000); // 150k - 25k - 10k transfer
    expect(cash.currentBalance).toBe(10000); // 0 + 10k transfer
  });

  it('manages budgets and tracks envelope spending', async () => {
    const now = new Date();
    const saveRes = await request(app)
      .post('/api/budgets')
      .set('Authorization', `Bearer ${token}`)
      .send({
        categoryId: expenseCategoryId,
        amount: 30000,
        month: now.getMonth() + 1,
        year: now.getFullYear(),
        alertThreshold: 0.8,
      });

    expect(saveRes.status).toBe(201);

    const budgetsRes = await request(app)
      .get('/api/budgets')
      .set('Authorization', `Bearer ${token}`);

    expect(budgetsRes.status).toBe(200);
    const budget = budgetsRes.body.budgets.find((b: any) => b.categoryId === expenseCategoryId);
    expect(budget).toBeDefined();
    expect(budget.amount).toBe(30000);
    expect(budget.spent).toBe(25000);
    expect(budget.remaining).toBe(5000);
    expect(budget.isNearLimit).toBe(true); // 25k / 30k = 83% >= 80%
    expect(budget.isExceeded).toBe(false);
  });

  it('creates savings goals and records deposits/withdrawals', async () => {
    const goalRes = await request(app)
      .post('/api/savings')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'New Laptop',
        targetAmount: 200000,
        currentAmount: 50000,
      });

    expect(goalRes.status).toBe(201);
    const goalId = goalRes.body.goal.id;

    // Contribute 25,000 to the goal
    const contribRes = await request(app)
      .post(`/api/savings/${goalId}/contribute`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        amount: 25000,
        note: 'Freelance bonus deposit',
      });

    expect(contribRes.status).toBe(200);
    expect(contribRes.body.goal.currentAmount).toBe(75000);
  });

  it('manages bills and marks bills as paid', async () => {
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 10);

    const billRes = await request(app)
      .post('/api/bills')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Electricity CEB',
        expectedAmount: 6500,
        dueDate: dueDate.toISOString().split('T')[0],
        frequency: 'MONTHLY',
      });

    expect(billRes.status).toBe(201);
    const billId = billRes.body.bill.id;

    // Mark as paid
    const payRes = await request(app)
      .post(`/api/bills/${billId}/pay`)
      .set('Authorization', `Bearer ${token}`)
      .send({ recordExpense: false });

    expect(payRes.status).toBe(200);
  });

  it('generates reports and automated insights', async () => {
    const repRes = await request(app)
      .get('/api/reports')
      .set('Authorization', `Bearer ${token}`);

    expect(repRes.status).toBe(200);
    expect(repRes.body.monthlyTrends).toBeDefined();
    expect(repRes.body.insights).toBeDefined();
  });
});
