import { IAccount } from '../../account/interfaces/account.interface';
import { IsNotEmpty, IsString } from 'class-validator';

export class MintURITokenInputDTO {
  account: IAccount;
  @IsString()
  @IsNotEmpty()
  uri: string;
}
