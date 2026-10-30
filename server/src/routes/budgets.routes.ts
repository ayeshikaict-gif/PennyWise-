import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/prisma';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';
import { round2, safeSub } from '../utils/math';

const router = Router();

const budgetSchema = z.object({
  categoryId: z.string().optional().nullable(), // null = overall monthly limit
  amount: z.number().positive('Budget limit must be greater than zero'),
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2020).max(2100),
  alertThreshold: z.number().min(0.1).max(1.0).default(0.8),
});

// Get budgets for a given month and year with actual spending calculations
router.get('/', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const now = new Date();
    const month = req.query.month ? parseInt(req.query.month as string, 10) : now.getMonth() + 1;
    const year = req.query.year ? parseInt(req.query.year as string, 10) : now.getFullYear();

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    const budgets = await prisma.budget.findMany({
      where: {
        userId: req.userId,
        month,
        year,
      },
      include: {
        category: true,
      },
      orderBy: { amount: 'desc' },
    });

    // Calculate actual spending for each budget
    const budgetsWithSpending = await Promise.all(
      budgets.map(async (b) => {
        let spent = 0;
        if (b.categoryId) {
          const expenseAgg = await prisma.transaction.aggregate({
            where: {
              userId: req.userId,
              categoryId: b.categoryId,
              type: 'EXPENSE',
              date: { gte: startDate, lte: endDate },
            },
            _sum: { amount: true },
          });
          spent = expenseAgg._sum.amount || 0;
        } else {
          // Overall spending
          const overallExpenseAgg = await prisma.transaction.aggregate({
            where: {
              userId: req.userId,
              type: 'EXPENSE',
              date: { gte: startDate, lte: endDate },
            },
            _sum: { amount: true },
          });
          spent = overallExpenseAgg._sum.amount || 0;
        }

        const remaining = safeSub(b.amount, spent);
        const percentUsed = b.amount > 0 ? Math.round((spent / b.amount) * 100) : 0;
        const isExceeded = spent > b.amount;
        const isNearLimit = !isExceeded && percentUsed >= b.alertThreshold * 100;

        return {
          ...b,
          spent: round2(spent),
          remaining: round2(remaining),
          percentUsed,
          isExceeded,
          isNearLimit,
        };
      })
    );

    return res.json({
      month,
      year,
      budgets: budgetsWithSpending,
    });
  } catch (error) {
    console.error('Budgets error:', error);
    return res.status(500).json({ error: 'Failed to retrieve budgets.' });
  }
});

// Create or update (upsert) budget
router.post('/', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const parse = budgetSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ error: parse.error.errors[0].message });
    }

    const { categoryId, amount, month, year, alertThreshold } = parse.data;

    // Check if budget exists for this user + category + month + year
    const existing = await prisma.budget.findFirst({
      where: {
        userId: req.userId,
        categoryId: categoryId || null,
        month,
        year,
      },
    });

    let budget;
    if (existing) {
      budget = await prisma.budget.update({
        where: { id: existing.id },
        data: {
          amount: round2(amount),
          alertThreshold,
        },
        include: { category: true },
      });
    } else {
      budget = await prisma.budget.create({
        data: {
          userId: req.userId!,
          categoryId: categoryId || null,
          amount: round2(amount),
          month,
          year,
          alertThreshold,
        },
        include: { category: true },
      });
    }

    return res.status(201).json({
      message: 'Budget saved successfully!',
      budget,
    });
  } catch (error) {
    console.error('Save budget error:', error);
    return res.status(500).json({ error: 'Failed to save budget.' });
  }
});

// Copy previous month's budgets to current/target month
router.post('/copy', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { fromMonth, fromYear, toMonth, toYear } = req.body;
    if (!fromMonth || !fromYear || !toMonth || !toYear) {
      return res.status(400).json({ error: 'Source and target month/year are required.' });
    }

    const sourceBudgets = await prisma.budget.findMany({
      where: {
        userId: req.userId,
        month: parseInt(fromMonth, 10),
        year: parseInt(fromYear, 10),
      },
    });

    if (sourceBudgets.length === 0) {
      return res.status(404).json({ error: 'No budgets found to copy from the selected month.' });
    }

    let copiedCount = 0;
    for (const b of sourceBudgets) {
      const existing = await prisma.budget.findFirst({
        where: {
          userId: req.userId,
          categoryId: b.categoryId,
          month: parseInt(toMonth, 10),
          year: parseInt(toYear, 10),
        },
      });

      if (!existing) {
        await prisma.budget.create({
          data: {
            userId: req.userId!,
            categoryId: b.categoryId,
            amount: b.amount,
            month: parseInt(toMonth, 10),
            year: parseInt(toYear, 10),
            alertThreshold: b.alertThreshold,
          },
        });
        copiedCount++;
      }
    }

    return res.json({
      message: `Copied ${copiedCount} budget limit(s) to ${toMonth}/${toYear}.`,
      copiedCount,
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to copy budgets.' });
  }
});

// Delete budget
router.delete('/:id', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const existing = await prisma.budget.findFirst({
      where: { id, userId: req.userId },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Budget not found.' });
    }

    await prisma.budget.delete({ where: { id } });
    return res.json({ message: 'Budget deleted successfully.' });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to delete budget.' });
  }
});

export default router;
