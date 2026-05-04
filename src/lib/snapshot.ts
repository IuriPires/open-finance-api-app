import { pluggy } from '../pluggy-client.js';
import type { Account, Item, Transaction } from 'pluggy-sdk';

const ITEM_STATUS_READY = new Set(['UPDATED']);
const ITEM_STATUS_ERROR = new Set(['LOGIN_ERROR', 'OUTDATED']);

export type ItemSnapshot =
  | { state: 'syncing'; item: { id: string; status: string; executionStatus: string } }
  | { state: 'error'; item: { id: string; status: string; error: Item['error'] } }
  | {
      state: 'ready';
      item: { id: string; status: string; connector: Item['connector'] };
      accounts: Array<{ account: Account; transactions: Transaction[] }>;
    };

export async function loadItemSnapshot(itemId: string): Promise<ItemSnapshot> {
  const item = await pluggy.fetchItem(itemId);

  if (ITEM_STATUS_ERROR.has(item.status)) {
    return {
      state: 'error',
      item: { id: item.id, status: item.status, error: item.error },
    };
  }

  if (!ITEM_STATUS_READY.has(item.status)) {
    return {
      state: 'syncing',
      item: { id: item.id, status: item.status, executionStatus: item.executionStatus },
    };
  }

  const accountsPage = await pluggy.fetchAccounts(itemId);
  const accounts = accountsPage.results;

  const accountsWithTransactions = await Promise.all(
    accounts.map(async (account) => {
      const txPage = await pluggy.fetchTransactions(account.id, { pageSize: 25 });
      return { account, transactions: txPage.results };
    }),
  );

  return {
    state: 'ready',
    item: { id: item.id, status: item.status, connector: item.connector },
    accounts: accountsWithTransactions,
  };
}

export type ItemSummary = {
  itemId: string;
  connector: {
    id: number;
    name: string;
    imageUrl: string;
    primaryColor: string;
  };
  accountsCount: number;
  totalBalance: number;
  totalInvested: number;
  status: string;
};

export async function loadItemSummary(itemId: string): Promise<ItemSummary> {
  const item = await pluggy.fetchItem(itemId);

  let accountsCount = 0;
  let totalBalance = 0;
  let totalInvested = 0;

  if (ITEM_STATUS_READY.has(item.status)) {
    const accountsPage = await pluggy.fetchAccounts(itemId);
    accountsCount = accountsPage.results.length;
    totalBalance = accountsPage.results
      .filter((a) => a.type === 'BANK')
      .reduce((sum, a) => sum + a.balance, 0);

    if (item.connector.products.includes('INVESTMENTS')) {
      try {
        const invPage = await pluggy.fetchInvestments(itemId);
        totalInvested = invPage.results.reduce((sum, inv) => sum + (inv.balance ?? 0), 0);
      } catch {
        totalInvested = 0;
      }
    }
  }

  return {
    itemId: item.id,
    connector: {
      id: item.connector.id,
      name: item.connector.name,
      imageUrl: item.connector.imageUrl,
      primaryColor: item.connector.primaryColor,
    },
    accountsCount,
    totalBalance,
    totalInvested,
    status: item.status,
  };
}
