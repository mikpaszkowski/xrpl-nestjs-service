import { Injectable } from '@nestjs/common';
import { AcceptRentalOffer, CancelRentalOfferDTO, ReturnURITokenInputDTO, URITokenInputDTO } from './dto/rental.dto';
import { URITokenBuy, URITokenCancelSellOffer, URITokenCreateSellOffer, xrpToDrops } from '@transia/xrpl';
import * as process from 'process';
import { HookService } from '../hooks/hook.service';
import { getForeignAccountTxParams, getRentalContextHookParams } from './rental.utils';

@Injectable()
export class RentalsTransactionFactory {
  constructor(private readonly hookService: HookService) {}

  async prepareSellOfferTxForStart(input: URITokenInputDTO): Promise<URITokenCreateSellOffer> {
    const hookNamespace = await this.hookService.getNamespaceIfExistsOrDefault(input.destinationAccount);

    return {
      Account: input.account.address,
      NetworkID: parseInt(process.env.NETWORK_ID),
      TransactionType: 'URITokenCreateSellOffer',
      URITokenID: input.uri,
      Amount: xrpToDrops(input.totalAmount),
      Destination: input.destinationAccount,
      HookParameters: [
        ...getForeignAccountTxParams(input.destinationAccount, hookNamespace),
        ...getRentalContextHookParams({
          deadline: input.deadline,
          totalAmount: input.totalAmount,
        }),
      ],
    };
  }

  async prepareSellOfferTxForFinish(input: ReturnURITokenInputDTO): Promise<URITokenCreateSellOffer> {
    const hookNamespace = await this.hookService.getNamespaceIfExistsOrDefault(input.destinationAccount);

    return {
      Account: input.account.address,
      NetworkID: parseInt(process.env.NETWORK_ID),
      TransactionType: 'URITokenCreateSellOffer',
      URITokenID: input.uri,
      Amount: '0',
      Destination: input.destinationAccount,
      HookParameters: [
        ...getForeignAccountTxParams(input.destinationAccount, hookNamespace),
        ...getRentalContextHookParams({
          deadline: input.deadline,
          totalAmount: input.totalAmount,
        }),
      ],
    };
  }

  async prepareURITokenBuy(index: string, input: AcceptRentalOffer): Promise<URITokenBuy> {
    return {
      Account: input.renterAccount.address,
      NetworkID: parseInt(process.env.NETWORK_ID),
      TransactionType: 'URITokenBuy',
      URITokenID: index,
      Amount: xrpToDrops(input.totalAmount),
      HookParameters: [
        ...getRentalContextHookParams({
          deadline: input.deadline,
          totalAmount: 0,
        }),
      ],
    };
  }

  async prepareURITokenCancelOffer(index: string, input: CancelRentalOfferDTO): Promise<URITokenCancelSellOffer> {
    return {
      Account: input.account.address,
      NetworkID: parseInt(process.env.NETWORK_ID),
      TransactionType: 'URITokenCancelSellOffer',
      URITokenID: index,
    };
  }
}
