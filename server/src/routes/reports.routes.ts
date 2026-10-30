import { Router, Response } from 'express';
import { prisma } from '../utils/prisma';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';
import { round2 } from '../utils/math';
import { generateInsights } from '../services/insight.service';

const router = Router();

// Get aggregated reports data
router.get('/', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { startDate, endDate, accountId } = req.query;

    const start = startDate ? new Date(startDate as string) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const end = endDate ? new Date(endDate as string) : new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0, 23, 59, 59, 999);

    const whereBase: any = {
      userId: req.userId,
      date: { gte: start, lte: end },
    };
    if (accountId && typeof accountId === 'string') {
      whereBase.accountId = accountId;
    }

    // 1. Category breakdown (Expenses)
    const expenseCategories = await prisma.transaction.groupBy({
      by: ['categoryId'],
      where: {
        ...whereBase,
        type: 'EXPENSE',
        categoryId: { not: null },
      },
      _sum: { amount: true },
      _count: true,
      orderBy: { _sum: { amount: 'desc' } },
    });

    const categoryBreakdown = await Promise.all(
      expenseCategories.map(async (item) => {
        const cat = await prisma.category.findUnique({
          where: { id: item.categoryId! },
        });
        return {
          categoryId: item.categoryId,
          name: cat?.name || 'Uncategorized',
          color: cat?.color || '#94A3B8',
          icon: cat?.icon || 'tag',
          amount: round2(item._sum.amount || 0),
          count: item._count,
        };
      })
    );

    // 2. Income breakdown
    const incomeCategories = await prisma.transaction.groupBy({
      by: ['categoryId'],
      where: {
        ...whereBase,
        type: 'INCOME',
        categoryId: { not: null },
      },
      _sum: { amount: true },
      _count: true,
      orderBy: { _sum: { amount: 'desc' } },
    });

    const incomeBreakdown = await Promise.all(
      incomeCategories.map(async (item) => {
        const cat = await prisma.category.findUnique({
          where: { id: item.categoryId! },
        });
        return {
          categoryId: item.categoryId,
          name: cat?.name || 'Uncategorized',
          color: cat?.color || '#10B981',
          icon: cat?.icon || 'briefcase',
          amount: round2(item._sum.amount || 0),
          count: item._count,
        };
      })
    );

    // 3. Monthly trend (last 6 months)
    const monthlyTrends: Array<{
      monthLabel: string;
      income: number;
      expenses: number;
      net: number;
    }> = [];

    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const mStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
      const mEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0, 23, 59, 59, 999);
      const monthLabel = mStart.toLocaleString('default', { month: 'short', year: 'numeric' });

      const [incAgg, expAgg] = await Promise.all([
        prisma.transaction.aggregate({
          where: {
            userId: req.userId,
            type: 'INCOME',
            date: { gte: mStart, lte: mEnd },
          },
          _sum: { amount: true },
        }),
        prisma.transaction.aggregate({
          where: {
            userId: req.userId,
            type: 'EXPENSE',
            date: { gte: mStart, lte: mEnd },
          },
          _sum: { amount: true },
        }),
      ]);

      const inc = round2(incAgg._sum.amount || 0);
      const exp = round2(expAgg._sum.amount || 0);
      monthlyTrends.push({
        monthLabel,
        income: inc,
        expenses: exp,
        net: round2(inc - exp),
      });
    }

    // 4. Automated insights
    const insights = await generateInsights(req.userId!);

    return res.json({
      startDate: start,
      endDate: end,
      categoryBreakdown,
      incomeBreakdown,
      monthlyTrends,
      insights,
    });
  } catch (error) {
    console.error('Reports error:', error);
    return res.status(500).json({ error: 'Failed to generate report.' });
  }
});

// CSV Export endpoint
router.get('/export-csv', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { startDate, endDate, type } = req.query;

    const where: any = { userId: req.userId };
    if (type && typeof type === 'string' && ['INCOME', 'EXPENSE', 'TRANSFER'].includes(type.toUpperCase())) {
      where.type = type.toUpperCase();
    }
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate as string);
      if (endDate) where.date.lte = new Date(endDate as string);
    }

    const transactions = await prisma.transaction.findMany({
      where,
      include: {
        account: true,
        toAccount: true,
        category: true,
      },
      orderBy: { date: 'desc' },
    });

    // Generate CSV string
    const headers = ['Date', 'Type', 'Amount', 'Account', 'Category', 'Description', 'Payment Method', 'Notes', 'Tags'];
    const rows = transactions.map((t) => [
      t.date.toISOString().split('T')[0],
      t.type,
      t.amount.toFixed(2),
      t.account.name,
      t.type === 'TRANSFER' ? `Transfer to ${t.toAccount?.name || 'Account'}` : (t.category?.name || 'Uncategorized'),
      `"${(t.description || '').replace(/"/g, '""')}"`,
      t.paymentMethod || '',
      `"${(t.notes || '').replace(/"/g, '""')}"`,
      `"${(t.tags || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="pennywise_transactions_${new Date().toISOString().split('T')[0]}.csv"`);
    return res.send(csvContent);
  } catch (error) {
    console.error('CSV export error:', error);
    return res.status(500).json({ error: 'Failed to export CSV.' });
  }
});

export default router;
