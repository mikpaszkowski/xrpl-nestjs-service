import { IsNotEmpty, IsString } from 'class-validator';

export class IAccount {
  @IsString()
  @IsNotEmpty()
  address: string;
  @IsString()
  @IsNotEmpty()
  secret: string;
}

export interface IAccountInfoOutputDto {
  address: string;
  balance: string;
  validated: boolean;
  flags: number;
  hookNamespaces: string[];
  numOfHookStateData: number;
}
