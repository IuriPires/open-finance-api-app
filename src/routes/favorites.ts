import { Router } from 'express';
import { randomUUID } from 'node:crypto';
import { DEMO_CLIENT_USER_ID } from '../pluggy-client.js';
import { addFavorite, listFavorites, removeFavorite } from '../lib/store.js';

export const favoritesRouter = Router();

favoritesRouter.get('/favorites', (_req, res) => {
  res.json({ favorites: listFavorites(DEMO_CLIENT_USER_ID) });
});

favoritesRouter.post('/favorites', (req, res) => {
  const { label, amount, description } = req.body as {
    label?: string;
    amount?: number;
    description?: string;
  };

  if (!label || typeof amount !== 'number' || amount <= 0) {
    res.status(400).json({ error: 'label and amount (number > 0) are required' });
    return;
  }

  const favorite = {
    id: randomUUID(),
    label,
    amount,
    description: description ?? '',
    createdAt: new Date().toISOString(),
  };

  addFavorite(DEMO_CLIENT_USER_ID, favorite);
  res.status(201).json({ favorite });
});

favoritesRouter.delete('/favorites/:id', (req, res) => {
  removeFavorite(DEMO_CLIENT_USER_ID, req.params.id);
  res.json({ ok: true });
});
