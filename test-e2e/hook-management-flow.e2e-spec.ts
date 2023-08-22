import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { Client, Wallet } from '@transia/xrpl';
import * as process from 'process';
import { HookInputDTO } from '../src/hooks/dto/hook-input.dto';
import { IAccountHookOutputDto } from '../src/hooks/dto/hook-output.dto';
import { setTimeout } from 'timers/promises';

describe('Hook management flow tests (e2e)', () => {
  let app: INestApplication;

  const client = new Client(process.env.SERVER_API_ENDPOINT);
  let aliceWallet: Wallet;

  beforeAll(async () => {
    await client.connect();
    const firstWallet = await client.fundWallet(null, {
      faucetHost: 'hooks-testnet-v3.xrpl-labs.com',
    });
    aliceWallet = firstWallet.wallet;
  }, 30000);

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    await client.connect();
  }, 30000);

  afterEach(async () => {
    await client.disconnect();
  }, 40000);

  it('should install hook on Alice account when hit /hooks (POST)', async () => {
    const response = await request(app.getHttpServer())
      .post('/hook')
      .send({
        address: aliceWallet.address,
        secret: aliceWallet.seed,
      } as HookInputDTO);
    expect(response.status).toEqual(201);
    await setTimeout(1000);
    const accountHooksResponse = await request(app.getHttpServer()).get(`/hook/${aliceWallet.address}`);
    const hooks = accountHooksResponse.body as IAccountHookOutputDto[];
    expect(accountHooksResponse.status).toBe(200);
    expect(hooks[0].hookHash).not.toBeNull();
    expect(hooks[0].hookNamespace).not.toBeNull();
    expect(hooks[0].hookState).toEqual([]);
    expect(hooks[0].hookGrants).toBeUndefined();
  }, 15000);

  it('should remove the hook from the Alice account when hit /hooks (DELETE)', async () => {
    const removeHookResponse = await request(app.getHttpServer())
      .delete('/hook')
      .send({
        address: aliceWallet.address,
        secret: aliceWallet.seed,
      } as HookInputDTO);
    expect(removeHookResponse.status).toBe(200);

    const accountHooksResponse = await request(app.getHttpServer()).get(`/hook/${aliceWallet.address}`);
    const hooks = accountHooksResponse.body as IAccountHookOutputDto[];
    expect(hooks).toEqual([]);
  }, 10000);
});
