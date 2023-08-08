import { HookGrant } from '@transia/xrpl/dist/npm/models/common';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class HookInstallOutputDTO {
  result: string;
  tx_hash: string;
}

export class HookInputDTO {
  @IsString()
  @IsNotEmpty()
  readonly accountNumber: string;

  @IsString()
  @IsNotEmpty()
  readonly secret: string;

  readonly grants?: HookGrant[];

  @IsOptional()
  @IsString()
  readonly namespace?: string;
}
