import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/prisma';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';
import { calculateAccountBalance } from '../services/balance.service';
import { round2 } from '../utils/math';

const router = Router();

const accountSchema = z.object({
  name: z.string().min(1, 'Account name is required'),
  type: z.enum(['CASH', 'SAVINGS', 'CURRENT', 'DIGITAL_WALLET', 'OTHER']).default('SAVINGS'),
  currency: z.string().default('LKR'),
  openingBalance: z.number().default(0),
  isExcludedFromSummary: z.boolean().default(false),
  description: z.string().optional().nullable(),
});

const transferSchema = z.object({
  fromAccountId: z.string().min(1, 'Source account is required'),
  toAccountId: z.string().min(1, 'Destination account is required'),
  amount: z.number().positive('Transfer amount must be greater than zero'),
  date: z.string().optional(),
  description: z.string().optional(),
  notes: z.string().optional(),
});

// List all accounts with calculated balances
router.get('/', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { includeArchived } = req.query;

    const accounts = await prisma.account.findMany({
      where: {
        userId: req.userId,
        ...(includeArchived === 'true' ? {} : { isArchived: false }),
      },
      orderBy: { createdAt: 'asc' },
    });

    const accountsWithBalance = await Promise.all(
      accounts.map(async (acc) => {
        const currentBalance = await calculateAccountBalance(acc.id);
        return {
          ...acc,
          currentBalance,
        };
      })
    );

    return res.json(accountsWithBalance);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to retrieve accounts.' });
  }
});

// Create new account
router.post('/', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const parse = accountSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ error: parse.error.errors[0].message });
    }

    const { name, type, currency, openingBalance, isExcludedFromSummary, description } = parse.data;

    const account = await prisma.account.create({
      data: {
        userId: req.userId!,
        name,
        type,
        currency,
        openingBalance: round2(openingBalance),
        isExcludedFromSummary,
        description: description || null,
      },
    });

    return res.status(201).json({
      ...account,
      currentBalance: account.openingBalance,
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to create account.' });
  }
});

// Update account
router.put('/:id', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const account = await prisma.account.findFirst({
      where: { id, userId: req.userId },
    });

    if (!account) {
      return res.status(404).json({ error: 'Account not found.' });
    }

    const parse = accountSchema.partial().safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ error: parse.error.errors[0].message });
    }

    const updated = await prisma.account.update({
      where: { id },
      data: {
        ...parse.data,
        ...(parse.data.openingBalance !== undefined
          ? { openingBalance: round2(parse.data.openingBalance) }
          : {}),
      },
    });

    const currentBalance = await calculateAccountBalance(updated.id);
    return res.json({ ...updated, currentBalance });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to update account.' });
  }
});

// Archive account (toggle)
router.patch('/:id/archive', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const account = await prisma.account.findFirst({
      where: { id, userId: req.userId },
    });

    if (!account) {
      return res.status(404).json({ error: 'Account not found.' });
    }

    const updated = await prisma.account.update({
      where: { id },
      data: { isArchived: !account.isArchived },
    });

    return res.json({
      message: updated.isArchived ? 'Account archived.' : 'Account restored.',
      account: updated,
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to update archive status.' });
  }
});

// Inter-account transfer
router.post('/transfer', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const parse = transferSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ error: parse.error.errors[0].message });
    }

    const { fromAccountId, toAccountId, amount, date, description, notes } = parse.data;

    if (fromAccountId === toAccountId) {
      return res.status(400).json({ error: 'Cannot transfer to the same account.' });
    }

    const [fromAccount, toAccount] = await Promise.all([
      prisma.account.findFirst({ where: { id: fromAccountId, userId: req.userId } }),
      prisma.account.findFirst({ where: { id: toAccountId, userId: req.userId } }),
    ]);

    if (!fromAccount || !toAccount) {
      return res.status(404).json({ error: 'One or both accounts could not be found.' });
    }

    // Verify balance
    const fromBalance = await calculateAccountBalance(fromAccountId);
    if (fromBalance < amount) {
      // Allowed but we can return warning or allow overdraft as per spec: "Let them decide how to manage their money"
    }

    // Record internal transfer transaction (type = 'TRANSFER')
    // Crucial rule: Transfer never counts as Income or Expense!
    const transferTransaction = await prisma.transaction.create({
      data: {
        userId: req.userId!,
        accountId: fromAccountId,
        toAccountId: toAccountId,
        type: 'TRANSFER',
        amount: round2(amount),
        date: date ? new Date(date) : new Date(),
        description: description || `Transfer from ${fromAccount.name} to ${toAccount.name}`,
        notes: notes || null,
        paymentMethod: 'ONLINE_TRANSFER',
      },
    });

    return res.status(201).json({
      message: `Successfully transferred ${round2(amount)} from ${fromAccount.name} to ${toAccount.name}.`,
      transaction: transferTransaction,
    });
  } catch (error) {
    console.error('Transfer error:', error);
    return res.status(500).json({ error: 'Failed to process transfer.' });
  }
});

export default router;
