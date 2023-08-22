import { XrplService } from '../xrpl/client/client.service';
import { HookService } from './hook.service';
import { TestBed } from '@automock/jest';
import {
  SUCCESS_SUBMIT_RESPONSE,
  TEST_ADDRESS_ALICE,
  TEST_ADDRESS_BOB,
  TEST_HOOK_HASH,
  TEST_HOOK_NS,
  TEST_HOOK_ON,
  TEST_SECRET,
} from '../test-utils/test-utils';
import HookDefintion from '@transia/xrpl/dist/npm/src/models/ledger/HookDefinition';
import { Hook } from '@transia/xrpl/dist/npm/models/common';
import { readFileSync } from 'fs';
import { SetHook } from '@transia/xrpl';

const RANDOM_TEST_HOOK_NS = 'A773305BB47E7CFAC0AC01609164DD80451F553A71F0B88F6584AC4EA60658D5';
jest.mock('node:crypto', () => {
  return {
    randomBytes: jest.fn().mockReturnThis(),
    createHash: jest.fn().mockImplementation(() => ({
      update: jest.fn(),
      digest: jest.fn(() => RANDOM_TEST_HOOK_NS),
    })),
  };
});

jest.mock('fs');
const mockReadFileSync = readFileSync as jest.Mock;
describe('HookService unit spec', () => {
  let underTest: HookService;
  let xrplService: jest.Mocked<XrplService>;
  beforeAll(() => {
    const { unit, unitRef } = TestBed.create(HookService)
      .mock(XrplService)
      .using({ submitTransaction: jest.fn().mockResolvedValue({}), submitRequest: jest.fn().mockResolvedValue({}) })
      .compile();

    underTest = unit;
    xrplService = unitRef.get(XrplService);

    mockReadFileSync.mockReturnValueOnce('MOCKEDHEXCODE');
  });

  test('should submit SetHook install transaction with randomly generated namespace', async () => {
    //given
    (xrplService.getClient as jest.Mock).mockResolvedValue(null);
    const installHookTx: SetHook = {
      Account: TEST_ADDRESS_ALICE,
      TransactionType: 'SetHook',
      NetworkID: 21338,
      Hooks: [
        {
          Hook: {
            HookNamespace: RANDOM_TEST_HOOK_NS,
            CreateCode: 'MOCKEDHEXCODE',
            HookOn: TEST_HOOK_ON,
            HookApiVersion: 0,
            Flags: 17,
          },
        },
      ],
    };
    (xrplService.submitTransaction as jest.Mock).mockResolvedValue(SUCCESS_SUBMIT_RESPONSE);
    //when
    await underTest.install({
      address: TEST_ADDRESS_ALICE,
      secret: TEST_SECRET,
    });
    expect(xrplService.submitTransaction).toBeCalledWith(installHookTx, {
      address: TEST_ADDRESS_ALICE,
      secret: TEST_SECRET,
    });
  });

  test('should submit SetHook remove transaction', async () => {
    //given
    (xrplService.getClient as jest.Mock).mockResolvedValue(null);
    const removeHookTx: SetHook = {
      Account: TEST_ADDRESS_ALICE,
      TransactionType: 'SetHook',
      NetworkID: 21338,
      Hooks: [
        {
          Hook: {
            CreateCode: '',
            Flags: 1,
          },
        },
      ],
    };
    (xrplService.submitTransaction as jest.Mock).mockResolvedValue(SUCCESS_SUBMIT_RESPONSE);
    //when
    await underTest.remove({
      address: TEST_ADDRESS_ALICE,
      secret: TEST_SECRET,
    });
    expect(xrplService.submitTransaction).toBeCalledWith(removeHookTx, {
      address: TEST_ADDRESS_ALICE,
      secret: TEST_SECRET,
    });
  });

  test('should submit SetHook update transaction', async () => {
    //given
    (xrplService.getClient as jest.Mock).mockResolvedValue({});
    const removeHookTx: SetHook = {
      Account: TEST_ADDRESS_ALICE,
      TransactionType: 'SetHook',
      NetworkID: 21338,
      Hooks: [
        {
          Hook: {
            HookNamespace: RANDOM_TEST_HOOK_NS,
            HookGrants: [
              {
                HookGrant: {
                  HookHash: TEST_HOOK_HASH,
                  Authorize: TEST_ADDRESS_BOB,
                },
              },
            ],
          },
        },
      ],
    };
    (xrplService.submitTransaction as jest.Mock).mockResolvedValue(SUCCESS_SUBMIT_RESPONSE);
    //when
    await underTest.updateHook({
      address: TEST_ADDRESS_ALICE,
      secret: TEST_SECRET,
      namespace: TEST_HOOK_NS,
      grants: [
        {
          HookGrant: {
            HookHash: TEST_HOOK_HASH,
            Authorize: TEST_ADDRESS_BOB,
          },
        },
      ],
    });
    expect(xrplService.submitTransaction).toBeCalledWith(removeHookTx, {
      address: TEST_ADDRESS_ALICE,
      secret: TEST_SECRET,
    });
  });

  test('should submit SetHook reset transaction', async () => {
    //given
    (xrplService.getClient as jest.Mock).mockResolvedValue(null);
    const resetHookTx: SetHook = {
      Account: TEST_ADDRESS_ALICE,
      TransactionType: 'SetHook',
      NetworkID: 21338,
      Hooks: [
        {
          Hook: {
            HookNamespace: TEST_HOOK_NS,
            Flags: 16,
          },
        },
      ],
    };
    (xrplService.submitTransaction as jest.Mock).mockResolvedValue(SUCCESS_SUBMIT_RESPONSE);
    //when
    await underTest.resetHook({
      address: TEST_ADDRESS_ALICE,
      secret: TEST_SECRET,
      namespace: TEST_HOOK_NS,
    });
    expect(xrplService.submitTransaction).toBeCalledWith(resetHookTx, {
      address: TEST_ADDRESS_ALICE,
      secret: TEST_SECRET,
    });
  });

  it('should doesAccountHaveExistingHookWithEmptyNS return true if accountHook has empty HookNamespace and matches HookHash', () => {
    const accountHook: Hook = {
      Hook: {
        HookNamespace: undefined,
        HookHash: 'hash123',
      },
    };
    const hookDef: HookDefintion = {
      HookHash: 'hash123',
      Flags: 0,
      index: 'index',
      LedgerEntryType: 'HookDefintion',
    };

    const result = underTest.doesAccountHaveExistingHookWithEmptyNS(accountHook, hookDef);

    expect(result).toBe(true);
  });

  it('should doesAccountHaveExistingHookWithEmptyNS return false if accountHook is undefined', () => {
    const accountHook: Hook | undefined = undefined;
    const hookDef: HookDefintion = {
      HookHash: 'hash123',
      Flags: 0,
      index: 'index',
      LedgerEntryType: 'HookDefintion',
    };

    const result = underTest.doesAccountHaveExistingHookWithEmptyNS(accountHook, hookDef);

    expect(result).toBe(false);
  });

  it('should doesAccountHaveExistingHookWithEmptyNS return false if accountHook HookNamespace is not empty', () => {
    const accountHook: Hook = {
      Hook: {
        HookNamespace: 'namespace123',
        HookHash: 'hash123',
      },
    };
    const hookDef: HookDefintion = {
      HookHash: 'hash123',
      Flags: 0,
      index: 'index',
      LedgerEntryType: 'HookDefintion',
    };

    const result = underTest.doesAccountHaveExistingHookWithEmptyNS(accountHook, hookDef);

    expect(result).toBe(false);
  });

  it('should doesAccountHaveExistingHookWithEmptyNS return false if accountHook HookHash does not match', () => {
    const accountHook: Hook = {
      Hook: {
        HookNamespace: undefined,
        HookHash: 'hash123',
      },
    };
    const hookDef: HookDefintion = {
      HookHash: 'differentHash',
      Flags: 0,
      index: 'index',
      LedgerEntryType: 'HookDefintion',
    };

    const result = underTest.doesAccountHaveExistingHookWithEmptyNS(accountHook, hookDef);
    expect(result).toBe(false);
  });

  it('should return an array of hooks from response', async () => {
    //given
    const xrplLedgerResponse = {
      result: {
        index: '123',
        ledger_current_index: 123,
        node: {
          Hooks: [
            {
              Hook: {
                HookNamespace: TEST_HOOK_NS,
                HookGrants: [
                  {
                    HookGrant: {
                      HookHash: TEST_HOOK_HASH,
                      Authorize: TEST_ADDRESS_BOB,
                    },
                  },
                ],
              },
            },
          ],
        },
      },
    };
    (xrplService.submitRequest as jest.Mock).mockResolvedValue(xrplLedgerResponse);
    //when
    const result = await underTest.getListOfHooks(TEST_ADDRESS_ALICE);
    //then
    expect(result).toEqual(xrplLedgerResponse.result.node['Hooks']);
  });
});
