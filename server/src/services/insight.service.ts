import { prisma } from '../utils/prisma';
import { round2, formatCurrency } from '../utils/math';

export interface Insight {
  id: string;
  type: 'positive' | 'warning' | 'info';
  title: string;
  description: string;
  category?: string;
}

export async function generateInsights(userId: string): Promise<Insight[]> {
  const insights: Insight[] = [];

  // Get user preferences for currency
  const pref = await prisma.userPreferences.findUnique({
    where: { userId },
  });
  const currency = pref?.currency || 'LKR';

  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  // Current month date boundaries
  const startOfCurrentMonth = new Date(currentYear, currentMonth - 1, 1);
  const endOfCurrentMonth = new Date(currentYear, currentMonth, 0, 23, 59, 59, 999);

  // Previous month date boundaries
  const startOfPrevMonth = new Date(currentYear, currentMonth - 2, 1);
  const endOfPrevMonth = new Date(currentYear, currentMonth - 1, 0, 23, 59, 59, 999);

  // 1. Current month expenses and income
  const [currentExpensesAgg, currentIncomeAgg, prevExpensesAgg] = await Promise.all([
    prisma.transaction.aggregate({
      where: {
        userId,
        type: 'EXPENSE',
        date: { gte: startOfCurrentMonth, lte: endOfCurrentMonth },
      },
      _sum: { amount: true },
      _count: true,
    }),
    prisma.transaction.aggregate({
      where: {
        userId,
        type: 'INCOME',
        date: { gte: startOfCurrentMonth, lte: endOfCurrentMonth },
      },
      _sum: { amount: true },
    }),
    prisma.transaction.aggregate({
      where: {
        userId,
        type: 'EXPENSE',
        date: { gte: startOfPrevMonth, lte: endOfPrevMonth },
      },
      _sum: { amount: true },
      _count: true,
    }),
  ]);

  const currentExpenseTotal = currentExpensesAgg._sum.amount || 0;
  const currentIncomeTotal = currentIncomeAgg._sum.amount || 0;
  const prevExpenseTotal = prevExpensesAgg._sum.amount || 0;

  // Insight: Income vs Expenses comparison
  if (currentIncomeTotal > 0 && currentExpenseTotal > 0) {
    if (currentIncomeTotal > currentExpenseTotal) {
      const net = round2(currentIncomeTotal - currentExpenseTotal);
      insights.push({
        id: 'net-positive',
        type: 'positive',
        title: 'Positive Cash Flow',
        description: `Your recorded income (${formatCurrency(currentIncomeTotal, currency)}) is higher than your spending (${formatCurrency(currentExpenseTotal, currency)}) by ${formatCurrency(net, currency)} this month.`,
      });
    } else if (currentExpenseTotal > currentIncomeTotal) {
      const diff = round2(currentExpenseTotal - currentIncomeTotal);
      insights.push({
        id: 'net-negative',
        type: 'warning',
        title: 'Spending Exceeded Income',
        description: `Your spending this month exceeded your recorded income by ${formatCurrency(diff, currency)}. Consider reviewing non-essential expenses.`,
      });
    }
  }

  // 2. Largest spending category this month
  const categorySpending = await prisma.transaction.groupBy({
    by: ['categoryId'],
    where: {
      userId,
      type: 'EXPENSE',
      date: { gte: startOfCurrentMonth, lte: endOfCurrentMonth },
      categoryId: { not: null },
    },
    _sum: { amount: true },
    orderBy: {
      _sum: {
        amount: 'desc',
      },
    },
    take: 1,
  });

  if (categorySpending.length > 0 && categorySpending[0].categoryId) {
    const topCat = await prisma.category.findUnique({
      where: { id: categorySpending[0].categoryId },
    });
    const topAmount = categorySpending[0]._sum.amount || 0;
    if (topCat && currentExpenseTotal > 0) {
      const percentage = Math.round((topAmount / currentExpenseTotal) * 100);
      insights.push({
        id: 'top-spending-category',
        type: 'info',
        title: 'Top Expense Category',
        description: `${topCat.name} is your largest spending category this month at ${formatCurrency(topAmount, currency)} (${percentage}% of total expenses).`,
        category: topCat.name,
      });
    }
  }

  // 3. Category comparison with last month (e.g. transportation)
  const prevCategorySpending = await prisma.transaction.groupBy({
    by: ['categoryId'],
    where: {
      userId,
      type: 'EXPENSE',
      date: { gte: startOfPrevMonth, lte: endOfPrevMonth },
      categoryId: { not: null },
    },
    _sum: { amount: true },
  });

  for (const prevCat of prevCategorySpending) {
    if (!prevCat.categoryId) continue;
    const currentMatch = await prisma.transaction.aggregate({
      where: {
        userId,
        type: 'EXPENSE',
        categoryId: prevCat.categoryId,
        date: { gte: startOfCurrentMonth, lte: endOfCurrentMonth },
      },
      _sum: { amount: true },
    });

    const prevAmt = prevCat._sum.amount || 0;
    const currAmt = currentMatch._sum.amount || 0;

    if (prevAmt > 500 && currAmt < prevAmt) {
      const savedDiff = round2(prevAmt - currAmt);
      const catDetails = await prisma.category.findUnique({
        where: { id: prevCat.categoryId },
      });
      if (catDetails) {
        insights.push({
          id: `saved-on-${catDetails.id}`,
          type: 'positive',
          title: `Reduced Spending in ${catDetails.name}`,
          description: `You spent ${formatCurrency(savedDiff, currency)} less on ${catDetails.name.toLowerCase()} this month compared to last month.`,
          category: catDetails.name,
        });
        break; // Show one distinct category comparison
      }
    }
  }

  // 4. Budget usage insight
  const activeBudgets = await prisma.budget.findMany({
    where: {
      userId,
      month: currentMonth,
      year: currentYear,
      categoryId: { not: null },
    },
    include: {
      category: true,
    },
  });

  for (const budget of activeBudgets) {
    if (!budget.categoryId || !budget.category) continue;
    const spentAgg = await prisma.transaction.aggregate({
      where: {
        userId,
        type: 'EXPENSE',
        categoryId: budget.categoryId,
        date: { gte: startOfCurrentMonth, lte: endOfCurrentMonth },
      },
      _sum: { amount: true },
    });

    const spent = spentAgg._sum.amount || 0;
    const percentage = Math.round((spent / budget.amount) * 100);

    if (percentage >= 100) {
      insights.push({
        id: `budget-exceeded-${budget.id}`,
        type: 'warning',
        title: `${budget.category.name} Budget Exceeded`,
        description: `You have spent ${formatCurrency(spent, currency)}, reaching ${percentage}% of your ${formatCurrency(budget.amount, currency)} limit for ${budget.category.name}.`,
        category: budget.category.name,
      });
    } else if (percentage >= 75) {
      insights.push({
        id: `budget-warning-${budget.id}`,
        type: 'info',
        title: `${budget.category.name} Budget Approaching Limit`,
        description: `You have used ${percentage}% of your ${budget.category.name.toLowerCase()} budget (${formatCurrency(spent, currency)} of ${formatCurrency(budget.amount, currency)}).`,
        category: budget.category.name,
      });
    }
  }

  // 5. Savings Goal Milestone
  const activeGoals = await prisma.savingsGoal.findMany({
    where: { userId },
  });

  for (const goal of activeGoals) {
    const percent = Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100));
    if (goal.isCompleted || percent >= 100) {
      insights.push({
        id: `goal-complete-${goal.id}`,
        type: 'positive',
        title: `Goal Achieved: ${goal.name}`,
        description: `Congratulations! You've reached 100% of your target for "${goal.name}" (${formatCurrency(goal.targetAmount, currency)}).`,
      });
    } else if (percent >= 50) {
      insights.push({
        id: `goal-progress-${goal.id}`,
        type: 'positive',
        title: `Savings Milestone: ${goal.name}`,
        description: `You've reached ${percent}% of your goal for "${goal.name}" (${formatCurrency(goal.currentAmount, currency)} of ${formatCurrency(goal.targetAmount, currency)}).`,
      });
    }
  }

  return insights;
}
