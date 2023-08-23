import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { Client, Wallet, xrpToDrops } from '@transia/xrpl';
import * as process from 'process';
import { Account } from '../src/account/interfaces/account.interface';
import { HookInputDTO } from '../src/hooks/dto/hook-input.dto';
import { IAccountHookOutputDto } from '../src/hooks/dto/hook-output.dto';
import { MintURITokenInputDTO } from '../src/uriToken/dto/uri-token-input.dto';
import { URITokenOutputDTO } from '../src/uriToken/dto/uri-token-output.dto';
import { setTimeout } from 'timers/promises';
import { OfferType } from '../src/rentals/retnals.constants';
import { AcceptRentalOffer, URITokenInputDTO } from '../src/rentals/dto/rental.dto';
import { RentalType } from '../src/uriToken/uri-token.constant';
import { getAccountInfoFromWallet, getDeadlineDate, TEST_TOKEN_URI_VALUE } from '../src/test-utils/test-utils';
import { floatToLEXfl } from '@transia/hooks-toolkit';
import { doesHookStateHasEntry } from './e2e-test.utils';

const RENTAL_TOTAL_AMOUNT = 600;
describe('URIToken rental start flow tests (e2e)', () => {
  let app: INestApplication;

  const client = new Client(process.env.SERVER_API_ENDPOINT);
  let aliceWallet: Wallet;
  let bobWallet: Wallet;

  const DEADLINE_TIMESTAMP = getDeadlineDate(5).toISOString();

  beforeAll(async () => {
    await client.connect();
    const firstWallet = await client.fundWallet(null, {
      faucetHost: 'hooks-testnet-v3.xrpl-labs.com',
    });
    aliceWallet = firstWallet.wallet;
    await setTimeout(10000);
    const secondWallet = await client.fundWallet(null, {
      faucetHost: 'hooks-testnet-v3.xrpl-labs.com',
    });
    bobWallet = secondWallet.wallet;
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

  it('should install hook on the Bob account when hit /hooks (POST)', async () => {
    const response = await request(app.getHttpServer())
      .post('/hook')
      .send({
        address: bobWallet.address,
        secret: bobWallet.seed,
      } as HookInputDTO);
    expect(response.status).toEqual(201);
    await setTimeout(1000);
    const accountHooksResponse = await request(app.getHttpServer()).get(`/hook/${bobWallet.address}`);
    const hooks = accountHooksResponse.body as IAccountHookOutputDto[];
    expect(accountHooksResponse.status).toBe(200);
    expect(hooks[0].hookHash).not.toBeNull();
    expect(hooks[0].hookNamespace).not.toBeNull();
    expect(hooks[0].hookState).toEqual([]);
    expect(hooks[0].hookGrants).toBeUndefined();
  }, 15000);

  async function mintURIToken(wallet: Wallet) {
    const mintTokenResponse = await request(app.getHttpServer())
      .post('/uri-tokens')
      .send({
        account: getAccountInfoFromWallet(wallet),
        uri: TEST_TOKEN_URI_VALUE,
      } as MintURITokenInputDTO);
    expect(mintTokenResponse.status).toEqual(201);
  }

  async function getURITokensFrom(wallet: Wallet) {
    const uriTokensResponse = await request(app.getHttpServer()).get(`/uri-tokens/${wallet.address}`);
    expect(uriTokensResponse.status).toEqual(200);
    return uriTokensResponse.body as URITokenOutputDTO[];
  }

  it('should mint URIToken when hit /uri-tokens (POST)', async () => {
    await mintURIToken(aliceWallet);
    await setTimeout(10000);
    const tokens = await getURITokensFrom(aliceWallet);
    expect(tokens[0].uri).toEqual(TEST_TOKEN_URI_VALUE);
    expect(tokens[0].index).not.toBeNull();
    expect(tokens[0].amount).toEqual(undefined);
    expect(tokens[0].owner).toEqual(aliceWallet.address);
  }, 15000);

  it('should Alice create rental offer of URIToken for a Bob when hit /rentals/offers?type=START (POST)', async () => {
    const tokens = await getURITokensFrom(aliceWallet);
    const createRentalOfferInput: URITokenInputDTO = {
      totalAmount: RENTAL_TOTAL_AMOUNT,
      account: getAccountInfoFromWallet(aliceWallet),
      uri: tokens[0].index,
      deadline: DEADLINE_TIMESTAMP,
      rentalType: RentalType.COLLATERAL_FREE,
      destinationAccount: bobWallet.address,
    };
    const createOfferResponse = await request(app.getHttpServer())
      .post(`/rentals/offers?type=${OfferType.START}`)
      .send(createRentalOfferInput);
    expect(createOfferResponse.status).toBe(201);

    await setTimeout(5000);
    const updatedTokens = await getURITokensFrom(aliceWallet);
    expect(updatedTokens[0].amount).toBe(xrpToDrops(RENTAL_TOTAL_AMOUNT));
    expect(updatedTokens[0].destination).toBe(bobWallet.address);
  }, 70000);

  it('should Bob accepts the rental offer and then own the URIToken start-offers/:index/accept (POST)', async () => {
    const tokens = await getURITokensFrom(aliceWallet);
    const createRentalOfferInput: AcceptRentalOffer = {
      totalAmount: RENTAL_TOTAL_AMOUNT,
      renterAccount: getAccountInfoFromWallet(bobWallet),
      deadline: DEADLINE_TIMESTAMP,
    };
    const createOfferResponse = await request(app.getHttpServer())
      .post(`/rentals/start-offers/${tokens[0].index}/accept`)
      .send(createRentalOfferInput);
    expect(createOfferResponse.status).toBe(201);

    await setTimeout(10000);
    const bobTokens = await getURITokensFrom(bobWallet);
    expect(bobTokens[0].uri).toEqual(TEST_TOKEN_URI_VALUE);
    expect(bobTokens[0].index).not.toBeNull();
    expect(bobTokens[0].amount).toEqual(undefined);
    expect(bobTokens[0].owner).toEqual(bobWallet.address);
  }, 70000);

  it('should Bob have the URITokenID and number of rentals equal to 1 saved in the hook store hook/:address (GET)', async () => {
    const bobTokens = await getURITokensFrom(bobWallet);
    const response = await request(app.getHttpServer()).get(`/hook/${bobWallet.address}`);
    expect(response.status).toBe(200);
    const body = response.body as IAccountHookOutputDto[];
    const firstStateEntry = body[0];
    doesHookStateHasEntry(firstStateEntry.hookState, {
      key: bobTokens[0].index,
      data: floatToLEXfl((Date.parse(DEADLINE_TIMESTAMP) / 1000).toString()),
    });
    doesHookStateHasEntry(firstStateEntry.hookState, {
      key: '0000000000000000000000000000000000000000000000000000000070000000',
      data: '01000000',
    });
  }, 70000);

  it('should Alice have the URITokenID and number of rentals equal to 1 saved in the hook store hook/:address (GET)', async () => {
    await setTimeout(5000);
    const bobTokens = await getURITokensFrom(bobWallet);
    const response = await request(app.getHttpServer()).get(`/hook/${aliceWallet.address}`);
    expect(response.status).toBe(200);
    const body = response.body as IAccountHookOutputDto[];
    const firstStateEntry = body[0];
    doesHookStateHasEntry(firstStateEntry.hookState, {
      key: bobTokens[0].index,
      data: floatToLEXfl((Date.parse(DEADLINE_TIMESTAMP) / 1000).toString()),
    });
    doesHookStateHasEntry(firstStateEntry.hookState, {
      key: '0000000000000000000000000000000000000000000000000000000070000000',
      data: '01000000',
    });
  }, 70000);

  it('should not allow to create a rental offer for currently rented URIToken /rentals/offers?type=START (POST)', async () => {
    const tokens = await getURITokensFrom(bobWallet);
    const createRentalOfferInput: URITokenInputDTO = {
      totalAmount: RENTAL_TOTAL_AMOUNT,
      account: getAccountInfoFromWallet(bobWallet),
      uri: tokens[0].index,
      deadline: getDeadlineDate(5).toISOString(),
      rentalType: RentalType.COLLATERAL_FREE,
      destinationAccount: aliceWallet.address,
    };
    const createOfferResponse = await request(app.getHttpServer())
      .post(`/rentals/offers?type=${OfferType.START}`)
      .send(createRentalOfferInput);
    expect(createOfferResponse.status).toBe(409);
  }, 30000);

  it('should not allow to create a return offer for currently rented URIToken /rentals/offers?type=FINISH (POST)', async () => {
    const tokens = await getURITokensFrom(bobWallet);
    const createRentalOfferInput: URITokenInputDTO = {
      totalAmount: RENTAL_TOTAL_AMOUNT,
      account: getAccountInfoFromWallet(bobWallet),
      uri: tokens[0].index,
      deadline: getDeadlineDate(5).toISOString(),
      rentalType: RentalType.COLLATERAL_FREE,
      destinationAccount: 'r32d5V4f7VpsfPRmdx9UgpSAD1oSnoPDfm',
    };
    const createOfferResponse = await request(app.getHttpServer())
      .post(`/rentals/offers?type=${OfferType.FINISH}`)
      .send(createRentalOfferInput);
    expect(createOfferResponse.status).toBe(409);
  });

  it('should not allow to remove the URIToken on Bob account /uri-tokens/:index (DELETE)', async () => {
    const response = await request(app.getHttpServer()).get(`/uri-tokens/${bobWallet.address}`);
    expect(response.status).toBe(200);
    const tokens = response.body as URITokenOutputDTO[];
    if (tokens.length) {
      await request(app.getHttpServer())
        .delete(`/uri-tokens/${tokens[0].index}`)
        .send({
          address: bobWallet.address,
          secret: bobWallet.seed,
        } as Account)
        .expect(409);
    }
  });
  it('should not allow to remove the Hook from Bob account /uri-tokens/:index (DELETE)', async () => {
    await request(app.getHttpServer())
      .delete('/hook')
      .send({
        address: bobWallet.address,
        secret: bobWallet.seed,
      } as HookInputDTO)
      .expect(409);
  });
  it('should not allow to remove the Hook from Alice account /uri-tokens/:index (DELETE)', async () => {
    await request(app.getHttpServer())
      .delete('/hook')
      .send({
        address: aliceWallet.address,
        secret: aliceWallet.seed,
      } as HookInputDTO)
      .expect(409);
  });
});
