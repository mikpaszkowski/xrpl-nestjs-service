import { Account } from '../../account/interfaces/account.interface';
import { IsDateString, IsEnum, IsInt, IsNotEmpty, IsPositive, IsString, Length } from 'class-validator';
import { RentalType } from '../../uriToken/uri-token.constant';

export class BaseRentalInfo {
  @IsInt()
  @IsPositive()
  totalAmount: number;
  @IsEnum(RentalType)
  rentalType: RentalType;
  @IsDateString()
  deadline: string;
}

export class URITokenInputDTO extends BaseRentalInfo {
  account: Account;
  @IsString()
  @IsNotEmpty()
  destinationAccount: string;
  @IsString()
  @IsNotEmpty()
  @Length(64, 64)
  uri: string;
}

export class AcceptRentalOffer {
  renterAccount: Account;
  @IsDateString()
  deadline: string;
  @IsInt()
  @IsPositive()
  totalAmount: number;
}

export class ReturnURITokenInputDTO extends BaseRentalInfo {
  account: Account;
  @IsString()
  @IsNotEmpty()
  destinationAccount: string;
  @IsString()
  @IsNotEmpty()
  @Length(64, 64)
  uri: string;
}

export class CancelRentalOfferDTO {
  account: Account;
}
