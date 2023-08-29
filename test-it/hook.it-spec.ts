import {
  Client,
  SetHook,
  URITokenBuy,
  URITokenCancelSellOffer,
  URITokenCreateSellOffer,
  Wallet,
  xrpToDrops,
} from '@transia/xrpl';
import * as process from 'process';
import { Test, TestingModule } from '@nestjs/testing';
import { XrplService } from '../src/xrpl/client/client.service';
import { HookTransactionFactory } from '../src/hooks/hook.factory';
import { SetHookType } from '../src/hooks/hook.constants';
import { setTimeout } from 'timers/promises';
import { createHash, randomBytes } from 'node:crypto';
import {
  getAccountInfoFromWallet,
  getDeadlineDate,
  getFutureDateIncreasedWith,
  TEST_TOKEN_URI,
} from '../src/test-utils/test-utils';
import { URITokenService } from '../src/uriToken/uri-token.service';
import { RentalService } from '../src/rentals/rental.service';
import { RentalType } from '../src/uriToken/uri-token.constant';
import { HookService } from '../src/hooks/hook.service';
import { RentalsTransactionFactory } from '../src/rentals/rentals.transactionFactory';
import { ConflictException, ServiceUnavailableException } from '@nestjs/common';
import { readFileSync } from 'fs';
import * as path from 'path';
import { AcceptRentalOffer } from '../src/rentals/dto/rental.dto';
import { doesHookStateHasEntry, doesHookStateHasNoEntry } from '../test-e2e/e2e-test.utils';
import { floatToLEXfl } from '@transia/hooks-toolkit';

const RENTAL_TOTAL_AMOUNT = 1000;
describe('Hook rental logic testing', () => {
  let xrplService: XrplService;
  let uriTokenService: URITokenService;
  let rentalService: RentalService;
  let rentalTransactionFactory: RentalsTransactionFactory;
  let hookService: HookService;
  const client = new Client(process.env.SERVER_API_ENDPOINT || 'wss://hooks-testnet-v3.xrpl-labs.com');
  let URITOKEN_INDEX;
  let RENTAL_DEADLINE_TIMESTAMP = getFutureDateIncreasedWith(15).toISOString();

  let aliceWallet: Wallet;
  let bobWallet: Wallet;

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
    console.log(bobWallet);
  }, 30000);

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [XrplService, URITokenService, RentalService, HookService, RentalsTransactionFactory],
    }).compile();

    xrplService = module.get<XrplService>(XrplService);
    uriTokenService = module.get<URITokenService>(URITokenService);
    rentalService = module.get<RentalService>(RentalService);
    rentalTransactionFactory = module.get<RentalsTransactionFactory>(RentalsTransactionFactory);
    hookService = module.get<HookService>(HookService);
  });

  afterAll(async () => {
    await client.disconnect();
  }, 5000);

  it('should install rental hook on the account', async () => {
    //given: preparing the install SetHook transaction
    const setHookTx: SetHook = HookTransactionFactory.prepareSetHookTx({
      type: SetHookType.INSTALL,
      account: aliceWallet.address,
      hookNamespace: generateRandomNamespace(),
    });
    const setHookTxWithTestingVersionOfHook: SetHook = {
      ...setHookTx,
      Hooks: [
        {
          Hook: {
            ...setHookTx.Hooks[0].Hook,
            CreateCode: readFileSync(
              path.resolve(__dirname, path.resolve(__dirname, './build/rental_state_hook_tests.wasm'))
            )
              .toString('hex')
              .toUpperCase(),
          },
        },
      ],
    };
    //when: submitting the transaction to Alice
    const aliceHookInstallResponse: any = await xrplService.submitTransaction(
      setHookTxWithTestingVersionOfHook,
      getAccountInfoFromWallet(aliceWallet)
    );
    //then: transaction submitted with a success
    expect(aliceHookInstallResponse.response.engine_result).toEqual('tesSUCCESS');
    //and when: submitting the transaction to Bob
    const bobHookInstallResponse: any = await xrplService.submitTransaction(
      setHookTxWithTestingVersionOfHook,
      getAccountInfoFromWallet(bobWallet)
    );
    //then: transaction submitted with a success
    expect(bobHookInstallResponse.response.engine_result).toEqual('tesSUCCESS');
  }, 10000);

  it('should create a URIToken on Alice account', async () => {
    //given: minting URIToken on the Alice account
    const mintResult: any = await uriTokenService.mintURIToken({
      uri: TEST_TOKEN_URI,
      account: getAccountInfoFromWallet(aliceWallet),
    });
    expect(mintResult.response.engine_result).toEqual('tesSUCCESS');
    await setTimeout(5000);
    //given: saving the newly create URITokend index
    const tokens = await uriTokenService.getAccountTokens(aliceWallet.address);
    expect(tokens.length).toBeGreaterThan(0);
    URITOKEN_INDEX = tokens[0].index;
  }, 10000);

  describe('should reject the URITokenCreateBuyOffer when', () => {
    it('deadline is shorter than at least one day', async () => {
      //given: URITokenCreateSellOffer transaction for rental offer
      const tokenCreateSellOfferTx: URITokenCreateSellOffer = await rentalTransactionFactory.prepareSellOfferTxForStart(
        {
          account: getAccountInfoFromWallet(aliceWallet),
          uri: URITOKEN_INDEX,
          totalAmount: RENTAL_TOTAL_AMOUNT,
          deadline: getDeadlineDate(-3).toISOString(),
          destinationAccount: bobWallet.address,
          rentalType: RentalType.COLLATERAL_FREE,
        }
      );
      //when: creating a rental offer for a token for a Bob expects conflict exception thrown
      await expect(
        xrplService.submitTransaction(tokenCreateSellOfferTx, getAccountInfoFromWallet(aliceWallet))
      ).rejects.toThrow(ConflictException);
    }, 15000);

    it('total amount is zero', async () => {
      //given: URITokenCreateSellOffer transaction for rental offer
      const tokenCreateSellOfferTx: URITokenCreateSellOffer = await rentalTransactionFactory.prepareSellOfferTxForStart(
        {
          account: getAccountInfoFromWallet(aliceWallet),
          uri: URITOKEN_INDEX,
          totalAmount: 0,
          deadline: RENTAL_DEADLINE_TIMESTAMP,
          destinationAccount: bobWallet.address,
          rentalType: RentalType.COLLATERAL_FREE,
        }
      );
      //when: creating a rental offer for a token for a Bob expects conflict exception
      await expect(
        xrplService.submitTransaction(tokenCreateSellOfferTx, getAccountInfoFromWallet(aliceWallet))
      ).rejects.toThrow(ConflictException);
    }, 15000);

    it('total amount is negative', async () => {
      const tokenCreateSellOfferTx: URITokenCreateSellOffer = await rentalTransactionFactory.prepareSellOfferTxForStart(
        {
          account: getAccountInfoFromWallet(aliceWallet),
          uri: URITOKEN_INDEX,
          totalAmount: -RENTAL_TOTAL_AMOUNT,
          deadline: RENTAL_DEADLINE_TIMESTAMP,
          destinationAccount: bobWallet.address,
          rentalType: RentalType.COLLATERAL_FREE,
        }
      );
      await expect(
        xrplService.submitTransaction(tokenCreateSellOfferTx, getAccountInfoFromWallet(aliceWallet))
      ).rejects.toThrow(ServiceUnavailableException);
    }, 15000);
  });

  it('should Alice submit successfully the URITokenCreateBuyOffer to create a rental offer for Bob', async () => {
    //given: URITokenCreateSellOffer transaction for rental offer
    RENTAL_DEADLINE_TIMESTAMP = getFutureDateIncreasedWith(15 + 86400).toISOString();
    const tokenCreateSellOfferTx: URITokenCreateSellOffer = await rentalTransactionFactory.prepareSellOfferTxForStart({
      account: getAccountInfoFromWallet(aliceWallet),
      uri: URITOKEN_INDEX,
      totalAmount: RENTAL_TOTAL_AMOUNT,
      deadline: RENTAL_DEADLINE_TIMESTAMP,
      destinationAccount: bobWallet.address,
      rentalType: RentalType.COLLATERAL_FREE,
    });
    //when: creating a rental offer for a token for a Bob expects conflict exception thrown
    await expect(
      xrplService.submitTransaction(tokenCreateSellOfferTx, getAccountInfoFromWallet(aliceWallet))
    ).resolves.not.toThrow();
    //and:
    await setTimeout(5000);
    //given: saving the newly create URIToken index
    const tokens = await uriTokenService.getAccountTokens(aliceWallet.address);
    expect(tokens[0].amount).toBe(xrpToDrops(RENTAL_TOTAL_AMOUNT));
    expect(tokens[0].destination).toBe(bobWallet.address);
  }, 25000);

  it('should Alice grant access to her Hook store for Bob', async () => {
    const aliceRentalHook = await hookService.getAccountRentalHook(aliceWallet.address);
    const setHookUpdateTx: SetHook = HookTransactionFactory.prepareSetHookTx({
      type: SetHookType.UPDATE,
      account: aliceWallet.address,
      grants: [
        {
          HookGrant: {
            HookHash: aliceRentalHook.Hook.HookHash,
            Authorize: bobWallet.address,
          },
        },
      ],
    });
    await expect(
      xrplService.submitTransaction(setHookUpdateTx, getAccountInfoFromWallet(aliceWallet))
    ).resolves.not.toThrow();
    await setTimeout(5000);
    const updatedAliceRentalHook = await hookService.getAccountRentalHook(aliceWallet.address);
    expect(updatedAliceRentalHook.Hook.HookGrants[0].HookGrant.HookHash).toEqual(aliceRentalHook.Hook.HookHash);
    expect(updatedAliceRentalHook.Hook.HookGrants[0].HookGrant.Authorize).toEqual(bobWallet.address);
  }, 30000);

  it('should reject start rental via URITokenBuy transaction when deadline in the context is past', async () => {
    //given: URITokenBuy transaction with current time, invalid rental deadline
    const tokenBuyTx: URITokenBuy = await rentalTransactionFactory.prepareURITokenBuy(URITOKEN_INDEX, {
      renterAccount: getAccountInfoFromWallet(bobWallet),
      totalAmount: RENTAL_TOTAL_AMOUNT,
      deadline: getDeadlineDate(-3).toISOString(),
    } satisfies AcceptRentalOffer);
    //when: submitting URITokenBuy transaction
    await expect(xrplService.submitTransaction(tokenBuyTx, getAccountInfoFromWallet(bobWallet))).rejects.toThrow(
      ConflictException
    );
  }, 15000);

  it('should start rental via submission of URITokenBuy transaction', async () => {
    const tokenBuyTx: URITokenBuy = await rentalTransactionFactory.prepareURITokenBuy(URITOKEN_INDEX, {
      renterAccount: getAccountInfoFromWallet(bobWallet),
      totalAmount: RENTAL_TOTAL_AMOUNT,
      deadline: RENTAL_DEADLINE_TIMESTAMP,
    } satisfies AcceptRentalOffer);
    //when: submitting URITokenBuy transaction
    await expect(xrplService.submitTransaction(tokenBuyTx, getAccountInfoFromWallet(bobWallet))).resolves.not.toThrow();
    await setTimeout(5000);
  }, 15000);

  it('should Bob own the URIToken', async () => {
    await setTimeout(10000);
    const tokens = await uriTokenService.getAccountTokens(bobWallet.address);
    expect(tokens.length).toBeGreaterThan(0);
    expect(tokens[0].index).toBe(URITOKEN_INDEX);
  }, 15000);

  it('should Alice have the URIToken saved in the hook store with number of rentals', async () => {
    const aliceRentalHooksStates = await hookService.getAccountHooksStates(aliceWallet.address);
    doesHookStateHasEntry(aliceRentalHooksStates[0].hookState, {
      key: URITOKEN_INDEX,
      data: floatToLEXfl((Date.parse(RENTAL_DEADLINE_TIMESTAMP) / 1000).toString()),
    });
    doesHookStateHasEntry(aliceRentalHooksStates[0].hookState, {
      key: '0000000000000000000000000000000000000000000000000000000070000000',
      data: '01000000',
    });
  }, 30000);

  it('should Bob have the URIToken saved in the hook store with number of rentals', async () => {
    const bobRentalHooksStates = await hookService.getAccountHooksStates(bobWallet.address);
    doesHookStateHasEntry(bobRentalHooksStates[0].hookState, {
      key: URITOKEN_INDEX,
      data: floatToLEXfl((Date.parse(RENTAL_DEADLINE_TIMESTAMP) / 1000).toString()),
    });
    doesHookStateHasEntry(bobRentalHooksStates[0].hookState, {
      key: '0000000000000000000000000000000000000000000000000000000070000000',
      data: '01000000',
    });
  }, 30000);

  //FROM THAT MOMENT IN ORDER TO PASS THE NEXT STEPS OF RENTAL FLOW WHICH REQUIRE A LARGE
  //AMOUNT OF TIME TO PASS (AT LEAST ONE DAY) THE HOOK SOURCE CODE FOR TESTING PURPOSES
  //HAS BEEN MODIFIED TO DECREASE THE MINIMAL RENTAL TIME TO 10 SECONDS

  it('should Bob create a return offer via URITokenCreateSellOffer for Alice', async () => {
    //given
    await setTimeout(15000);
    //and: creating return offer transaction
    const tokenReturnTokenSellOfferTx: URITokenCreateSellOffer =
      await rentalTransactionFactory.prepareSellOfferTxForFinish({
        account: getAccountInfoFromWallet(bobWallet),
        uri: URITOKEN_INDEX,
        totalAmount: 0,
        deadline: RENTAL_DEADLINE_TIMESTAMP,
        destinationAccount: aliceWallet.address,
        rentalType: RentalType.COLLATERAL_FREE,
      });
    //when: creating a rental offer for a token for Alice to return URIToken
    await expect(
      xrplService.submitTransaction(tokenReturnTokenSellOfferTx, getAccountInfoFromWallet(bobWallet))
    ).resolves.not.toThrow();
    await setTimeout(5000);
  }, 30000);

  it('should the URIToken be updated of Amount and Destination fields', async () => {
    await setTimeout(5000);
    const tokens = await uriTokenService.getAccountTokens(bobWallet.address);
    expect(tokens.length).toBeGreaterThan(0);
    expect(tokens[0].index).toBe(URITOKEN_INDEX);
    expect(tokens[0].amount).toBe(xrpToDrops(0));
    expect(tokens[0].destination).toBe(aliceWallet.address);
  }, 15000);

  it('should not allow Bob to cancel created return offer for Alice', async () => {
    //given: creating return offer transaction
    const cancelTokenReturnOffer: URITokenCancelSellOffer = await rentalTransactionFactory.prepareURITokenCancelOffer(
      URITOKEN_INDEX,
      {
        account: getAccountInfoFromWallet(bobWallet),
      }
    );
    //when: creating a rental offer for a token for Alice to return URIToken
    await expect(
      xrplService.submitTransaction(cancelTokenReturnOffer, getAccountInfoFromWallet(bobWallet))
    ).rejects.toThrow(ConflictException);
  }, 30000);

  it('should Alice finish rental via submission of URITokenBuy transaction', async () => {
    const tokenBuyTx: URITokenBuy = await rentalTransactionFactory.prepareURITokenBuy(URITOKEN_INDEX, {
      renterAccount: getAccountInfoFromWallet(aliceWallet),
      totalAmount: 0,
      deadline: RENTAL_DEADLINE_TIMESTAMP,
    } satisfies AcceptRentalOffer);
    //when: submitting URITokenBuy transaction to get back the token
    await expect(
      xrplService.submitTransaction(tokenBuyTx, getAccountInfoFromWallet(aliceWallet))
    ).resolves.not.toThrow();
  }, 15000);

  it('should Alice own the URIToken', async () => {
    await setTimeout(5000);
    const tokens = await uriTokenService.getAccountTokens(aliceWallet.address);
    expect(tokens.length).toBeGreaterThan(0);
    expect(tokens[0].index).toBe(URITOKEN_INDEX);
  }, 15000);

  it('should Alice do not have the URIToken saved in the hook store with number of rentals', async () => {
    const aliceRentalHooksStates = await hookService.getAccountHooksStates(aliceWallet.address);
    doesHookStateHasNoEntry(aliceRentalHooksStates[0].hookState, {
      key: URITOKEN_INDEX,
      data: floatToLEXfl((Date.parse(RENTAL_DEADLINE_TIMESTAMP) / 1000).toString()),
    });
    doesHookStateHasEntry(aliceRentalHooksStates[0].hookState, {
      key: '0000000000000000000000000000000000000000000000000000000070000000',
      data: '00000000',
    });
  }, 30000);

  it('should Bob do not have the URIToken saved in the hook store with number of rentals', async () => {
    const bobRentalHooksStates = await hookService.getAccountHooksStates(bobWallet.address);
    doesHookStateHasNoEntry(bobRentalHooksStates[0].hookState, {
      key: URITOKEN_INDEX,
      data: floatToLEXfl((Date.parse(RENTAL_DEADLINE_TIMESTAMP) / 1000).toString()),
    });
    doesHookStateHasEntry(bobRentalHooksStates[0].hookState, {
      key: '0000000000000000000000000000000000000000000000000000000070000000',
      data: '00000000',
    });
  }, 30000);

  function generateRandomNamespace() {
    const randomBytesForNS = randomBytes(32);
    const hash = createHash('sha256');
    hash.update(randomBytesForNS);
    return hash.digest('hex').toUpperCase();
  }
});
