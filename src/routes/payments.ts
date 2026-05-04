import { Router } from 'express';
import { pluggy } from '../pluggy-client.js';

export const paymentsRouter = Router();

paymentsRouter.post('/payments', async (req, res, next) => {
  try {
    const { amount, description, recipientId } = req.body as {
      amount?: number;
      description?: string;
      recipientId?: string;
    };

    if (typeof amount !== 'number' || amount <= 0) {
      res.status(400).json({ error: 'amount (number > 0) is required' });
      return;
    }

    const paymentRequest = await pluggy.payments.createPaymentRequest({
      amount,
      description: description ?? 'Pluggy POC payment',
      isSandbox: true,
      ...(recipientId ? { recipientId } : {}),
    });

    res.json({
      paymentRequestId: paymentRequest.id,
      paymentUrl: paymentRequest.paymentUrl,
      status: paymentRequest.status,
    });
  } catch (err) {
    next(err);
  }
});

paymentsRouter.get('/payments/:requestId/intent', async (req, res, next) => {
  try {
    const { requestId } = req.params;

    const page = await pluggy.payments.fetchPaymentIntents({ pageSize: 50 });
    const intent = page.results.find((i) => i.paymentRequest?.id === requestId);

    if (!intent) {
      res.status(404).json({ found: false, message: 'No payment intent yet' });
      return;
    }

    res.json({
      found: true,
      intent: {
        id: intent.id,
        status: intent.status,
        connector: intent.connector,
        createdAt: intent.createdAt,
        updatedAt: intent.updatedAt,
      },
    });
  } catch (err) {
    next(err);
  }
});
