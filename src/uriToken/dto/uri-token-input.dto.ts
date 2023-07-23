import { Account } from '../../account/interfaces/account.interface';
import { IsNotEmpty, IsString } from 'class-validator';

export class MintURITokenInputDTO {
  account: Account;
  @IsString()
  @IsNotEmpty()
  uri: string;
}
