import { Router } from 'express';
import { pluggy } from '../pluggy-client.js';

export const accountsRouter = Router();

accountsRouter.get('/accounts/:id', async (req, res, next) => {
  try {
    const account = await pluggy.fetchAccount(req.params.id);
    const txPage = await pluggy.fetchTransactions(account.id, { pageSize: 25 });

    res.json({
      account,
      transactions: txPage.results,
    });
  } catch (err) {
    next(err);
  }
});
