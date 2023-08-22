import { SetHook, SetHookFlags } from '@transia/xrpl'; // You might need to mock these imports
import { readFileSync } from 'fs';
import { HookTransactionFactory, ISetHookPrepareInput } from './hook.factory';
import { SetHookType } from './hook.constants';
import {
  TEST_ADDRESS_ALICE,
  TEST_ADDRESS_BOB,
  TEST_HOOK_HASH,
  TEST_HOOK_NS,
  TEST_HOOK_ON,
} from '../test-utils/test-utils';

jest.mock('fs');
const mockReadFileSync = readFileSync as jest.Mock;

describe('HookTransactionFactory', () => {
  describe('prepareSetHookTx', () => {
    it('should prepare a SetHook transaction for installation', async () => {
      const input: ISetHookPrepareInput = {
        type: SetHookType.INSTALL,
        account: TEST_ADDRESS_ALICE,
        hookNamespace: TEST_HOOK_NS,
      };
      const expectedTx: SetHook = {
        Account: TEST_ADDRESS_ALICE,
        TransactionType: 'SetHook',
        NetworkID: 21338,
        Hooks: [
          {
            Hook: {
              HookNamespace: TEST_HOOK_NS,
              CreateCode: 'MOCKEDHEXCODE',
              HookOn: TEST_HOOK_ON,
              HookApiVersion: 0,
              Flags: 17,
            },
          },
        ],
      };

      mockReadFileSync.mockReturnValueOnce('MOCKEDHEXCODE');

      const result = HookTransactionFactory.prepareSetHookTx(input);

      expect(result).toEqual(expectedTx);
    });

    it('should prepare a SetHook transaction for update', async () => {
      const input: ISetHookPrepareInput = {
        type: SetHookType.UPDATE,
        account: TEST_ADDRESS_ALICE,
        hookNamespace: TEST_HOOK_NS,
        grants: [
          {
            HookGrant: {
              HookHash: TEST_HOOK_HASH,
              Authorize: TEST_ADDRESS_BOB,
            },
          },
        ],
      };
      const expectedTx: SetHook = {
        Account: TEST_ADDRESS_ALICE,
        TransactionType: 'SetHook',
        NetworkID: 21338,
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
      };

      const result = HookTransactionFactory.prepareSetHookTx(input);

      expect(result).toEqual(expectedTx);
    });

    it('should prepare a SetHook transaction for reset', async () => {
      const input: ISetHookPrepareInput = {
        type: SetHookType.RESET,
        account: TEST_ADDRESS_ALICE,
        hookNamespace: TEST_HOOK_NS,
      };
      const expectedTx: SetHook = {
        Account: TEST_ADDRESS_ALICE,
        TransactionType: 'SetHook',
        NetworkID: 21338,
        Hooks: [
          {
            Hook: {
              HookNamespace: TEST_HOOK_NS,
              Flags: SetHookFlags.hsfNSDelete,
            },
          },
        ],
      };

      const result = HookTransactionFactory.prepareSetHookTx(input);

      expect(result).toEqual(expectedTx);
    });

    it('should prepare a SetHook transaction for delete', async () => {
      const input: ISetHookPrepareInput = {
        type: SetHookType.DELETE,
        account: TEST_ADDRESS_ALICE,
      };
      const expectedTx: SetHook = {
        Account: TEST_ADDRESS_ALICE,
        TransactionType: 'SetHook',
        NetworkID: 21338,
        Hooks: [
          {
            Hook: {
              CreateCode: '',
              Flags: SetHookFlags.hsfOverride,
            },
          },
        ],
      };

      const result = HookTransactionFactory.prepareSetHookTx(input);

      expect(result).toEqual(expectedTx);
    });
  });
});
