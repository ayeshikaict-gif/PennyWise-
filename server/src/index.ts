import express from 'express';
import cors from 'cors';
import { config } from './config';
import authRoutes from './routes/auth.routes';
import accountsRoutes from './routes/accounts.routes';
import transactionsRoutes from './routes/transactions.routes';
import categoriesRoutes from './routes/categories.routes';
import budgetsRoutes from './routes/budgets.routes';
import savingsRoutes from './routes/savings.routes';
import billsRoutes from './routes/bills.routes';
import reportsRoutes from './routes/reports.routes';
import settingsRoutes from './routes/settings.routes';
import { errorHandler } from './middleware/error';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    appName: 'PennyWise API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/accounts', accountsRoutes);
app.use('/api/transactions', transactionsRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/budgets', budgetsRoutes);
app.use('/api/savings', savingsRoutes);
app.use('/api/bills', billsRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/settings', settingsRoutes);

// Error Handling Middleware
app.use(errorHandler);

// Serve static frontend files if built
import path from 'path';
const clientDistPath = path.join(__dirname, '../../client/dist');
app.use(express.static(clientDistPath));
app.get('*', (_req, res) => {
  res.sendFile(path.join(clientDistPath, 'index.html'));
});

const server = app.listen(config.port, () => {
  console.log(`PennyWise Backend running at http://localhost:${config.port}`);
});

export { app, server };
