import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/prisma';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

const preferencesSchema = z.object({
  currency: z.string().optional(),
  dateFormat: z.string().optional(),
  firstDayOfWeek: z.number().int().min(0).max(6).optional(),
  largeTextMode: z.boolean().optional(),
  simplifiedMode: z.boolean().optional(),
  theme: z.enum(['light', 'dark']).optional(),
  budgetNotifications: z.boolean().optional(),
  billReminders: z.boolean().optional(),
  defaultAccountId: z.string().optional().nullable(),
});

// Get user settings and preferences
router.get('/', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      include: { preferences: true },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    return res.json({
      name: user.name,
      email: user.email,
      preferences: user.preferences,
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to retrieve settings.' });
  }
});

// Update preferences
router.put('/preferences', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const parse = preferencesSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ error: parse.error.errors[0].message });
    }

    const updated = await prisma.userPreferences.upsert({
      where: { userId: req.userId! },
      update: parse.data,
      create: {
        userId: req.userId!,
        ...parse.data,
      },
    });

    return res.json({
      message: 'Preferences updated successfully!',
      preferences: updated,
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to update preferences.' });
  }
});

// Export all user data as JSON
router.get('/export-all', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId!;

    const [user, accounts, transactions, categories, budgets, savingsGoals, bills] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId }, include: { preferences: true } }),
      prisma.account.findMany({ where: { userId } }),
      prisma.transaction.findMany({ where: { userId } }),
      prisma.category.findMany({ where: { userId } }),
      prisma.budget.findMany({ where: { userId } }),
      prisma.savingsGoal.findMany({ where: { userId }, include: { contributions: true } }),
      prisma.bill.findMany({ where: { userId } }),
    ]);

    const backupData = {
      exportDate: new Date().toISOString(),
      user: {
        name: user?.name,
        email: user?.email,
        preferences: user?.preferences,
      },
      accounts,
      categories,
      transactions,
      budgets,
      savingsGoals,
      bills,
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="pennywise_data_backup_${new Date().toISOString().split('T')[0]}.json"`);
    return res.json(backupData);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to export user data.' });
  }
});

export default router;
