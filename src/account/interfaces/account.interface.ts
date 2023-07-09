import { IsNotEmpty, IsString } from 'class-validator';

export class IAccount {
  @IsString()
  @IsNotEmpty()
  address: string;
  @IsString()
  @IsNotEmpty()
  secret: string;
}
