import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/prisma';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';
import { round2, safeAdd, safeSub, safeDiv } from '../utils/math';

const router = Router();

const goalSchema = z.object({
  name: z.string().min(1, 'Goal name is required'),
  targetAmount: z.number().positive('Target amount must be greater than zero'),
  currentAmount: z.number().min(0).default(0),
  targetDate: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  accountId: z.string().optional().nullable(),
});

const contributionSchema = z.object({
  amount: z.number(), // positive for deposit, negative for withdrawal
  date: z.string().optional(),
  note: z.string().optional().nullable(),
  accountId: z.string().optional().nullable(), // If money is moved from an account
});

// Helper: calculate monthly saving requirement
function calculateMonthlyNeeded(targetAmount: number, currentAmount: number, targetDate?: Date | null): number | null {
  if (!targetDate) return null;
  const remaining = safeSub(targetAmount, currentAmount);
  if (remaining <= 0) return 0;

  const now = new Date();
  const monthsDiff = (targetDate.getFullYear() - now.getFullYear()) * 12 + (targetDate.getMonth() - now.getMonth());
  const effectiveMonths = Math.max(1, monthsDiff);
  return safeDiv(remaining, effectiveMonths);
}

// List all savings goals
router.get('/', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const goals = await prisma.savingsGoal.findMany({
      where: { userId: req.userId },
      include: {
        account: { select: { id: true, name: true, currency: true } },
        contributions: {
          orderBy: { date: 'desc' },
          take: 10,
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const goalsWithCalculations = goals.map((g) => {
      const remainingAmount = Math.max(0, safeSub(g.targetAmount, g.currentAmount));
      const progressPercentage = g.targetAmount > 0
        ? Math.min(100, Math.round((g.currentAmount / g.targetAmount) * 100))
        : 0;
      const monthlyNeeded = calculateMonthlyNeeded(g.targetAmount, g.currentAmount, g.targetDate);

      return {
        ...g,
        remainingAmount,
        progressPercentage,
        monthlyNeeded,
      };
    });

    return res.json(goalsWithCalculations);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to retrieve savings goals.' });
  }
});

// Create savings goal
router.post('/', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const parse = goalSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ error: parse.error.errors[0].message });
    }

    const { name, targetAmount, currentAmount, targetDate, description, accountId } = parse.data;

    const goal = await prisma.savingsGoal.create({
      data: {
        userId: req.userId!,
        name,
        targetAmount: round2(targetAmount),
        currentAmount: round2(currentAmount),
        targetDate: targetDate ? new Date(targetDate) : null,
        description: description || null,
        accountId: accountId || null,
        isCompleted: currentAmount >= targetAmount,
      },
      include: { account: true },
    });

    // If initial currentAmount > 0, record initial contribution
    if (currentAmount > 0) {
      await prisma.goalContribution.create({
        data: {
          goalId: goal.id,
          amount: round2(currentAmount),
          note: 'Initial saved amount',
        },
      });
    }

    return res.status(201).json({
      message: 'Savings goal created!',
      goal,
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to create savings goal.' });
  }
});

// Update goal details
router.put('/:id', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const existing = await prisma.savingsGoal.findFirst({
      where: { id, userId: req.userId },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Savings goal not found.' });
    }

    const parse = goalSchema.partial().safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ error: parse.error.errors[0].message });
    }

    const data = parse.data;
    const newCurrent = data.currentAmount !== undefined ? round2(data.currentAmount) : existing.currentAmount;
    const newTarget = data.targetAmount !== undefined ? round2(data.targetAmount) : existing.targetAmount;

    const updated = await prisma.savingsGoal.update({
      where: { id },
      data: {
        ...(data.name ? { name: data.name } : {}),
        ...(data.targetAmount !== undefined ? { targetAmount: newTarget } : {}),
        ...(data.currentAmount !== undefined ? { currentAmount: newCurrent } : {}),
        ...(data.targetDate !== undefined ? { targetDate: data.targetDate ? new Date(data.targetDate) : null } : {}),
        ...(data.description !== undefined ? { description: data.description } : {}),
        ...(data.accountId !== undefined ? { accountId: data.accountId } : {}),
        isCompleted: newCurrent >= newTarget,
      },
    });

    return res.json(updated);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to update savings goal.' });
  }
});

// Contribute or withdraw from a goal
router.post('/:id/contribute', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const parse = contributionSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ error: parse.error.errors[0].message });
    }

    const { amount, date, note } = parse.data;

    const goal = await prisma.savingsGoal.findFirst({
      where: { id, userId: req.userId },
    });

    if (!goal) {
      return res.status(404).json({ error: 'Savings goal not found.' });
    }

    const newCurrent = round2(Math.max(0, safeAdd(goal.currentAmount, amount)));
    const isCompleted = newCurrent >= goal.targetAmount;

    // Record contribution
    const contribution = await prisma.goalContribution.create({
      data: {
        goalId: goal.id,
        amount: round2(amount),
        date: date ? new Date(date) : new Date(),
        note: note || (amount >= 0 ? 'Added money to goal' : 'Withdrew money from goal'),
      },
    });

    // Update goal
    const updatedGoal = await prisma.savingsGoal.update({
      where: { id },
      data: {
        currentAmount: newCurrent,
        isCompleted,
      },
      include: {
        account: true,
        contributions: { orderBy: { date: 'desc' }, take: 5 },
      },
    });

    return res.json({
      message: amount >= 0 ? `Successfully added to ${goal.name}!` : `Withdrew from ${goal.name}.`,
      goal: updatedGoal,
      contribution,
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to process contribution.' });
  }
});

// Delete goal
router.delete('/:id', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const existing = await prisma.savingsGoal.findFirst({
      where: { id, userId: req.userId },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Savings goal not found.' });
    }

    await prisma.savingsGoal.delete({ where: { id } });
    return res.json({ message: 'Savings goal deleted.' });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to delete goal.' });
  }
});

export default router;
