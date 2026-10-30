import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/prisma';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';
import { round2 } from '../utils/math';
import { getOverviewMetrics } from '../services/balance.service';

const router = Router();

const transactionSchema = z.object({
  type: z.enum(['INCOME', 'EXPENSE', 'TRANSFER']),
  amount: z.number().positive('Amount must be greater than zero'),
  accountId: z.string().min(1, 'Account is required'),
  categoryId: z.string().optional().nullable(),
  date: z.string().optional(),
  description: z.string().optional().nullable(),
  paymentMethod: z.string().default('CASH'),
  toAccountId: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  tags: z.string().optional().nullable(),
  isRecurring: z.boolean().default(false),
  recurringPeriod: z.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY']).optional().nullable(),
});

// List transactions with filtering, search, and pagination
router.get('/', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      type,
      accountId,
      categoryId,
      startDate,
      endDate,
      search,
      sortBy = 'date',
      sortOrder = 'desc',
      page = '1',
      limit = '50',
    } = req.query;

    const pageNum = parseInt(page as string, 10) || 1;
    const limitNum = parseInt(limit as string, 10) || 50;
    const skip = (pageNum - 1) * limitNum;

    const where: any = {
      userId: req.userId,
    };

    if (type && typeof type === 'string' && ['INCOME', 'EXPENSE', 'TRANSFER'].includes(type.toUpperCase())) {
      where.type = type.toUpperCase();
    }

    if (accountId && typeof accountId === 'string') {
      where.OR = [
        { accountId },
        { toAccountId: accountId },
      ];
    }

    if (categoryId && typeof categoryId === 'string') {
      where.categoryId = categoryId;
    }

    if (startDate || endDate) {
      where.date = {};
      if (startDate && typeof startDate === 'string') {
        where.date.gte = new Date(startDate);
      }
      if (endDate && typeof endDate === 'string') {
        where.date.lte = new Date(endDate);
      }
    }

    if (search && typeof search === 'string') {
      const searchNum = parseFloat(search);
      const isNum = !isNaN(searchNum);

      where.AND = [
        ...(where.AND || []),
        {
          OR: [
            { description: { contains: search } },
            { notes: { contains: search } },
            { tags: { contains: search } },
            ...(isNum ? [{ amount: searchNum }] : []),
          ],
        },
      ];
    }

    // Determine sort
    let orderBy: any = { date: 'desc' };
    if (sortBy === 'amount') {
      orderBy = { amount: sortOrder === 'asc' ? 'asc' : 'desc' };
    } else if (sortBy === 'date') {
      orderBy = { date: sortOrder === 'asc' ? 'asc' : 'desc' };
    }

    const [totalCount, transactions] = await Promise.all([
      prisma.transaction.count({ where }),
      prisma.transaction.findMany({
        where,
        include: {
          account: { select: { id: true, name: true, currency: true, type: true } },
          toAccount: { select: { id: true, name: true, currency: true, type: true } },
          category: { select: { id: true, name: true, icon: true, color: true } },
        },
        orderBy,
        skip,
        take: limitNum,
      }),
    ]);

    return res.json({
      data: transactions,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limitNum),
      },
    });
  } catch (error) {
    console.error('Transactions list error:', error);
    return res.status(500).json({ error: 'Failed to fetch transactions.' });
  }
});

// Get overview summary metrics
router.get('/summary', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { startDate, endDate } = req.query;

    const start = startDate ? new Date(startDate as string) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const end = endDate ? new Date(endDate as string) : new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0, 23, 59, 59, 999);

    const metrics = await getOverviewMetrics(req.userId!, start, end);
    return res.json(metrics);
  } catch (error) {
    console.error('Summary error:', error);
    return res.status(500).json({ error: 'Failed to calculate summary.' });
  }
});

// Create transaction
router.post('/', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const parse = transactionSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ error: parse.error.errors[0].message });
    }

    const data = parse.data;

    // Validate account ownership
    const account = await prisma.account.findFirst({
      where: { id: data.accountId, userId: req.userId },
    });
    if (!account) {
      return res.status(404).json({ error: 'Selected account was not found.' });
    }

    if (data.type === 'TRANSFER') {
      if (!data.toAccountId) {
        return res.status(400).json({ error: 'Destination account is required for transfers.' });
      }
      if (data.accountId === data.toAccountId) {
        return res.status(400).json({ error: 'Source and destination accounts must be different.' });
      }
      const toAccount = await prisma.account.findFirst({
        where: { id: data.toAccountId, userId: req.userId },
      });
      if (!toAccount) {
        return res.status(404).json({ error: 'Destination account was not found.' });
      }
    }

    const transaction = await prisma.transaction.create({
      data: {
        userId: req.userId!,
        accountId: data.accountId,
        type: data.type,
        amount: round2(data.amount),
        categoryId: data.categoryId || null,
        date: data.date ? new Date(data.date) : new Date(),
        description: data.description || null,
        paymentMethod: data.paymentMethod || 'CASH',
        toAccountId: data.toAccountId || null,
        notes: data.notes || null,
        tags: data.tags || null,
        isRecurring: data.isRecurring || false,
        recurringPeriod: data.recurringPeriod || null,
      },
      include: {
        account: true,
        toAccount: true,
        category: true,
      },
    });

    return res.status(201).json({
      message: 'Transaction recorded successfully!',
      transaction,
    });
  } catch (error) {
    console.error('Create transaction error:', error);
    return res.status(500).json({ error: 'Failed to record transaction.' });
  }
});

// Update transaction
router.put('/:id', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const existing = await prisma.transaction.findFirst({
      where: { id, userId: req.userId },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Transaction not found.' });
    }

    const parse = transactionSchema.partial().safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ error: parse.error.errors[0].message });
    }

    const data = parse.data;

    const updated = await prisma.transaction.update({
      where: { id },
      data: {
        ...(data.type ? { type: data.type } : {}),
        ...(data.amount !== undefined ? { amount: round2(data.amount) } : {}),
        ...(data.accountId ? { accountId: data.accountId } : {}),
        ...(data.categoryId !== undefined ? { categoryId: data.categoryId } : {}),
        ...(data.date ? { date: new Date(data.date) } : {}),
        ...(data.description !== undefined ? { description: data.description } : {}),
        ...(data.paymentMethod ? { paymentMethod: data.paymentMethod } : {}),
        ...(data.toAccountId !== undefined ? { toAccountId: data.toAccountId } : {}),
        ...(data.notes !== undefined ? { notes: data.notes } : {}),
        ...(data.tags !== undefined ? { tags: data.tags } : {}),
        ...(data.isRecurring !== undefined ? { isRecurring: data.isRecurring } : {}),
        ...(data.recurringPeriod !== undefined ? { recurringPeriod: data.recurringPeriod } : {}),
      },
      include: {
        account: true,
        toAccount: true,
        category: true,
      },
    });

    return res.json({
      message: 'Transaction updated successfully!',
      transaction: updated,
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to update transaction.' });
  }
});

// Delete transaction
router.delete('/:id', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const existing = await prisma.transaction.findFirst({
      where: { id, userId: req.userId },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Transaction not found.' });
    }

    await prisma.transaction.delete({
      where: { id },
    });

    return res.json({ message: 'Transaction removed successfully.' });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to delete transaction.' });
  }
});

export default router;
