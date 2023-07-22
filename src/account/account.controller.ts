import { Controller, Get, Param } from '@nestjs/common';
import { XrplService } from '../xrpl/client/client.service';
import { IAccountInfoOutputDto } from './interfaces/account.interface';
import { AccountMapper } from './mapper/account.mapper';

@Controller('account')
export class AccountController {
  constructor(private readonly xrpl: XrplService) {}

  @Get(':num/info')
  async accountInfo(@Param('num') num: string): Promise<IAccountInfoOutputDto> {
    const accountInfoResponse = await this.xrpl.getAccountInfo(num);
    return AccountMapper.accountInfoResponseToDto(accountInfoResponse);
  }

  @Get(':num/namespace/:namespace')
  async accountNamespace(@Param('num') num: string, @Param('namespace') namespace: string) {
    return await this.xrpl.getAccountNamespace(num, namespace);
  }
}
