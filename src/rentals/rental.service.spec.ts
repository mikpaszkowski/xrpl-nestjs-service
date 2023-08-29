import { XrplService } from '../xrpl/client/client.service';
import { TestBed } from '@automock/jest';
import { RentalService } from './rental.service';
import { RentalsTransactionFactory } from './rentals.transactionFactory';
import { HookService } from '../hooks/hook.service';
import { xrpToDrops } from '@transia/xrpl';
import {
  FAILURE_SUBMIT_RESPONSE,
  getAcceptRentalOfferInputDTO,
  getCreateRentalOfferInputDTO,
  SUCCESS_SUBMIT_RESPONSE,
  TEST_ADDRESS_ALICE,
  TEST_ADDRESS_BOB,
  TEST_HOOK_HASH,
  TEST_HOOK_NS,
  TEST_SECRET,
  TEST_TOKEN_URI,
  TEST_URI_INDEX,
} from '../test-utils/test-utils';
import { Hook } from '@transia/xrpl/dist/npm/models/common';
import { getForeignAccountTxParams, getRentalContextHookParams } from './rental.utils';
import { OfferType } from './retnals.constants';
import { URITokenService } from '../uriToken/uri-token.service';
import { InternalServerErrorException, UnprocessableEntityException } from '@nestjs/common';

describe('RentalService unit spec', () => {
  let underTest: RentalService;
  let xrplService: jest.Mocked<XrplService>;
  let transactionFactory: jest.Mocked<RentalsTransactionFactory>;
  let hookService: jest.Mocked<HookService>;
  let uriTokenService: jest.Mocked<URITokenService>;

  beforeAll(() => {
    const { unit, unitRef } = TestBed.create(RentalService)
      .mock(XrplService)
      .using({ submitTransaction: jest.fn().mockResolvedValue({}), submitRequest: jest.fn().mockResolvedValue({}) })
      .mock(RentalsTransactionFactory)
      .using({
        prepareSellOfferTxForStart: jest.fn().mockResolvedValue({}),
        prepareURITokenBuy: jest.fn().mockResolvedValue({}),
        prepareURITokenCancelOffer: jest.fn().mockResolvedValue({}),
      })
      .mock(HookService)
      .using({
        getNamespaceIfExistsOrDefault: jest.fn().mockResolvedValue({}),
        grantAccessToHook: jest.fn().mockResolvedValue({}),
        getAccountRentalHook: jest.fn().mockResolvedValue({}),
        updateHook: jest.fn().mockResolvedValue({}),
      })
      .mock(URITokenService)
      .using({ findToken: jest.fn().mockResolvedValue({}) })
      .compile();

    underTest = unit;
    xrplService = unitRef.get(XrplService);
    transactionFactory = unitRef.get(RentalsTransactionFactory);
    hookService = unitRef.get(HookService);
    uriTokenService = unitRef.get(URITokenService);
  });

  test('should submit URITokenCreateSellOffer transaction as START offer', async () => {
    //given
    const input = getCreateRentalOfferInputDTO(
      {
        address: TEST_ADDRESS_ALICE,
        secret: TEST_SECRET,
      },
      TEST_ADDRESS_BOB
    );
    const uriTokenCreateSellOfferTx = {
      Account: TEST_ADDRESS_ALICE,
      NetworkID: 21338,
      TransactionType: 'URITokenCreateSellOffer',
      URITokenID: TEST_URI_INDEX,
      Amount: xrpToDrops(600),
      Destination: TEST_ADDRESS_BOB,
      HookParameters: [
        ...getForeignAccountTxParams(TEST_ADDRESS_BOB, TEST_HOOK_NS),
        ...getRentalContextHookParams({
          deadline: input.deadline,
          totalAmount: input.totalAmount,
        }),
      ],
    };
    (transactionFactory.prepareSellOfferTxForStart as jest.Mock).mockResolvedValue(uriTokenCreateSellOfferTx);
    (hookService.getAccountRentalHook as jest.Mock).mockResolvedValue({
      Hook: {
        Flags: 16,
        HookHash: TEST_HOOK_HASH,
        HookNamespace: TEST_HOOK_NS,
      },
    } as Hook);
    (hookService.grantAccessToHook as jest.Mock).mockResolvedValue(SUCCESS_SUBMIT_RESPONSE);
    (xrplService.submitTransaction as jest.Mock).mockResolvedValue(SUCCESS_SUBMIT_RESPONSE);
    //when
    await underTest.createOffer(OfferType.START, input);
    //then
    expect(hookService.grantAccessToHook).toBeCalledWith(input);
    expect(xrplService.submitTransaction).toBeCalledWith(uriTokenCreateSellOfferTx, {
      address: TEST_ADDRESS_ALICE,
      secret: TEST_SECRET,
    });
  });

  test('should throw UnprocessableEntityException when trying to create an offer for URIToken with flag tfBurnable', async () => {
    //given
    const input = getCreateRentalOfferInputDTO(
      {
        address: TEST_ADDRESS_ALICE,
        secret: TEST_SECRET,
      },
      TEST_ADDRESS_BOB
    );
    (uriTokenService.findToken as jest.Mock).mockResolvedValue({
      amount: undefined,
      destination: undefined,
      digest: undefined,
      index: TEST_URI_INDEX,
      issuer: TEST_ADDRESS_ALICE,
      owner: TEST_ADDRESS_ALICE,
      uri: TEST_TOKEN_URI,
      flags: 1,
    });
    //when
    await expect(underTest.createOffer(OfferType.START, input)).rejects.toThrow(UnprocessableEntityException);
    //then
  });

  test('should throw internal server exception when Grant request failed', async () => {
    //given
    const input = getCreateRentalOfferInputDTO(
      {
        address: TEST_ADDRESS_ALICE,
        secret: TEST_SECRET,
      },
      TEST_ADDRESS_BOB
    );
    const uriTokenCreateSellOfferTx = {
      Account: TEST_ADDRESS_ALICE,
      NetworkID: 21338,
      TransactionType: 'URITokenCreateSellOffer',
      URITokenID: TEST_URI_INDEX,
      Amount: xrpToDrops(600),
      Destination: TEST_ADDRESS_BOB,
      HookParameters: [
        ...getForeignAccountTxParams(TEST_ADDRESS_BOB, TEST_HOOK_NS),
        ...getRentalContextHookParams({
          deadline: input.deadline,
          totalAmount: input.totalAmount,
        }),
      ],
    };
    (transactionFactory.prepareSellOfferTxForStart as jest.Mock).mockResolvedValue(uriTokenCreateSellOfferTx);
    (hookService.grantAccessToHook as jest.Mock).mockResolvedValue(FAILURE_SUBMIT_RESPONSE);
    (xrplService.submitTransaction as jest.Mock).mockResolvedValue(SUCCESS_SUBMIT_RESPONSE);
    (uriTokenService.findToken as jest.Mock).mockResolvedValue({
      amount: undefined,
      destination: undefined,
      digest: undefined,
      index: TEST_URI_INDEX,
      issuer: TEST_ADDRESS_ALICE,
      owner: TEST_ADDRESS_ALICE,
      uri: TEST_TOKEN_URI,
      flags: 0,
    });
    //when
    await expect(underTest.createOffer(OfferType.START, input)).rejects.toThrow(InternalServerErrorException);
  });
  test('should submit URITokenCreateSellOffer transaction as FINISH offer', async () => {
    //given
    const input = getCreateRentalOfferInputDTO(
      {
        address: TEST_ADDRESS_ALICE,
        secret: TEST_SECRET,
      },
      TEST_ADDRESS_BOB
    );
    const uriTokenCreateSellOfferTx = {
      Account: TEST_ADDRESS_ALICE,
      NetworkID: 21338,
      TransactionType: 'URITokenCreateSellOffer',
      URITokenID: TEST_URI_INDEX,
      Amount: xrpToDrops(0),
      Destination: TEST_ADDRESS_BOB,
      HookParameters: [
        ...getForeignAccountTxParams(TEST_ADDRESS_BOB, TEST_HOOK_NS),
        ...getRentalContextHookParams({
          deadline: input.deadline,
          totalAmount: input.totalAmount,
        }),
      ],
    };
    (transactionFactory.prepareSellOfferTxForFinish as jest.Mock).mockResolvedValue(uriTokenCreateSellOfferTx);
    (xrplService.submitTransaction as jest.Mock).mockResolvedValue(SUCCESS_SUBMIT_RESPONSE);
    (uriTokenService.findToken as jest.Mock).mockResolvedValue({ flags: 0 });
    (hookService.updateHook as jest.Mock).mockResolvedValue(SUCCESS_SUBMIT_RESPONSE);
    //when
    await underTest.createOffer(OfferType.FINISH, input);
    //then
    expect(xrplService.submitTransaction).toBeCalledWith(uriTokenCreateSellOfferTx, {
      address: TEST_ADDRESS_ALICE,
      secret: TEST_SECRET,
    });
  });

  test.each(['acceptRentalOffer', 'acceptReturnOffer'])(
    'should submit URITokenBuy transaction as ACCEPT offer when execute: %s',
    async (methodName: string) => {
      //given
      const input = getAcceptRentalOfferInputDTO({
        address: TEST_ADDRESS_ALICE,
        secret: TEST_SECRET,
      });
      const uriTokenBuyTx = {
        Account: TEST_ADDRESS_ALICE,
        NetworkID: 21338,
        TransactionType: 'URITokenBuy',
        URITokenID: TEST_URI_INDEX,
        Amount: '0',
        HookParameters: [
          ...getRentalContextHookParams({
            deadline: input.deadline,
            totalAmount: 0,
          }),
        ],
      };
      (transactionFactory.prepareURITokenBuy as jest.Mock).mockResolvedValue(uriTokenBuyTx);
      (xrplService.submitTransaction as jest.Mock).mockResolvedValue(SUCCESS_SUBMIT_RESPONSE);
      //when
      await underTest[methodName](OfferType.FINISH, input);
      //then
      expect(xrplService.submitTransaction).toBeCalledWith(uriTokenBuyTx, {
        address: TEST_ADDRESS_ALICE,
        secret: TEST_SECRET,
      });
    }
  );
});
