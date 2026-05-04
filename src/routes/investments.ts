import { Router } from 'express';
import { pluggy } from '../pluggy-client.js';

export const investmentsRouter = Router();

investmentsRouter.get('/items/:id/investments', async (req, res, next) => {
  try {
    const page = await pluggy.fetchInvestments(req.params.id);

    const investments = page.results.map((inv) => ({
      id: inv.id,
      name: inv.name,
      type: inv.type,
      subtype: inv.subtype,
      balance: inv.balance,
      amount: inv.amount,
      amountOriginal: inv.amountOriginal,
      amountProfit: inv.amountProfit,
      currencyCode: inv.currencyCode,
      issuer: inv.issuer,
      dueDate: inv.dueDate,
      rate: inv.rate,
      rateType: inv.rateType,
      fixedAnnualRate: inv.fixedAnnualRate,
      annualRate: inv.annualRate,
      lastTwelveMonthsRate: inv.lastTwelveMonthsRate,
      status: inv.status,
    }));

    const totalBalance = investments.reduce((sum, i) => sum + (i.balance ?? 0), 0);
    const totalProfit = investments.reduce((sum, i) => sum + (i.amountProfit ?? 0), 0);

    res.json({
      investments,
      totals: {
        balance: totalBalance,
        profit: totalProfit,
        count: investments.length,
      },
    });
  } catch (err) {
    next(err);
  }
});
