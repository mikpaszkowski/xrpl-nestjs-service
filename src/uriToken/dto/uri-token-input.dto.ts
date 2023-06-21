import { IAccount } from '../../hooks/interfaces/account.interface';
import { RentalType } from '../uri-token.constant';

export class URITokenInputDTO extends BaseRentalInfo {
  destinationAccount: string;
}

export class CancelRentalOfferDTO extends BaseRentalInfo {}

export class MintURITokenInputDTO extends BaseURIInputInfo {}

export class BaseRentalInfo extends BaseURIInputInfo {
  totalAmount: number;
  rentalType: RentalType;
  deadline: string;
}

export class BaseURIInputInfo {
  account: IAccount;
  uri: string;
}
