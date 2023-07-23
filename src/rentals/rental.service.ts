import { Injectable, Logger } from '@nestjs/common';
import { XrplService } from '../xrpl/client/client.service';
import {
  convertStringToHex,
  LedgerEntryRequest,
  LedgerEntryResponse,
  SubmitResponse,
  URITokenBuy,
  URITokenCancelSellOffer,
  URITokenCreateSellOffer,
} from '@transia/xrpl';
import { Memo } from '@transia/xrpl/dist/npm/models/common';
import { RentalMemoType } from '../uriToken/uri-token.constant';
import * as process from 'process';
import { OfferType } from './retnals.constants';
import { floatToLEXfl, iHookParamEntry, iHookParamName, iHookParamValue } from '@transia/hooks-toolkit';
import { HookService } from '../hooks/hook.service';
import { AccountID } from '@transia/ripple-binary-codec/dist/types';
import {
  AcceptRentalOffer,
  BaseRentalInfo,
  CancelRentalOfferDTO,
  ReturnURITokenInputDTO,
  URITokenInputDTO,
} from './dto/rental.dto';
import { HookInputDTO } from '../hooks/dto/hook-input.dto';

@Injectable()
export class RentalService {
  constructor(private readonly xrpl: XrplService, private readonly hookService: HookService) {}

  async createOffer(type: OfferType, input: URITokenInputDTO): Promise<SubmitResponse> {
    if (type === OfferType.START) {
      return await this.lendURIToken(input);
    }
    return await this.finishRental(input);
  }

  private async lendURIToken(input: URITokenInputDTO): Promise<SubmitResponse> {
    const tx: URITokenCreateSellOffer = await this.prepareSellOfferTxForStart(input);
    const hook = await this.hookService.getAccountHook(input.account.address);
    const hookNamespace = await this.hookService.getNamespaceIfExistsOrDefault(input.account.address);
    const grantHookAccessInput: HookInputDTO = {
      accountNumber: input.account.address,
      seed: input.account.secret,
      grants: [
        {
          HookGrant: {
            HookHash: hook.Hook.HookHash,
            Authorize: input.destinationAccount,
          },
        },
      ],
    };
    Logger.log(
      `HookGrant sent by: ${input.account.address} for account: ${input.destinationAccount} to access namespace: ${hookNamespace}`
    );
    const grantAccessResult: any = await this.hookService.updateHook(grantHookAccessInput);
    if (grantAccessResult.response.engine_result !== 'tesSUCCESS') {
      throw Error('Hook Grant access failed');
    }
    return this.xrpl.submitTransaction(tx, input.account);
  }

  private async finishRental(input: ReturnURITokenInputDTO): Promise<SubmitResponse> {
    const tx = await this.prepareSellOfferTxForFinish(input);
    return this.xrpl.submitTransaction(tx, input.account);
  }

  async cancelRentalOffer(index: string, input: CancelRentalOfferDTO): Promise<SubmitResponse> {
    const tx: URITokenCancelSellOffer = await this.prepareURITokenCancelOffer(index, input);
    return this.xrpl.submitTransaction(tx, input.account);
  }

  async acceptRentalOffer(index: string, input: AcceptRentalOffer): Promise<SubmitResponse> {
    const tx: URITokenBuy = await this.prepareURITokenBuy(index, input);
    return this.xrpl.submitTransaction(tx, input.renterAccount);
  }

  async acceptReturnOffer(index: string, input: AcceptRentalOffer): Promise<SubmitResponse> {
    const tx: URITokenBuy = await this.prepareURITokenBuy(index, input);
    return this.xrpl.submitTransaction(tx, input.renterAccount);
  }

  private prepareMemosForLending<T extends BaseRentalInfo>(dto: T): Memo[] {
    if (dto.rentalType === undefined || dto.deadline === undefined || dto.totalAmount === undefined) {
      throw Error('Rental memo data missing');
    }
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
          MemoData: floatToLEXfl(dto.totalAmount.toString()),
        },
      },
      {
        Memo: {
          MemoType: convertStringToHex(RentalMemoType.DEADLINE_TIME.valueOf()),
          MemoData: floatToLEXfl((Date.parse(dto.deadline) / 1000).toString()),
        },
      },
    ];
  }

  private async prepareSellOfferTxForStart(input: URITokenInputDTO): Promise<URITokenCreateSellOffer> {
    const hookNamespace = await this.hookService.getNamespaceIfExistsOrDefault(input.destinationAccount);
    Logger.log(input.destinationAccount);
    Logger.log(AccountID.from(input.destinationAccount).toHex());
    const hookParamFirst = new iHookParamEntry(
      new iHookParamName('FOREIGNACC'),
      new iHookParamValue(AccountID.from(input.destinationAccount).toHex(), true)
    );

    const hookParamSecond = new iHookParamEntry(
      new iHookParamName('FOREIGNNS'),
      new iHookParamValue(hookNamespace, true)
    );
    return {
      Account: input.account.address,
      NetworkID: parseInt(process.env.NETWORK_ID),
      TransactionType: 'URITokenCreateSellOffer',
      URITokenID: input.uri,
      Amount: '0',
      Destination: input.destinationAccount,
      Memos: [...this.prepareMemosForLending(input)],
      HookParameters: [hookParamFirst.toXrpl(), hookParamSecond.toXrpl()],
    };
  }

  private async prepareSellOfferTxForFinish(input: ReturnURITokenInputDTO): Promise<URITokenCreateSellOffer> {
    const hookNamespace = await this.hookService.getNamespaceIfExistsOrDefault(input.destinationAccount);
    const hookParamFirst = new iHookParamEntry(
      new iHookParamName('FOREIGNACC'),
      new iHookParamValue(AccountID.from(input.destinationAccount).toHex(), true)
    );

    const hookParamSecond = new iHookParamEntry(
      new iHookParamName('FOREIGNNS'),
      new iHookParamValue(hookNamespace, true)
    );

    return {
      Account: input.account.address,
      NetworkID: parseInt(process.env.NETWORK_ID),
      TransactionType: 'URITokenCreateSellOffer',
      URITokenID: input.uri,
      Amount: '0',
      Destination: input.destinationAccount,
      Memos: [...this.prepareMemosForLending(input)],
      HookParameters: [hookParamFirst.toXrpl(), hookParamSecond.toXrpl()],
    };
  }

  private async prepareURITokenBuy(index: string, input: AcceptRentalOffer): Promise<URITokenBuy> {
    let ownerAccountAddress;
    try {
      const hookReq: LedgerEntryRequest = {
        command: 'ledger_entry',
        index,
      };
      const response = await this.xrpl.submitRequest<LedgerEntryRequest, LedgerEntryResponse>(hookReq);
      ownerAccountAddress = response.result.node['Owner'];
    } catch (err) {
      console.log(err);
    }
    const hookParamFirst = new iHookParamEntry(
      new iHookParamName('FOREIGNACC'),
      new iHookParamValue(AccountID.from(ownerAccountAddress).toHex(), true)
    );
    return {
      Account: input.renterAccount.address,
      NetworkID: parseInt(process.env.NETWORK_ID),
      TransactionType: 'URITokenBuy',
      URITokenID: index,
      Amount: '0',
      Memos: [...this.prepareMemosForLending(input)],
      HookParameters: [hookParamFirst.toXrpl()],
    };
  }

  private async prepareURITokenCancelOffer(
    index: string,
    input: CancelRentalOfferDTO
  ): Promise<URITokenCancelSellOffer> {
    return {
      Account: input.account.address,
      NetworkID: parseInt(process.env.NETWORK_ID),
      TransactionType: 'URITokenCancelSellOffer',
      URITokenID: index,
      Memos: [...this.prepareMemosForLending(input)],
    };
  }
}
