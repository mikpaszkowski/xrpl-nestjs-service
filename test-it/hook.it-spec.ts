import { Client, SetHookFlags, Wallet } from '@transia/xrpl';
import * as process from 'process';
import { createHookPayload, SetHookParams, setHooksV3 } from '@transia/hooks-toolkit';
import {
  serverUrl,
  setupClient,
  XrplIntegrationTestContext,
} from '@transia/hooks-toolkit/dist/npm/src/libs/xrpl-helpers';

describe('Hook rental flow testing', () => {
  const client = new Client(process.env.SERVER_API_ENDPOINT);

  let aliceWallet: { wallet: Wallet; balance: number };
  // let bobWallet;

  beforeAll(async () => {
    // await client.connect();
    // client.networkID = await client.getNetworkID();
    // aliceWallet = await client.fundWallet(null, { faucetHost: 'localhost:80' });
    // bobWallet = Wallet.fromSeed('shQERpGMonKeyxZoRExeEonandMgL');
  }, 12000);

  it('test', async () => {
    const testContext = (await setupClient(serverUrl)) as XrplIntegrationTestContext;
    const payload = createHookPayload(0, 'base', 'base', SetHookFlags.hsfOverride, ['Payment']);
    await setHooksV3({
      client: testContext.client,
      seed: testContext.alice.seed,
      hooks: [
        {
          Hook: payload,
        },
      ],
    } as SetHookParams);
  }, 10000);
});
