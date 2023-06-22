import { Injectable } from '@nestjs/common';
import { XrplService } from '../xrpl/client/client.service';
import {
  convertStringToHex,
  SubmitResponse,
  URITokenBuy,
  URITokenCancelSellOffer,
  URITokenCreateSellOffer,
  URITokenMint,
} from '@transia/xrpl';
import { IAccountInfo } from '../xrpl/client/interfaces/account-info.interface';
import { Memo } from '@transia/xrpl/dist/npm/models/common';
import {
  AcceptRentalOffer,
  BaseRentalInfo,
  CancelRentalOfferDTO,
  MintURITokenInputDTO,
  ReturnURITokenInputDTO,
  URITokenInputDTO,
} from './dto/uri-token-input.dto';
import { RentalMemoType } from './uri-token.constant';
import * as process from 'process';

@Injectable
export class UriTokenService {
  constructor(private readonly xrpl: XrplService) {}

  async lendURIToken(input: URITokenInputDTO): Promise<SubmitResponse> {
    const tx: URITokenCreateSellOffer = await this.prepareSellOfferTx(input);
    return this.xrpl.submitTransaction(tx, input.account);
  }

  async finishRental(uri: string, input: ReturnURITokenInputDTO): Promise<SubmitResponse> {
    const tx = await this.prepareSellOfferTxForFinish(uri, input);
    return this.xrpl.submitTransaction(tx, input.account);
  }

  async cancelRentalOffer(uri: string, input: CancelRentalOfferDTO): Promise<SubmitResponse> {
    const tx: URITokenCancelSellOffer = await this.prepareURITokenCancelOffer(uri, input);
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

  async mintURIToken(input: MintURITokenInputDTO): Promise<SubmitResponse> {
    const response: IAccountInfo = await this.xrpl.getAccountInfo(input.account.address);

    const tx: URITokenMint = {
      Account: input.account.address,
      Fee: '1000',
      Sequence: response.Sequence,
      NetworkID: process.env.NETWORK_ID,
      TransactionType: 'URITokenMint',
      URI: input.uri,
    };
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
          MemoData: convertStringToHex(Date.parse(dto.deadline).toString()),
        },
      },
    ];
  }

  private async prepareSellOfferTx(input: URITokenInputDTO): Promise<URITokenCreateSellOffer> {
    const response: IAccountInfo = await this.xrpl.getAccountInfo(input.account.address);
    return {
      Account: input.account.address,
      Fee: '1000',
      Sequence: response.Sequence,
      NetworkID: process.env.NETWORK_ID,
      TransactionType: 'URITokenCreateSellOffer',
      URITokenID: input.uri,
      Amount: '0',
      Destination: input.destinationAccount || uri,
      Memos: [...this.prepareMemosForLending(input)],
    };
  }

  private async prepareSellOfferTxForFinish(
    uri: string,
    input: ReturnURITokenInputDTO
  ): Promise<URITokenCreateSellOffer> {
    const response: IAccountInfo = await this.xrpl.getAccountInfo(input.account.address);
    return {
      Account: input.account.address,
      Fee: '1000',
      Sequence: response.Sequence,
      NetworkID: process.env.NETWORK_ID,
      TransactionType: 'URITokenCreateSellOffer',
      URITokenID: uri,
      Amount: '0',
      Destination: input.destinationAccount,
      Memos: [...this.prepareMemosForLending(input)],
    };
  }

  private async prepareURITokenBuy(uri: string, input: AcceptRentalOffer): Promise<URITokenBuy> {
    const response: IAccountInfo = await this.xrpl.getAccountInfo(input.account.address);
    return {
      Account: input.account.address,
      Fee: '1000',
      Sequence: response.Sequence,
      NetworkID: process.env.NETWORK_ID,
      TransactionType: 'URITokenBuy',
      URITokenID: uri,
      Amount: '0',
      Memos: [...this.prepareMemosForLending(input)],
    };
  }

  private async prepareURITokenCancelOffer(uri: string, input: CancelRentalOfferDTO): Promise<URITokenCancelSellOffer> {
    const response: IAccountInfo = await this.xrpl.getAccountInfo(input.account.address);
    return {
      Account: input.account.address,
      Fee: '1000',
      Sequence: response.Sequence,
      NetworkID: process.env.NETWORK_ID,
      TransactionType: 'URITokenCancelSellOffer',
      URITokenID: uri,
      Memos: [...this.prepareMemosForLending(input)],
    };
  }
}
