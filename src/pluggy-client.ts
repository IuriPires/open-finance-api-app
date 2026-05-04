import { PluggyClient } from 'pluggy-sdk';

const clientId = process.env.PLUGGY_CLIENT_ID;
const clientSecret = process.env.PLUGGY_CLIENT_SECRET;

if (!clientId || !clientSecret) {
  throw new Error(
    'PLUGGY_CLIENT_ID and PLUGGY_CLIENT_SECRET must be set in .env',
  );
}

export const pluggy = new PluggyClient({ clientId, clientSecret });

export const DEMO_CLIENT_USER_ID = 'pluggy-poc-demo-user';
