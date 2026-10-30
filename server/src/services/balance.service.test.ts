import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '../utils/prisma';
import { calculateAccountBalance, getOverviewMetrics } from './balance.service';

describe('Balance & Overview Financial Calculations', () => {
  let testUserId: string;
  let testAccountId1: string;
  let testAccountId2: string;

  beforeAll(async () => {
    // Create test user and accounts
    const testUser = await prisma.user.create({
      data: {
        name: 'Test Calc User',
        email: `test_calc_${Date.now()}@test.local`,
        passwordHash: 'dummyhash',
        preferences: {
          create: {
            currency: 'LKR',
          },
        },
      },
    });
    testUserId = testUser.id;

    const acc1 = await prisma.account.create({
      data: {
        userId: testUserId,
        name: 'Test Checking',
        type: 'CURRENT',
        openingBalance: 10000,
      },
    });
    testAccountId1 = acc1.id;

    const acc2 = await prisma.account.create({
      data: {
        userId: testUserId,
        name: 'Test Savings',
        type: 'SAVINGS',
        openingBalance: 5000,
      },
    });
    testAccountId2 = acc2.id;
  });

  afterAll(async () => {
    if (testUserId) {
      await prisma.user.delete({ where: { id: testUserId } });
    }
  });

  it('calculates initial balance based on opening balance', async () => {
    const bal1 = await calculateAccountBalance(testAccountId1);
    const bal2 = await calculateAccountBalance(testAccountId2);
    expect(bal1).toBe(10000);
    expect(bal2).toBe(5000);
  });

  it('correctly updates balance after income and expense', async () => {
    // Add income of 25,000 to acc1
    await prisma.transaction.create({
      data: {
        userId: testUserId,
        accountId: testAccountId1,
        type: 'INCOME',
        amount: 25000,
        date: new Date(),
        description: 'Test Income',
      },
    });

    // Add expense of 8,000 to acc1
    await prisma.transaction.create({
      data: {
        userId: testUserId,
        accountId: testAccountId1,
        type: 'EXPENSE',
        amount: 8000,
        date: new Date(),
        description: 'Test Expense',
      },
    });

    // Balance should be: 10,000 + 25,000 - 8,000 = 27,000
    const bal1 = await calculateAccountBalance(testAccountId1);
    expect(bal1).toBe(27000);
  });

  it('handles inter-account transfers without altering net income/expense or combined balance', async () => {
    const initialBal1 = await calculateAccountBalance(testAccountId1); // 27,000
    const initialBal2 = await calculateAccountBalance(testAccountId2); // 5,000
    const combinedBefore = initialBal1 + initialBal2; // 32,000

    // Transfer 7,000 from acc1 to acc2
    await prisma.transaction.create({
      data: {
        userId: testUserId,
        accountId: testAccountId1,
        toAccountId: testAccountId2,
        type: 'TRANSFER',
        amount: 7000,
        date: new Date(),
        description: 'Inter-account transfer test',
      },
    });

    const newBal1 = await calculateAccountBalance(testAccountId1);
    const newBal2 = await calculateAccountBalance(testAccountId2);

    expect(newBal1).toBe(20000); // 27,000 - 7,000
    expect(newBal2).toBe(12000); // 5,000 + 7,000
    expect(newBal1 + newBal2).toBe(combinedBefore); // Combined total balance remains identical!

    // Verify overview metrics: transfers must NOT be counted as income or expenses!
    const start = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const end = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0, 23, 59, 59);
    const overview = await getOverviewMetrics(testUserId, start, end);

    expect(overview.income).toBe(25000); // Only the 25,000 income, NOT the 7,000 transfer
    expect(overview.expenses).toBe(8000); // Only the 8,000 expense, NOT the 7,000 transfer
    expect(overview.netCashFlow).toBe(17000); // 25,000 - 8,000
    expect(overview.totalBalance).toBe(32000);
  });
});
