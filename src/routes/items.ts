import { Router } from 'express';
import { pluggy, DEMO_CLIENT_USER_ID } from '../pluggy-client.js';
import { loadItemSnapshot, loadItemSummary } from '../lib/snapshot.js';
import { addItem, listItems } from '../lib/store.js';

export const itemsRouter = Router();

itemsRouter.post('/items', async (req, res, next) => {
  try {
    const { itemId } = req.body as { itemId?: string };
    if (!itemId || typeof itemId !== 'string') {
      res.status(400).json({ error: 'itemId (string) is required' });
      return;
    }

    await pluggy.fetchItem(itemId);
    addItem(DEMO_CLIENT_USER_ID, itemId);

    res.json({ ok: true, items: listItems(DEMO_CLIENT_USER_ID) });
  } catch (err) {
    next(err);
  }
});

itemsRouter.get('/items', async (_req, res, next) => {
  try {
    const itemIds = listItems(DEMO_CLIENT_USER_ID);
    const summaries = await Promise.all(itemIds.map((id) => loadItemSummary(id)));
    res.json({ items: summaries });
  } catch (err) {
    next(err);
  }
});

itemsRouter.get('/items/:id/snapshot', async (req, res, next) => {
  try {
    const snapshot = await loadItemSnapshot(req.params.id);
    res.json(snapshot);
  } catch (err) {
    next(err);
  }
});
