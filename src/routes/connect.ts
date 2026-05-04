import { Router } from 'express';
import { pluggy, DEMO_CLIENT_USER_ID } from '../pluggy-client.js';

export const connectRouter = Router();

connectRouter.post('/connect-token', async (_req, res, next) => {
  try {
    const { accessToken } = await pluggy.createConnectToken(undefined, {
      clientUserId: DEMO_CLIENT_USER_ID,
      avoidDuplicates: true,
    });
    res.json({ accessToken });
  } catch (err) {
    next(err);
  }
});
