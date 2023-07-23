import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class Account {
  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  address: string;
  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  secret: string;
}

export class AccountInfoOutputDto {
  @ApiProperty()
  address: string;
  @ApiProperty()
  balance: string;
  @ApiProperty()
  validated: boolean;
  @ApiProperty()
  flags: number;
  @ApiProperty()
  hookNamespaces: string[];
  @ApiProperty()
  numOfHookStateData: number;
}
