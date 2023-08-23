import { URITokenService } from './uri-token-service.service';
import { XrplService } from '../xrpl/client/client.service';
import { TestBed } from '@automock/jest';
import { URIToken } from '@transia/xrpl/dist/npm/models/ledger';
import { URITokenBurn } from '@transia/xrpl';
import { TEST_ADDRESS_ALICE, TEST_SECRET, TEST_TOKEN_URI, TEST_URI_INDEX } from '../test-utils/test-utils';

describe('URITokenService unit spec', () => {
  let underTest: URITokenService;
  let xrplService: jest.Mocked<XrplService>;

  beforeAll(() => {
    const { unit, unitRef } = TestBed.create(URITokenService)
      .mock(XrplService)
      .using({ submitTransaction: jest.fn().mockResolvedValue({}), submitRequest: jest.fn().mockResolvedValue({}) })
      .compile();

    underTest = unit;
    xrplService = unitRef.get(XrplService);
  });

  test('should call the xrpl service with proper data when URIToken minted', async () => {
    (xrplService.submitTransaction as jest.Mock).mockResolvedValue({
      result: {
        engine_result: 'tesSUCCESS',
        engine_result_code: 0,
        engine_result_message: 'The transaction was successful.',
        tx_blob: '0x1234567890abcdef',
        tx_json: {
          Account: 'r3D3P8DX22KBuH5q4x6gsRaYjJb64WnURe',
          TransactionType: 'URITokenMint',
          URI: 'https://example.com/token/123',
          Digest: '0xabcdef1234567890',
          hash: '0x7890abcdef123456',
        },
        accepted: true,
        account_sequence_available: 1234,
        account_sequence_next: 1235,
        applied: true,
        broadcast: true,
        kept: true,
        queued: false,
        open_ledger_cost: '123.456 XRP',
        validated_ledger_index: 567890,
      },
    });
    await underTest.mintURIToken({
      uri: TEST_TOKEN_URI,
      account: {
        secret: TEST_SECRET,
        address: TEST_ADDRESS_ALICE,
      },
    });
    expect(xrplService.submitTransaction).toBeCalled();
    expect(xrplService.submitTransaction).toBeCalledWith(
      {
        Account: TEST_ADDRESS_ALICE,
        NetworkID: 21338,
        TransactionType: 'URITokenMint',
        URI: TEST_TOKEN_URI,
      },
      { address: TEST_ADDRESS_ALICE, secret: TEST_SECRET }
    );
  });

  test('should call the xrpl service when retrieved URITokens', async () => {
    (xrplService.submitRequest as jest.Mock).mockResolvedValue({
      result: {
        account_objects: [
          {
            LedgerEntryType: 'URIToken',
            URI: TEST_TOKEN_URI,
            index: TEST_URI_INDEX,
            Issuer: TEST_ADDRESS_ALICE,
            Owner: TEST_ADDRESS_ALICE,
          },
        ] as URIToken[],
      },
    });
    const response = await underTest.getAccountTokens('sample-account-address');
    expect(xrplService.submitTransaction).toBeCalled();
    expect(xrplService.submitTransaction).toBeCalledWith(
      {
        Account: TEST_ADDRESS_ALICE,
        NetworkID: 21338,
        TransactionType: 'URITokenMint',
        URI: TEST_TOKEN_URI,
      },
      { address: TEST_ADDRESS_ALICE, secret: TEST_SECRET }
    );
    expect(response).toEqual([
      {
        amount: undefined,
        destination: undefined,
        digest: undefined,
        index: TEST_URI_INDEX,
        issuer: TEST_ADDRESS_ALICE,
        owner: TEST_ADDRESS_ALICE,
        uri: TEST_TOKEN_URI,
        flags: 0,
      },
    ]);
  });

  test('should call xrpl service with correct URITokenBurn transaction', async () => {
    (xrplService.submitTransaction as jest.Mock).mockResolvedValue({
      result: {
        engine_result: 'tesSUCCESS',
        engine_result_code: 0,
        engine_result_message: 'The transaction was successful.',
        tx_blob: '0x1234567890abcdef',
        tx_json: {
          Account: TEST_ADDRESS_ALICE,
          TransactionType: 'URITokenBurn',
          URI: 'https://example.com/token/123',
          Digest: '0xabcdef1234567890',
          hash: '0x7890abcdef123456',
        },
        accepted: true,
        account_sequence_available: 1234,
        account_sequence_next: 1235,
        applied: true,
        broadcast: true,
        kept: true,
        queued: false,
        open_ledger_cost: '123.456 XRP',
        validated_ledger_index: 567890,
      },
    });
    await underTest.removeURIToken(
      {
        secret: TEST_SECRET,
        address: TEST_ADDRESS_ALICE,
      },
      'TEST_TOKEN_URI-TEST_URI_INDEX'
    );
    expect(xrplService.submitTransaction).toBeCalled();
    expect(xrplService.submitTransaction).toBeCalledWith(
      {
        Account: TEST_ADDRESS_ALICE,
        NetworkID: 21338,
        TransactionType: 'URITokenBurn',
        URITokenID: 'TEST_TOKEN_URI-TEST_URI_INDEX',
      } as URITokenBurn,
      { address: TEST_ADDRESS_ALICE, secret: TEST_SECRET }
    );
  });
});
