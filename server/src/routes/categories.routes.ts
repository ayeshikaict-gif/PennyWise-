import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/prisma';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

export const DEFAULT_INCOME_CATEGORIES = [
  { name: 'Salary', icon: 'briefcase', color: '#10B981' },
  { name: 'Allowance', icon: 'coins', color: '#34D399' },
  { name: 'Freelance work', icon: 'laptop', color: '#059669' },
  { name: 'Business income', icon: 'building', color: '#047857' },
  { name: 'Pension', icon: 'shield-check', color: '#6EE7B7' },
  { name: 'Scholarship', icon: 'graduation-cap', color: '#0D9488' },
  { name: 'Interest', icon: 'trending-up', color: '#14B8A6' },
  { name: 'Gifts', icon: 'gift', color: '#F59E0B' },
  { name: 'Rental income', icon: 'home', color: '#6366F1' },
  { name: 'Other income', icon: 'plus-circle', color: '#64748B' },
];

export const DEFAULT_EXPENSE_CATEGORIES = [
  { name: 'Food and groceries', icon: 'shopping-cart', color: '#EF4444' },
  { name: 'Transportation', icon: 'car', color: '#F97316' },
  { name: 'Housing and rent', icon: 'home', color: '#8B5CF6' },
  { name: 'Electricity and water', icon: 'zap', color: '#EAB308' },
  { name: 'Education', icon: 'book-open', color: '#3B82F6' },
  { name: 'Health', icon: 'heart-pulse', color: '#EC4899' },
  { name: 'Shopping', icon: 'shopping-bag', color: '#A855F7' },
  { name: 'Entertainment', icon: 'film', color: '#06B6D4' },
  { name: 'Communication and internet', icon: 'wifi', color: '#0284C7' },
  { name: 'Family', icon: 'users', color: '#10B981' },
  { name: 'Personal care', icon: 'sparkles', color: '#F43F5E' },
  { name: 'Savings contributions', icon: 'piggy-bank', color: '#059669' },
  { name: 'Debt payments', icon: 'credit-card', color: '#DC2626' },
  { name: 'Other expenses', icon: 'more-horizontal', color: '#64748B' },
];

export async function createDefaultCategoriesForUser(userId: string) {
  const existing = await prisma.category.count({ where: { userId } });
  if (existing > 0) return;

  const incomePromises = DEFAULT_INCOME_CATEGORIES.map((cat) =>
    prisma.category.create({
      data: {
        userId,
        name: cat.name,
        type: 'INCOME',
        icon: cat.icon,
        color: cat.color,
        isDefault: true,
      },
    })
  );

  const expensePromises = DEFAULT_EXPENSE_CATEGORIES.map((cat) =>
    prisma.category.create({
      data: {
        userId,
        name: cat.name,
        type: 'EXPENSE',
        icon: cat.icon,
        color: cat.color,
        isDefault: true,
      },
    })
  );

  await Promise.all([...incomePromises, ...expensePromises]);
}

// Get all categories for user
router.get('/', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { type } = req.query;

    const whereClause: any = {
      userId: req.userId,
    };
    if (type && typeof type === 'string') {
      whereClause.type = type.toUpperCase();
    }

    const categories = await prisma.category.findMany({
      where: whereClause,
      orderBy: { name: 'asc' },
    });

    // If user has no categories yet, create defaults
    if (categories.length === 0) {
      await createDefaultCategoriesForUser(req.userId!);
      const newlyCreated = await prisma.category.findMany({
        where: whereClause,
        orderBy: { name: 'asc' },
      });
      return res.json(newlyCreated);
    }

    return res.json(categories);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch categories.' });
  }
});

// Create custom category
const categorySchema = z.object({
  name: z.string().min(1, 'Category name is required'),
  type: z.enum(['INCOME', 'EXPENSE']),
  icon: z.string().default('tag'),
  color: z.string().default('#10B981'),
});

router.post('/', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const parse = categorySchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ error: parse.error.errors[0].message });
    }

    const { name, type, icon, color } = parse.data;

    const existing = await prisma.category.findFirst({
      where: {
        userId: req.userId,
        name: { equals: name },
        type,
      },
    });

    if (existing) {
      return res.status(400).json({ error: `Category "${name}" already exists for ${type.toLowerCase()}.` });
    }

    const category = await prisma.category.create({
      data: {
        userId: req.userId!,
        name,
        type,
        icon,
        color,
        isDefault: false,
      },
    });

    return res.status(201).json(category);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to create category.' });
  }
});

// Update category
router.put('/:id', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, icon, color } = req.body;

    const category = await prisma.category.findFirst({
      where: { id, userId: req.userId },
    });

    if (!category) {
      return res.status(404).json({ error: 'Category not found.' });
    }

    const updated = await prisma.category.update({
      where: { id },
      data: {
        ...(name ? { name } : {}),
        ...(icon ? { icon } : {}),
        ...(color ? { color } : {}),
      },
    });

    return res.json(updated);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to update category.' });
  }
});

// Delete custom category
router.delete('/:id', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    const category = await prisma.category.findFirst({
      where: { id, userId: req.userId },
    });

    if (!category) {
      return res.status(404).json({ error: 'Category not found.' });
    }

    await prisma.category.delete({
      where: { id },
    });

    return res.json({ message: 'Category deleted successfully.' });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to delete category.' });
  }
});

export default router;
