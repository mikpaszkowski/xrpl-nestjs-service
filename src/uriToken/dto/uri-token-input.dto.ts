import { IAccount } from '../../account/interfaces/account.interface';
import { RentalType } from '../uri-token.constant';

export class BaseRentalInfo {
  totalAmount: number;
  rentalType: RentalType;
  deadline: string;
}

export class URITokenInputDTO extends BaseRentalInfo {
  account: IAccount;
  destinationAccount: string;
  uri: string;
}

export class ReturnURITokenInputDTO extends BaseRentalInfo {
  account: IAccount;
  destinationAccount: string;
  uri: string;
}

export class CancelRentalOfferDTO extends BaseRentalInfo {
  account: IAccount;
}

export class MintURITokenInputDTO {
  account: IAccount;
  uri: string;
}

export class AcceptRentalOffer extends BaseRentalInfo {
  renterAccount: IAccount;
  ownerAccount: IAccount;
}
