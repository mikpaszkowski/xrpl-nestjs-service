import { IAccount } from '../../hooks/interfaces/account.interface';
import { RentalType } from '../uri-token.constant';

export class URITokenInputDTO extends BaseRentalInfo {
  account: IAccount;
  destinationAccount: string;
  uri: string;
}

export class ReturnURITokenInputDTO extends BaseRentalInfo {
  account: IAccount;
  destinationAccount: string;
}

export class CancelRentalOfferDTO extends BaseRentalInfo {
  account: IAccount;
}

export class MintURITokenInputDTO {
  account: IAccount;
  uri: string;
}

export class AcceptRentalOffer extends BaseRentalInfo {
  account: IAccount;
}

export class BaseRentalInfo {
  totalAmount: number;
  rentalType: RentalType;
  deadline: string;
}
