import { Injectable, Logger } from '@nestjs/common';
import { XrplService } from '../xrpl/client/client.service';
import {
  AcceptRentalOffer,
  BaseRentalInfo,
  CancelRentalOfferDTO,
  ReturnURITokenInputDTO,
  URITokenInputDTO,
} from '../uriToken/dto/uri-token-input.dto';
import {
  convertStringToHex,
  SubmitResponse,
  URITokenBuy,
  URITokenCancelSellOffer,
  URITokenCreateSellOffer,
} from '@transia/xrpl';
import { Memo } from '@transia/xrpl/dist/npm/models/common';
import { RentalMemoType } from '../uriToken/uri-token.constant';
import { IAccountInfo } from '../xrpl/client/interfaces/account-info.interface';
import * as process from 'process';
import { OfferType } from './retnals.constants';

@Injectable()
export class RentalService {
  constructor(private readonly xrpl: XrplService) {}

  async createOffer(type: OfferType, input: URITokenInputDTO): Promise<SubmitResponse> {
    if (type === OfferType.START) {
      return await this.lendURIToken(input);
    }
    return await this.finishRental(input);
  }

  private async lendURIToken(input: URITokenInputDTO): Promise<SubmitResponse> {
    const tx: URITokenCreateSellOffer = await this.prepareSellOfferTx(input);
    return this.xrpl.submitTransaction(tx, input.account);
  }

  private async finishRental(input: ReturnURITokenInputDTO): Promise<SubmitResponse> {
    const tx = await this.prepareSellOfferTxForFinish(input);
    return this.xrpl.submitTransaction(tx, input.account);
  }

  async cancelRentalOffer(id: string, input: CancelRentalOfferDTO): Promise<SubmitResponse> {
    const tx: URITokenCancelSellOffer = await this.prepareURITokenCancelOffer(id, input);
    return this.xrpl.submitTransaction(tx, input.account);
  }

  async acceptRentalOffer(uri: string, input: AcceptRentalOffer): Promise<SubmitResponse> {
    const tx: URITokenBuy = await this.prepareURITokenBuy(uri, input);
    return this.xrpl.submitTransaction(tx, input.account);
  }

  async acceptReturnOffer(uri: string, input: AcceptRentalOffer): Promise<SubmitResponse> {
    const tx: URITokenBuy = await this.prepareURITokenBuy(uri, input);
    return this.xrpl.submitTransaction(tx, input.account);
  }

  private prepareMemosForLending<T extends BaseRentalInfo>(dto: T): Memo[] {
    return [
      {
        Memo: {
          MemoType: convertStringToHex(RentalMemoType.RENTAL_TYPE.valueOf()),
          MemoData: convertStringToHex(dto.rentalType.valueOf()),
        },
      },
      {
        Memo: {
          MemoType: convertStringToHex(RentalMemoType.TOTAL_AMOUNT.valueOf()),
          MemoData: convertStringToHex(dto.totalAmount.toString()),
        },
      },
      {
        Memo: {
          MemoType: convertStringToHex(RentalMemoType.DEADLINE_TIME.valueOf()),
          MemoData: convertStringToHex(Date.parse(dto.deadline).toString(16)),
        },
      },
    ];
  }

  private async prepareSellOfferTx(input: URITokenInputDTO): Promise<URITokenCreateSellOffer> {
    const response: IAccountInfo = await this.xrpl.getAccountBasicInfo(input.account.address);
    Logger.log(response);
    return {
      Account: input.account.address,
      Fee: '100',
      Sequence: response.Sequence,
      NetworkID: parseInt(process.env.NETWORK_ID),
      TransactionType: 'URITokenCreateSellOffer',
      URITokenID: input.uri,
      Amount: '0',
      Destination: input.destinationAccount,
      Memos: [...this.prepareMemosForLending(input)],
      HookParameters: [
        {
          HookParameter: {
            HookParameterName: convertStringToHex('renterNS'),
            HookParameterValue: 'CD5E8AD773879C619B5EF5B84E921AF7607EC15C0D711806C02C7274B021B62A',
          },
        },
        {
          HookParameter: {
            HookParameterName: convertStringToHex('renterAccId'),
            HookParameterValue: convertStringToHex(input.destinationAccount),
          },
        },
      ],
    };
  }

  private async prepareSellOfferTxForFinish(input: ReturnURITokenInputDTO): Promise<URITokenCreateSellOffer> {
    const response: IAccountInfo = await this.xrpl.getAccountBasicInfo(input.account.address);
    return {
      Account: input.account.address,
      Fee: '1000',
      Sequence: response.Sequence,
      NetworkID: parseInt(process.env.NETWORK_ID),
      TransactionType: 'URITokenCreateSellOffer',
      URITokenID: input.uri,
      Amount: '0',
      Destination: input.destinationAccount,
      Memos: [...this.prepareMemosForLending(input)],
    };
  }

  private async prepareURITokenBuy(uri: string, input: AcceptRentalOffer): Promise<URITokenBuy> {
    const response: IAccountInfo = await this.xrpl.getAccountBasicInfo(input.account.address);
    return {
      Account: input.account.address,
      Fee: '1000',
      Sequence: response.Sequence,
      NetworkID: parseInt(process.env.NETWORK_ID),
      TransactionType: 'URITokenBuy',
      URITokenID: uri,
      Amount: '0',
      Memos: [...this.prepareMemosForLending(input)],
    };
  }

  private async prepareURITokenCancelOffer(id: string, input: CancelRentalOfferDTO): Promise<URITokenCancelSellOffer> {
    const response: IAccountInfo = await this.xrpl.getAccountBasicInfo(input.account.address);
    return {
      Account: input.account.address,
      Fee: '1000',
      Sequence: response.Sequence,
      NetworkID: parseInt(process.env.NETWORK_ID),
      TransactionType: 'URITokenCancelSellOffer',
      URITokenID: id,
      Memos: [...this.prepareMemosForLending(input)],
    };
  }
}
