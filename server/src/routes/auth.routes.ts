import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { prisma } from '../utils/prisma';
import { config } from '../config';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';
import { createDefaultCategoriesForUser } from './categories.routes';

const router = Router();

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  currency: z.string().default('LKR'),
});

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

// Helper to generate JWT token
function generateToken(userId: string): string {
  return jwt.sign({ userId }, config.jwtSecret, { expiresIn: '30d' });
}

// Register new user
router.post('/register', async (req, res: Response) => {
  try {
    const parse = registerSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ error: parse.error.errors[0].message });
    }

    const { name, email, password, currency } = parse.data;

    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });
    if (existingUser) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email: email.toLowerCase(),
        passwordHash,
        preferences: {
          create: {
            currency: currency || 'LKR',
          },
        },
      },
      include: {
        preferences: true,
      },
    });

    // Create default accounts
    const cashAccount = await prisma.account.create({
      data: {
        userId: user.id,
        name: 'Cash Wallet',
        type: 'CASH',
        currency: currency || 'LKR',
        openingBalance: 0,
      },
    });

    await prisma.account.create({
      data: {
        userId: user.id,
        name: 'Bank Savings Account',
        type: 'SAVINGS',
        currency: currency || 'LKR',
        openingBalance: 0,
      },
    });

    // Set default account in preferences
    await prisma.userPreferences.update({
      where: { userId: user.id },
      data: { defaultAccountId: cashAccount.id },
    });

    // Create default categories
    await createDefaultCategoriesForUser(user.id);

    const token = generateToken(user.id);

    return res.status(201).json({
      message: 'Account created successfully!',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        preferences: user.preferences,
      },
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    return res.status(500).json({ error: 'Failed to create account. Please try again.' });
  }
});

// Login user
router.post('/login', async (req, res: Response) => {
  try {
    const parse = loginSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ error: parse.error.errors[0].message });
    }

    const { email, password } = parse.data;

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: { preferences: true },
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const token = generateToken(user.id);

    return res.json({
      message: 'Welcome back!',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        preferences: user.preferences,
      },
    });
  } catch (error: any) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Failed to sign in. Please try again.' });
  }
});

// Get current user profile
router.get('/me', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      include: { preferences: true },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    return res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      preferences: user.preferences,
    });
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to retrieve profile.' });
  }
});

// 1-Click Demo Sandbox login
router.post('/demo', async (_req, res: Response) => {
  try {
    const demoEmail = 'demo@pennywise.local';
    let user = await prisma.user.findUnique({
      where: { email: demoEmail },
      include: { preferences: true },
    });

    // If demo user doesn't exist, we run seed logic or create it
    if (!user) {
      const passwordHash = await bcrypt.hash('pennywise_demo_2026', 10);
      user = await prisma.user.create({
        data: {
          name: 'Demo Explorer',
          email: demoEmail,
          passwordHash,
          preferences: {
            create: {
              currency: 'LKR',
              theme: 'light',
              simplifiedMode: false,
              largeTextMode: false,
            },
          },
        },
        include: { preferences: true },
      });

      // Default categories
      await createDefaultCategoriesForUser(user.id);
    }

    const token = generateToken(user.id);

    return res.json({
      message: 'Logged into Demo Sandbox successfully!',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        preferences: user.preferences,
      },
    });
  } catch (error: any) {
    console.error('Demo login error:', error);
    return res.status(500).json({ error: 'Failed to launch demo sandbox.' });
  }
});

export default router;
