import { Controller, Get, Param } from '@nestjs/common';
import { XrplService } from '../xrpl/client/client.service';

@Controller('account')
export class AccountController {
  constructor(private readonly xrpl: XrplService) {}

  @Get(':num/info')
  async accountInfo(@Param('num') num: string) {
    return await this.xrpl.getAccountInfo(num);
  }

  @Get(':num/namespace/:namespace')
  async accountNamespace(@Param('num') num: string, @Param('namespace') namespace: string) {
    return await this.xrpl.getAccountNamespace(num, namespace);
  }
}
