import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { Client, Wallet } from '@transia/xrpl';
import * as process from 'process';
import { AccountInfoOutputDto } from '../src/account/interfaces/account.interface';
import { MintURITokenInputDTO } from '../src/uriToken/dto/uri-token-input.dto';
import { setTimeout } from 'timers/promises';
import { getAccountInfoFromWallet, TEST_TOKEN_URI_VALUE } from '../src/test-utils/test-utils';
import { URITokenOutputDTO } from '../src/uriToken/dto/uri-token-output.dto';

describe('Account URIToken management flow tests (e2e)', () => {
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

  it('should return account info when hit /account/:num/info (GET)', () => {
    return request(app.getHttpServer())
      .get(`/account/${aliceWallet.address}/info`)
      .expect(200)
      .expect(({ body }: { body: AccountInfoOutputDto }) => {
        expect(body.address).toEqual(aliceWallet.address);
        expect(body.numOfHookStateData).toEqual(0);
      });
  });

  it('should return empty array of hooks when hit /hooks/:address (GET)', () => {
    return request(app.getHttpServer()).get(`/hook/${aliceWallet.address}`).expect(200).expect([]);
  });

  it('should mint URIToken when hit /uri-tokens (POST)', async () => {
    const mintTokenResponse = await request(app.getHttpServer())
      .post('/uri-tokens')
      .send({
        account: getAccountInfoFromWallet(aliceWallet),
        uri: TEST_TOKEN_URI_VALUE,
      } as MintURITokenInputDTO);
    expect(mintTokenResponse.status).toEqual(201);
    await setTimeout(5000);
    const tokens = await getURITokensFrom(aliceWallet);
    expect(tokens[0].uri).toEqual(TEST_TOKEN_URI_VALUE);
    expect(tokens[0].index).not.toBeNull();
    expect(tokens[0].amount).toEqual(undefined);
    expect(tokens[0].owner).toEqual(aliceWallet.address);
  }, 15000);

  it('should remove URIToken when hit /uri-tokens/:index (DELETE)', async () => {
    const tokens = await getURITokensFrom(aliceWallet);
    const deleteURITokenResponse = await request(app.getHttpServer())
      .delete(`/uri-tokens/${tokens[0].index}`)
      .send(getAccountInfoFromWallet(aliceWallet));
    expect(deleteURITokenResponse.status).toEqual(200);
    await setTimeout(5000);
    const updatedTokens = await getURITokensFrom(aliceWallet);
    expect(updatedTokens).toEqual([]);
  }, 15000);

  async function getURITokensFrom(wallet: Wallet) {
    const uriTokensResponse = await request(app.getHttpServer()).get(`/uri-tokens/${wallet.address}`);
    expect(uriTokensResponse.status).toEqual(200);
    return uriTokensResponse.body as URITokenOutputDTO[];
  }
});
