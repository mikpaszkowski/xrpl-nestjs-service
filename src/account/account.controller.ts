import { Controller, Get, Param } from '@nestjs/common';
import { XrplService } from '../xrpl/client/client.service';
import { AccountInfoOutputDto } from './interfaces/account.interface';
import { AccountMapper } from './mapper/account.mapper';
import { IHookNamespaceInfo } from '../xrpl/client/interfaces/namespace.interface';

@Controller('account')
export class AccountController {
  constructor(private readonly xrpl: XrplService) {}

  @Get(':num/info')
  async accountInfo(@Param('num') num: string): Promise<AccountInfoOutputDto> {
    const accountInfoResponse = await this.xrpl.getAccountInfo(num);
    return AccountMapper.accountInfoResponseToDto(accountInfoResponse);
  }

  @Get(':num/namespace/:namespace')
  async accountNamespace(
    @Param('num') num: string,
    @Param('namespace') namespace: string
  ): Promise<IHookNamespaceInfo> {
    return await this.xrpl.getAccountNamespace(num, namespace);
  }
}
