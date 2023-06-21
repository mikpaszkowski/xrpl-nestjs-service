import { Injectable } from '@nestjs/common';
import { XrplService } from '../xrpl/client/client.service';
import {
  convertStringToHex,
  SubmitResponse,
  URITokenCancelSellOffer,
  URITokenCreateSellOffer,
  URITokenMint,
} from '@transia/xrpl';
import { IAccountInfo } from '../xrpl/client/interfaces/account-info.interface';
import { Memo } from '@transia/xrpl/dist/npm/models/common';
import {
  BaseRentalInfo,
  CancelRentalOfferDTO,
  MintURITokenInputDTO,
  URITokenInputDTO,
} from './dto/uri-token-input.dto';
import { RentalMemoType } from './uri-token.constant';

@Injectable
export class UriTokenService {
  constructor(private readonly xrpl: XrplService) {}
  async lendURIToken(input: URITokenInputDTO): Promise<SubmitResponse> {
    const tx: URITokenCreateSellOffer = await this.prepareURISellOffer(input);

    return this.xrpl.submitTransaction(tx, input.account);
  }
  async cancelRentalOffer(input: CancelRentalOfferDTO): Promise<SubmitResponse> {
    const response: IAccountInfo = await this.xrpl.getAccountInfo(input.account.address);

    const tx: URITokenCancelSellOffer = {
      Account: input.account.address,
      Fee: '1000',
      Sequence: response.Sequence,
      NetworkID: 21338,
      TransactionType: 'URITokenCancelSellOffer',
      URITokenID: input.uri,
      Memos: [...this.prepareMemosForLending(input)],
    };
    return this.xrpl.submitTransaction(tx, input.account);
  }

  async mintURIToken(input: MintURITokenInputDTO): Promise<SubmitResponse> {
    const response: IAccountInfo = await this.xrpl.getAccountInfo(input.account.address);

    const tx: URITokenMint = {
      Account: input.account.address,
      Fee: '1000',
      Sequence: response.Sequence,
      NetworkID: 21338,
      TransactionType: 'URITokenMint',
      URI: input.uri,
    };
    return this.xrpl.submitTransaction(tx, input.account);
  }

  async finishRental(input: URITokenInputDTO): Promise<SubmitResponse> {
    const tx = await this.prepareURISellOffer(input);
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

  private async prepareURISellOffer(input: URITokenInputDTO): Promise<URITokenCreateSellOffer> {
    const response: IAccountInfo = await this.xrpl.getAccountInfo(input.account.address);
    return {
      Account: input.account.address,
      Fee: '1000',
      Sequence: response.Sequence,
      NetworkID: 21338,
      TransactionType: 'URITokenCreateSellOffer',
      URITokenID: input.uri,
      Amount: '0',
      Destination: input.destinationAccount,
      Memos: [...this.prepareMemosForLending(input)],
    };
  }
}
