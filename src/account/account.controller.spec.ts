import { Test, TestingModule } from '@nestjs/testing';
import { XrplService } from '../xrpl/client/client.service';
import { AccountController } from './account.controller';
import { AccountInfoResponse } from '@transia/xrpl';
import { TEST_ADDRESS_ALICE, TEST_HOOK_NS } from '../test-utils/test-utils';
import { AccountInfoOutputDto } from './interfaces/account.interface';

describe('AccountController unit spec', () => {
  let accountController: AccountController;
  const acountNamespace = {
    result: {
      validated: true,
      account: TEST_ADDRESS_ALICE,
      ledger_current_index: 1,
      namespace_entries: [
        {
          Flags: 0,
          OwnerNode: '0',
          LedgerEntryType: 'HookState',
          index: 'F06895E394B4D1E3D3F318BDA789540D028EDE8AE50FD33AF9A384D5269B4084',
          HookStateKey: 'CCFA3B80A20931DE999DBAE7D096F29AD6804384885D8348B131E52030AE9124',
          HookStateData: '30F1F469DA03C656',
        },
      ],
      namespace_id: TEST_HOOK_NS,
    },
    status: 'success',
    type: 'response',
    id: 1,
  };
  const mockedXrplService = {
    submitRequest: jest.fn().mockResolvedValue({
      id: '1',
      type: 'response',
      result: {
        validated: true,
        account_data: {
          index: 'index',
          LedgerEntryType: 'AccountRoot',
          Account: TEST_ADDRESS_ALICE,
          Balance: '100000000',
          Flags: 0,
          OwnerCount: 1,
          PreviousTxnID: 'previous_transaction_id',
          PreviousTxnLgrSeq: 12345,
          Sequence: 123,
        },
      },
    } satisfies AccountInfoResponse),
    getAccountNamespace: jest.fn().mockResolvedValue(acountNamespace),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AccountController],
      providers: [XrplService],
    })
      .overrideProvider(XrplService)
      .useValue(mockedXrplService)
      .compile();

    accountController = module.get<AccountController>(AccountController);
  });

  test('should return the account info output dto', async () => {
    await expect(accountController.accountInfo(TEST_ADDRESS_ALICE)).resolves.toEqual({
      numOfHookStateData: 0,
      address: TEST_ADDRESS_ALICE,
      balance: '100000000',
      flags: 0,
      hookNamespaces: [],
      validated: true,
    } as AccountInfoOutputDto);
  });

  test('should return the info about given namespace', async () => {
    await expect(accountController.accountNamespace(TEST_ADDRESS_ALICE, TEST_HOOK_NS)).resolves.toEqual(
      acountNamespace
    );
  });
});
