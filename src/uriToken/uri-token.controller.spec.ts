import { Test, TestingModule } from '@nestjs/testing';
import { UriTokenController } from './uri-token.controller';
import { URITokenService } from './uri-token.service';
import { XrplService } from '../xrpl/client/client.service';
import {
  SUCCESS_SUBMIT_RESPONSE,
  TEST_ADDRESS_ALICE,
  TEST_SECRET,
  TEST_TOKEN_URI,
  TEST_TX_HASH,
  TEST_URI_INDEX,
} from '../test-utils/test-utils';

describe('UriToken controller', () => {
  let uriTokenController: UriTokenController;

  const mockedUriTokenService = {
    mintURIToken: jest.fn().mockResolvedValue(SUCCESS_SUBMIT_RESPONSE),
    removeURIToken: jest.fn().mockResolvedValue(SUCCESS_SUBMIT_RESPONSE),
    getAccountTokens: jest.fn().mockResolvedValue([
      {
        amount: undefined,
        destination: undefined,
        digest: undefined,
        index: TEST_URI_INDEX,
        issuer: TEST_ADDRESS_ALICE,
        owner: TEST_ADDRESS_ALICE,
        uri: TEST_TOKEN_URI,
      },
    ]),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UriTokenController],
      providers: [URITokenService, XrplService],
    })
      .overrideProvider(URITokenService)
      .useValue(mockedUriTokenService)
      .compile();

    uriTokenController = module.get<UriTokenController>(UriTokenController);
  });

  describe('URIToken controller', () => {
    it('should return success response with transaction hash when URIToken minted', async () => {
      expect(
        await uriTokenController.mintURIToken({
          uri: TEST_TOKEN_URI,
          account: {
            secret: TEST_SECRET,
            address: TEST_ADDRESS_ALICE,
          },
        })
      ).toEqual({
        tx_hash: TEST_TX_HASH,
        result: 'tesSUCCESS',
      });
    });

    it('should return array of URITokens', async () => {
      const response = await uriTokenController.getURITokens(TEST_ADDRESS_ALICE);
      expect(response).toEqual([
        {
          amount: undefined,
          destination: undefined,
          digest: undefined,
          index: TEST_URI_INDEX,
          issuer: TEST_ADDRESS_ALICE,
          owner: TEST_ADDRESS_ALICE,
          uri: TEST_TOKEN_URI,
        },
      ]);
    });

    it('should return success response on URIToken removal', async () => {
      expect(
        await uriTokenController.removeURIToken(TEST_URI_INDEX, {
          secret: TEST_SECRET,
          address: TEST_ADDRESS_ALICE,
        })
      ).toStrictEqual({
        tx_hash: TEST_TX_HASH,
        result: 'tesSUCCESS',
      });
    });
  });
});
