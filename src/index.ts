import 'dotenv/config';
import express, { type ErrorRequestHandler } from 'express';
import cors from 'cors';
import { connectRouter } from './routes/connect.js';
import { itemsRouter } from './routes/items.js';
import { accountsRouter } from './routes/accounts.js';
import { identityRouter } from './routes/identity.js';
import { investmentsRouter } from './routes/investments.js';
import { insightsRouter } from './routes/insights.js';
import { paymentsRouter } from './routes/payments.js';

const app = express();
const port = Number(process.env.PORT ?? 3000);

app.use(cors());
app.use(express.json());

app.use((req, _res, next) => {
  // eslint-disable-next-line no-console
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

app.get('/health', (_req, res) => {
  res.json({ ok: true, ts: Date.now() });
});

app.use('/api', connectRouter);
app.use('/api', itemsRouter);
app.use('/api', accountsRouter);
app.use('/api', identityRouter);
app.use('/api', investmentsRouter);
app.use('/api', insightsRouter);
app.use('/api', paymentsRouter);

const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  // eslint-disable-next-line no-console
  console.error('[pluggy-poc]', err);
  res.status(500).json({
    error: 'internal_error',
    message: err instanceof Error ? err.message : String(err),
  });
};
app.use(errorHandler);

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Pluggy POC backend listening on http://localhost:${port}`);
});
