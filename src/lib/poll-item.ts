import { pluggy } from '../pluggy-client.js';
import type { Item } from 'pluggy-sdk';

const TERMINAL_SUCCESS = new Set(['SUCCESS', 'PARTIAL_SUCCESS']);
const TERMINAL_ANY = new Set([
  'SUCCESS',
  'PARTIAL_SUCCESS',
  'INVALID_CREDENTIALS',
  'INVALID_CREDENTIALS_MFA',
  'ALREADY_LOGGED_IN',
  'UNEXPECTED_ERROR',
  'SITE_NOT_AVAILABLE',
  'ACCOUNT_LOCKED',
  'ACCOUNT_CREDENTIALS_RESET',
  'CONNECTION_ERROR',
  'ACCOUNT_NEEDS_ACTION',
  'USER_AUTHORIZATION_PENDING',
  'USER_AUTHORIZATION_NOT_GRANTED',
  'USER_NOT_SUPPORTED',
  'USER_INPUT_TIMEOUT',
  'MERGE_ERROR',
  'ERROR',
]);

export type PollItemResult =
  | { ok: true; item: Item }
  | { ok: false; item: Item; reason: 'error' | 'timeout' };

export async function pollItemUntilDone(
  itemId: string,
  { intervalMs = 1500, timeoutMs = 60_000 }: { intervalMs?: number; timeoutMs?: number } = {},
): Promise<PollItemResult> {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    const item = await pluggy.fetchItem(itemId);

    if (TERMINAL_SUCCESS.has(item.status)) {
      return { ok: true, item };
    }
    if (TERMINAL_ANY.has(item.status)) {
      return { ok: false, item, reason: 'error' };
    }

    await new Promise((r) => setTimeout(r, intervalMs));
  }

  const item = await pluggy.fetchItem(itemId);
  return { ok: false, item, reason: 'timeout' };
}
