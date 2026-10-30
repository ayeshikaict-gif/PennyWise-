import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/prisma';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';
import { round2 } from '../utils/math';

const router = Router();

const billSchema = z.object({
  name: z.string().min(1, 'Bill name is required'),
  expectedAmount: z.number().positive('Expected amount must be greater than zero'),
  dueDate: z.string().min(1, 'Due date is required'),
  frequency: z.enum(['ONCE', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY']).default('MONTHLY'),
  categoryId: z.string().optional().nullable(),
  status: z.enum(['UNPAID', 'PAID', 'OVERDUE']).default('UNPAID'),
});

// List bills with overdue auto-detection
router.get('/', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const now = new Date();

    const bills = await prisma.bill.findMany({
      where: { userId: req.userId },
      include: { category: true },
      orderBy: { dueDate: 'asc' },
    });

    // Check overdue status
    const updatedBills = await Promise.all(
      bills.map(async (b) => {
        let currentStatus = b.status;
        if (currentStatus === 'UNPAID' && new Date(b.dueDate) < now) {
          currentStatus = 'OVERDUE';
          await prisma.bill.update({
            where: { id: b.id },
            data: { status: 'OVERDUE' },
          });
        }
        return {
          ...b,
          status: currentStatus,
        };
      })
    );

    return res.json(updatedBills);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to retrieve bills.' });
  }
});

// Create bill
router.post('/', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const parse = billSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ error: parse.error.errors[0].message });
    }

    const { name, expectedAmount, dueDate, frequency, categoryId, status } = parse.data;

    const bill = await prisma.bill.create({
      data: {
        userId: req.userId!,
        name,
        expectedAmount: round2(expectedAmount),
        dueDate: new Date(dueDate),
        frequency,
        categoryId: categoryId || null,
        status,
      },
      include: { category: true },
    });

    return res.status(201).json({
      message: 'Bill reminder added!',
      bill,
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to create bill.' });
  }
});

// Mark bill as paid
router.post('/:id/pay', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { recordExpense, accountId } = req.body;

    const bill = await prisma.bill.findFirst({
      where: { id, userId: req.userId },
    });

    if (!bill) {
      return res.status(404).json({ error: 'Bill not found.' });
    }

    const now = new Date();

    // Optionally record an expense transaction if requested and accountId provided
    if (recordExpense && accountId) {
      await prisma.transaction.create({
        data: {
          userId: req.userId!,
          accountId,
          type: 'EXPENSE',
          amount: bill.expectedAmount,
          categoryId: bill.categoryId,
          date: now,
          description: `Bill Payment: ${bill.name}`,
          paymentMethod: 'ONLINE_TRANSFER',
        },
      });
    }

    // Advance due date if recurring
    let nextDueDate = new Date(bill.dueDate);
    if (bill.frequency === 'MONTHLY') {
      nextDueDate.setMonth(nextDueDate.getMonth() + 1);
    } else if (bill.frequency === 'WEEKLY') {
      nextDueDate.setDate(nextDueDate.getDate() + 7);
    } else if (bill.frequency === 'QUARTERLY') {
      nextDueDate.setMonth(nextDueDate.getMonth() + 3);
    } else if (bill.frequency === 'YEARLY') {
      nextDueDate.setFullYear(nextDueDate.getFullYear() + 1);
    }

    const updated = await prisma.bill.update({
      where: { id },
      data: {
        status: bill.frequency === 'ONCE' ? 'PAID' : 'UNPAID',
        lastPaidDate: now,
        ...(bill.frequency !== 'ONCE' ? { dueDate: nextDueDate } : {}),
      },
      include: { category: true },
    });

    return res.json({
      message: `${bill.name} marked as paid!`,
      bill: updated,
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to process bill payment.' });
  }
});

// Update bill
router.put('/:id', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const existing = await prisma.bill.findFirst({
      where: { id, userId: req.userId },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Bill not found.' });
    }

    const parse = billSchema.partial().safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ error: parse.error.errors[0].message });
    }

    const data = parse.data;

    const updated = await prisma.bill.update({
      where: { id },
      data: {
        ...(data.name ? { name: data.name } : {}),
        ...(data.expectedAmount !== undefined ? { expectedAmount: round2(data.expectedAmount) } : {}),
        ...(data.dueDate ? { dueDate: new Date(data.dueDate) } : {}),
        ...(data.frequency ? { frequency: data.frequency } : {}),
        ...(data.categoryId !== undefined ? { categoryId: data.categoryId } : {}),
        ...(data.status ? { status: data.status } : {}),
      },
      include: { category: true },
    });

    return res.json(updated);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to update bill.' });
  }
});

// Delete bill
router.delete('/:id', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const existing = await prisma.bill.findFirst({
      where: { id, userId: req.userId },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Bill not found.' });
    }

    await prisma.bill.delete({ where: { id } });
    return res.json({ message: 'Bill removed.' });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to delete bill.' });
  }
});

export default router;
