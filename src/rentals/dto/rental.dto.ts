import { IAccount } from '../../account/interfaces/account.interface';
import { IsDateString, IsEnum, IsInt, IsNotEmpty, IsString, Length } from 'class-validator';
import { RentalType } from '../../uriToken/uri-token.constant';

export class BaseRentalInfo {
  @IsInt()
  totalAmount: number;
  @IsEnum(RentalType)
  rentalType: RentalType;
  @IsDateString()
  deadline: string;
}

export class URITokenInputDTO extends BaseRentalInfo {
  account: IAccount;
  @IsString()
  @IsNotEmpty()
  destinationAccount: string;
  @IsString()
  @IsNotEmpty()
  @Length(64, 64)
  uri: string;
}

export class AcceptRentalOffer extends BaseRentalInfo {
  renterAccount: IAccount;
}

export class ReturnURITokenInputDTO extends BaseRentalInfo {
  account: IAccount;
  @IsString()
  @IsNotEmpty()
  destinationAccount: string;
  @IsString()
  @IsNotEmpty()
  @Length(64, 64)
  uri: string;
}

export class CancelRentalOfferDTO extends BaseRentalInfo {
  account: IAccount;
}
