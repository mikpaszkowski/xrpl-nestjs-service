import { RentalsTransactionFactory } from './rentals.transactionFactory';
import { HookService } from '../hooks/hook.service';
import { TestBed } from '@automock/jest';
import {
  getDeadlineDate,
  TEST_ADDRESS_ALICE,
  TEST_ADDRESS_BOB,
  TEST_HOOK_NS,
  TEST_SECRET,
  TEST_URI_INDEX,
} from '../test-utils/test-utils';
import { RentalType } from '../uriToken/uri-token.constant';
import { xrpToDrops } from '@transia/xrpl';
import { getForeignAccountTxParams, getRentalContextHookParams } from './rental.utils';

describe('RentalsTransactionFactory unit spec', () => {
  let underTest: RentalsTransactionFactory;
  let hookService: jest.Mocked<HookService>;

  beforeAll(() => {
    const { unit, unitRef } = TestBed.create(RentalsTransactionFactory)
      .mock(HookService)
      .using({
        getNamespaceIfExistsOrDefault: jest.fn().mockResolvedValue({}),
      })
      .compile();
    underTest = unit;
    hookService = unitRef.get(HookService);
  });

  test('should prepare correct URITokenCreateSellOffer transaction for start rental', async () => {
    (hookService.getNamespaceIfExistsOrDefault as jest.Mock).mockResolvedValue(TEST_HOOK_NS);
    const deadline = getDeadlineDate(1).toISOString();
    const tx = await underTest.prepareSellOfferTxForStart({
      totalAmount: 600,
      account: {
        address: TEST_ADDRESS_ALICE,
        secret: TEST_SECRET,
      },
      uri: TEST_URI_INDEX,
      deadline,
      rentalType: RentalType.COLLATERAL_FREE,
      destinationAccount: TEST_ADDRESS_BOB,
    });
    expect(tx).toEqual({
      Account: TEST_ADDRESS_ALICE,
      NetworkID: 21338,
      TransactionType: 'URITokenCreateSellOffer',
      URITokenID: TEST_URI_INDEX,
      Amount: xrpToDrops(600),
      Destination: TEST_ADDRESS_BOB,
      HookParameters: [
        ...getForeignAccountTxParams(TEST_ADDRESS_BOB, TEST_HOOK_NS),
        ...getRentalContextHookParams({
          deadline,
          totalAmount: 600,
        }),
      ],
    });
  });

  test('should prepare correct URITokenCreateSellOffer transaction for finish rental', async () => {
    (hookService.getNamespaceIfExistsOrDefault as jest.Mock).mockResolvedValue(TEST_HOOK_NS);
    const deadline = getDeadlineDate(1).toISOString();
    const tx = await underTest.prepareSellOfferTxForFinish({
      totalAmount: 0,
      account: {
        address: TEST_ADDRESS_ALICE,
        secret: TEST_SECRET,
      },
      uri: TEST_URI_INDEX,
      deadline,
      rentalType: RentalType.COLLATERAL_FREE,
      destinationAccount: TEST_ADDRESS_BOB,
    });
    expect(tx).toEqual({
      Account: TEST_ADDRESS_ALICE,
      NetworkID: 21338,
      TransactionType: 'URITokenCreateSellOffer',
      URITokenID: TEST_URI_INDEX,
      Amount: xrpToDrops(0),
      Destination: TEST_ADDRESS_BOB,
      HookParameters: [
        ...getForeignAccountTxParams(TEST_ADDRESS_BOB, TEST_HOOK_NS),
        ...getRentalContextHookParams({
          deadline,
          totalAmount: 0,
        }),
      ],
    });
  });

  test('should prepare correct URITokenBuy transaction accept/return offer', async () => {
    const deadline = getDeadlineDate(1).toISOString();
    const tx = await underTest.prepareURITokenBuy(TEST_URI_INDEX, {
      renterAccount: {
        address: TEST_ADDRESS_ALICE,
        secret: TEST_SECRET,
      },
      deadline,
      totalAmount: 600,
    });
    expect(tx).toEqual({
      Account: TEST_ADDRESS_ALICE,
      NetworkID: 21338,
      TransactionType: 'URITokenBuy',
      URITokenID: TEST_URI_INDEX,
      Amount: xrpToDrops(600),
      HookParameters: [
        ...getRentalContextHookParams({
          deadline: deadline,
          totalAmount: 0,
        }),
      ],
    });
  });

  test('should prepare correct URITokenCancelSellOffer', async () => {
    (hookService.getNamespaceIfExistsOrDefault as jest.Mock).mockResolvedValue(TEST_HOOK_NS);
    const tx = await underTest.prepareURITokenCancelOffer(TEST_URI_INDEX, {
      account: {
        address: TEST_ADDRESS_ALICE,
        secret: TEST_SECRET,
      },
    });
    expect(tx).toEqual({
      Account: TEST_ADDRESS_ALICE,
      NetworkID: 21338,
      TransactionType: 'URITokenCancelSellOffer',
      URITokenID: TEST_URI_INDEX,
    });
  });
});
