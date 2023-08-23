import { Wallet } from '@transia/xrpl';
import { AcceptRentalOffer, URITokenInputDTO } from '../rentals/dto/rental.dto';
import { RentalType } from '../uriToken/uri-token.constant';
import { Account } from '../account/interfaces/account.interface';

export const TEST_TOKEN_URI_VALUE =
  '41747970732F2F306D632269612E74656E6F721E636F6D2F666752755A7A662D374B5541424141642F6465616C2D776974682D69742D73756E676C61737365734E676965';
export const TEST_ADDRESS_ALICE = 'r32d5V4f7VpsfPRmdx9UgpSAD1oSnoPDfm';
export const TEST_ADDRESS_BOB = 'rPqH8xKmKGLLiCgiZvXp2kYV4Cr3eNs6Mq';
export const TEST_SECRET = 'secret';
export const TEST_URI_INDEX = '0FAC3CD45FCB800BB9CCCF907775E7D4FB167847D8999FF05CE7456D6C3A70FA';
export const TEST_HOOK_NS = '959178BFB45D36ACF0FB00D09AEA3512C387173CCD7BD4D9D2270DB3D9820FE2';
export const TEST_HOOK_ON = 'FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFE3FFFFFDFFFFF';
export const TEST_TX_HASH = '2AFC5B8D2F1AC9D26AD6B47B9CCDAE8C68A64CF93B30A062107B132579E74B11';
export const TEST_HOOK_HASH = '382F4BF740FC0EACA86E669F1F55C3D075DE0754058856375FC56778F49EE047';
export const TEST_TOKEN_URI =
  '68747470733A2F2F6D656469612E74656E6F722E636F6D2F666752755A7A662D374B5541414141642F6465616C2D776974682D69742D73756E676C61737365732E6A736F6E';
export const SUCCESS_SUBMIT_RESPONSE = {
  response: {
    tx_json: {
      hash: TEST_TX_HASH,
    },
    engine_result: 'tesSUCCESS',
  },
};

export const FAILURE_SUBMIT_RESPONSE = {
  response: {
    engine_result: 'tefEXCEPTION',
  },
};
export const getCreateRentalOfferInputDTO = (originAccount: Account, destinationAddress: string): URITokenInputDTO => {
  return {
    totalAmount: 600,
    account: originAccount,
    uri: TEST_URI_INDEX,
    deadline: getDeadlineDate(1).toISOString(),
    rentalType: RentalType.COLLATERAL_FREE,
    destinationAccount: destinationAddress,
  };
};

export const getAcceptRentalOfferInputDTO = (account: Account): AcceptRentalOffer => {
  return {
    renterAccount: account,
    deadline: getDeadlineDate(1).toISOString(),
    totalAmount: 600,
  };
};
export function getAccountInfoFromWallet(wallet: Wallet) {
  return {
    address: wallet.address,
    secret: wallet.seed,
  };
}
export const getDeadlineDate = (days: number): Date => {
  const date = new Date();
  date.setDate(new Date().getDate() + days);
  return date;
};

export const getFutureDateIncreasedWith = (seconds: number): Date => {
  const date = new Date();
  date.setSeconds(new Date().getSeconds() + seconds);
  return date;
};
