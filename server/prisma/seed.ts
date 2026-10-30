import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { DEFAULT_INCOME_CATEGORIES, DEFAULT_EXPENSE_CATEGORIES } from '../src/routes/categories.routes';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding PennyWise database...');

  // Clean existing demo user data
  const demoEmail = 'demo@pennywise.local';
  const existingUser = await prisma.user.findUnique({ where: { email: demoEmail } });
  if (existingUser) {
    await prisma.user.delete({ where: { id: existingUser.id } });
  }

  // 1. Create Demo User
  const passwordHash = await bcrypt.hash('pennywise_demo_2026', 10);
  const user = await prisma.user.create({
    data: {
      name: 'Chamara Silva',
      email: demoEmail,
      passwordHash,
      preferences: {
        create: {
          currency: 'LKR',
          dateFormat: 'YYYY-MM-DD',
          firstDayOfWeek: 1,
          largeTextMode: false,
          simplifiedMode: false,
          theme: 'light',
          budgetNotifications: true,
          billReminders: true,
        },
      },
    },
  });

  console.log(`👤 Created Demo User: ${user.name} (${user.email})`);

  // 2. Create Categories
  const categoryMap = new Map<string, string>();

  for (const cat of DEFAULT_INCOME_CATEGORIES) {
    const created = await prisma.category.create({
      data: {
        userId: user.id,
        name: cat.name,
        type: 'INCOME',
        icon: cat.icon,
        color: cat.color,
        isDefault: true,
      },
    });
    categoryMap.set(`INCOME:${cat.name}`, created.id);
  }

  for (const cat of DEFAULT_EXPENSE_CATEGORIES) {
    const created = await prisma.category.create({
      data: {
        userId: user.id,
        name: cat.name,
        type: 'EXPENSE',
        icon: cat.icon,
        color: cat.color,
        isDefault: true,
      },
    });
    categoryMap.set(`EXPENSE:${cat.name}`, created.id);
  }

  // 3. Create Accounts
  const cashAccount = await prisma.account.create({
    data: {
      userId: user.id,
      name: 'Cash Wallet',
      type: 'CASH',
      currency: 'LKR',
      openingBalance: 15000,
      description: 'Physical cash for daily transit and pocket expenses',
    },
  });

  const bankAccount = await prisma.account.create({
    data: {
      userId: user.id,
      name: 'Commercial Bank Savings',
      type: 'SAVINGS',
      currency: 'LKR',
      openingBalance: 185000,
      description: 'Primary salary and savings account',
    },
  });

  const digitalWallet = await prisma.account.create({
    data: {
      userId: user.id,
      name: 'FriMi Digital Wallet',
      type: 'DIGITAL_WALLET',
      currency: 'LKR',
      openingBalance: 12500,
      description: 'QR payments and food deliveries',
    },
  });

  // Set default account
  await prisma.userPreferences.update({
    where: { userId: user.id },
    data: { defaultAccountId: bankAccount.id },
  });

  // 4. Create Savings Goals
  const targetDate1 = new Date();
  targetDate1.setMonth(targetDate1.getMonth() + 4);

  const goal1 = await prisma.savingsGoal.create({
    data: {
      userId: user.id,
      accountId: bankAccount.id,
      name: 'New Work/Study Laptop',
      targetAmount: 250000,
      currentAmount: 165000,
      targetDate: targetDate1,
      description: 'Saving for an M-series MacBook or ThinkPad for freelance work',
      isCompleted: false,
    },
  });

  const targetDate2 = new Date();
  targetDate2.setMonth(targetDate2.getMonth() + 10);

  const goal2 = await prisma.savingsGoal.create({
    data: {
      userId: user.id,
      accountId: bankAccount.id,
      name: 'Emergency Rainy Day Fund',
      targetAmount: 500000,
      currentAmount: 220000,
      targetDate: targetDate2,
      description: '6 months of living expenses safety cushion',
      isCompleted: false,
    },
  });

  const goal3 = await prisma.savingsGoal.create({
    data: {
      userId: user.id,
      name: 'Family Holiday in Ella',
      targetAmount: 100000,
      currentAmount: 100000,
      targetDate: new Date(),
      description: 'Weekend vacation trip with family',
      isCompleted: true,
    },
  });

  await prisma.goalContribution.createMany({
    data: [
      { goalId: goal1.id, amount: 65000, note: 'Initial savings allocation' },
      { goalId: goal1.id, amount: 50000, note: 'Freelance project bonus' },
      { goalId: goal1.id, amount: 50000, note: 'Monthly disciplined savings' },
      { goalId: goal2.id, amount: 120000, note: 'Fixed deposit transfer' },
      { goalId: goal2.id, amount: 100000, note: 'Annual bonus deposit' },
      { goalId: goal3.id, amount: 100000, note: 'Final holiday fund goal achieved!' },
    ],
  });

  // 5. Create Monthly Budgets for Current Month
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  await prisma.budget.createMany({
    data: [
      {
        userId: user.id,
        categoryId: null, // Overall spending limit
        amount: 140000,
        month: currentMonth,
        year: currentYear,
        alertThreshold: 0.85,
      },
      {
        userId: user.id,
        categoryId: categoryMap.get('EXPENSE:Food and groceries'),
        amount: 45000,
        month: currentMonth,
        year: currentYear,
        alertThreshold: 0.8,
      },
      {
        userId: user.id,
        categoryId: categoryMap.get('EXPENSE:Transportation'),
        amount: 20000,
        month: currentMonth,
        year: currentYear,
        alertThreshold: 0.8,
      },
      {
        userId: user.id,
        categoryId: categoryMap.get('EXPENSE:Electricity and water'),
        amount: 15000,
        month: currentMonth,
        year: currentYear,
        alertThreshold: 0.9,
      },
      {
        userId: user.id,
        categoryId: categoryMap.get('EXPENSE:Communication and internet'),
        amount: 10000,
        month: currentMonth,
        year: currentYear,
        alertThreshold: 0.9,
      },
      {
        userId: user.id,
        categoryId: categoryMap.get('EXPENSE:Entertainment'),
        amount: 12000,
        month: currentMonth,
        year: currentYear,
        alertThreshold: 0.75,
      },
    ],
  });

  // 6. Create Upcoming & Recurring Bills
  const billDue1 = new Date();
  billDue1.setDate(billDue1.getDate() + 5);

  const billDue2 = new Date();
  billDue2.setDate(billDue2.getDate() + 12);

  const billDue3 = new Date();
  billDue3.setDate(billDue3.getDate() + 19);

  await prisma.bill.createMany({
    data: [
      {
        userId: user.id,
        name: 'CEB Electricity Bill',
        expectedAmount: 8450,
        dueDate: billDue1,
        frequency: 'MONTHLY',
        categoryId: categoryMap.get('EXPENSE:Electricity and water'),
        status: 'UNPAID',
      },
      {
        userId: user.id,
        name: 'Dialog Home Broadband Fiber',
        expectedAmount: 4990,
        dueDate: billDue2,
        frequency: 'MONTHLY',
        categoryId: categoryMap.get('EXPENSE:Communication and internet'),
        status: 'UNPAID',
      },
      {
        userId: user.id,
        name: 'Water Supply Board Bill',
        expectedAmount: 1850,
        dueDate: billDue3,
        frequency: 'MONTHLY',
        categoryId: categoryMap.get('EXPENSE:Electricity and water'),
        status: 'UNPAID',
      },
      {
        userId: user.id,
        name: 'Spotify & Cloud Subscription',
        expectedAmount: 3200,
        dueDate: new Date(now.getFullYear(), now.getMonth(), 5),
        frequency: 'MONTHLY',
        categoryId: categoryMap.get('EXPENSE:Entertainment'),
        status: 'PAID',
        lastPaidDate: new Date(now.getFullYear(), now.getMonth(), 5),
      },
    ],
  });

  // 7. Create Realistic Transactions
  // Previous month salary & expenses
  const prevMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 28);
  const prevSalary = await prisma.transaction.create({
    data: {
      userId: user.id,
      accountId: bankAccount.id,
      type: 'INCOME',
      amount: 175000,
      categoryId: categoryMap.get('INCOME:Salary'),
      date: prevMonthDate,
      description: 'Monthly Salary Credit',
      paymentMethod: 'ONLINE_TRANSFER',
      tags: 'salary,monthly',
    },
  });

  // Current month income
  const currSalaryDate = new Date(now.getFullYear(), now.getMonth(), 2);
  await prisma.transaction.create({
    data: {
      userId: user.id,
      accountId: bankAccount.id,
      type: 'INCOME',
      amount: 185000,
      categoryId: categoryMap.get('INCOME:Salary'),
      date: currSalaryDate,
      description: 'Monthly Salary Credit (Revised)',
      paymentMethod: 'ONLINE_TRANSFER',
      tags: 'salary,work',
    },
  });

  const freelanceDate = new Date(now.getFullYear(), now.getMonth(), 10);
  await prisma.transaction.create({
    data: {
      userId: user.id,
      accountId: bankAccount.id,
      type: 'INCOME',
      amount: 45000,
      categoryId: categoryMap.get('INCOME:Freelance work'),
      date: freelanceDate,
      description: 'Website UI redesign client milestone',
      paymentMethod: 'ONLINE_TRANSFER',
      tags: 'freelance,client',
    },
  });

  // Inter-account transfer: Bank to Cash Wallet
  const transferDate = new Date(now.getFullYear(), now.getMonth(), 4);
  await prisma.transaction.create({
    data: {
      userId: user.id,
      accountId: bankAccount.id,
      toAccountId: cashAccount.id,
      type: 'TRANSFER',
      amount: 10000,
      date: transferDate,
      description: 'ATM Cash Withdrawal for weekly pocket money',
      paymentMethod: 'BANK_CARD',
      tags: 'atm,cash',
    },
  });

  // Inter-account transfer: Bank to Digital Wallet
  const transferDate2 = new Date(now.getFullYear(), now.getMonth(), 6);
  await prisma.transaction.create({
    data: {
      userId: user.id,
      accountId: bankAccount.id,
      toAccountId: digitalWallet.id,
      type: 'TRANSFER',
      amount: 15000,
      date: transferDate2,
      description: 'Top-up FriMi wallet for food orders and transit',
      paymentMethod: 'ONLINE_TRANSFER',
      tags: 'topup',
    },
  });

  // Current month expenses
  const expensesData = [
    {
      acc: bankAccount.id,
      cat: 'EXPENSE:Food and groceries',
      amount: 14850,
      day: 3,
      desc: 'Keells Supermarket grocery basket & fresh produce',
      method: 'BANK_CARD',
      tags: 'groceries,keells',
    },
    {
      acc: digitalWallet.id,
      cat: 'EXPENSE:Food and groceries',
      amount: 3200,
      day: 5,
      desc: 'PickMe Food dinner order',
      method: 'DIGITAL_WALLET',
      tags: 'food,takeout',
    },
    {
      acc: cashAccount.id,
      cat: 'EXPENSE:Transportation',
      amount: 1500,
      day: 7,
      desc: 'Bus fare and highway express ticket',
      method: 'CASH',
      tags: 'transit,bus',
    },
    {
      acc: bankAccount.id,
      cat: 'EXPENSE:Transportation',
      amount: 7500,
      day: 9,
      desc: 'Petrol fuel pump refill (Ceypetco)',
      method: 'BANK_CARD',
      tags: 'fuel,car',
    },
    {
      acc: bankAccount.id,
      cat: 'EXPENSE:Entertainment',
      amount: 3200,
      day: 5,
      desc: 'Spotify and media subscriptions',
      method: 'ONLINE_TRANSFER',
      tags: 'subscriptions',
    },
    {
      acc: cashAccount.id,
      cat: 'EXPENSE:Food and groceries',
      amount: 850,
      day: 11,
      desc: 'Tea and bakeries with colleagues',
      method: 'CASH',
      tags: 'tea,snack',
    },
    {
      acc: bankAccount.id,
      cat: 'EXPENSE:Food and groceries',
      amount: 9200,
      day: 14,
      desc: 'Cargills Food City weekly restock',
      method: 'BANK_CARD',
      tags: 'groceries',
    },
    {
      acc: bankAccount.id,
      cat: 'EXPENSE:Health',
      amount: 4500,
      day: 16,
      desc: 'Pharmacy vitamins and routine medicine',
      method: 'BANK_CARD',
      tags: 'health,pharmacy',
    },
    {
      acc: digitalWallet.id,
      cat: 'EXPENSE:Transportation',
      amount: 1250,
      day: 18,
      desc: 'Uber tuk ride to Colombo city center',
      method: 'DIGITAL_WALLET',
      tags: 'uber,transit',
    },
    {
      acc: bankAccount.id,
      cat: 'EXPENSE:Shopping',
      amount: 6800,
      day: 20,
      desc: 'Clothing and office casual shirts',
      method: 'BANK_CARD',
      tags: 'clothing,shopping',
    },
    {
      acc: cashAccount.id,
      cat: 'EXPENSE:Personal care',
      amount: 1800,
      day: 22,
      desc: 'Haircut and salon visit',
      method: 'CASH',
      tags: 'personal-care',
    },
  ];

  for (const exp of expensesData) {
    const expenseDate = new Date(now.getFullYear(), now.getMonth(), exp.day);
    await prisma.transaction.create({
      data: {
        userId: user.id,
        accountId: exp.acc,
        type: 'EXPENSE',
        amount: exp.amount,
        categoryId: categoryMap.get(exp.cat),
        date: expenseDate,
        description: exp.desc,
        paymentMethod: exp.method,
        tags: exp.tags,
      },
    });
  }

  console.log('✅ Demo dataset created successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
