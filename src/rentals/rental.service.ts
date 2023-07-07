import { Injectable } from '@nestjs/common';
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
import { floatToLEXfl, iHookParamEntry, iHookParamName, iHookParamValue, StateUtility } from '@transia/hooks-toolkit';
import { HookService } from '../hooks/hook.service';
import { HookDeployInputDTO } from '../hooks/dto/hook-install.dto';
import { AccountID } from '@transia/ripple-binary-codec/dist/types';

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
    const response = this.xrpl.submitTransaction(tx, input.renterAccount);
    const hook = await this.hookService.getAccountHook(input.ownerAccount.address);
    const hookDefinition = await StateUtility.getHookDefinition(this.xrpl.getClient(), hook.Hook.HookHash);
    const grantHookAccessInput: HookDeployInputDTO = {
      accountNumber: input.ownerAccount.address,
      seed: input.ownerAccount.secret,
      grants: [
        {
          HookGrant: {
            HookHash: hookDefinition.HookHash,
            Authorize: input.renterAccount.address,
          },
        },
      ],
    };
    const grantAccessResponse = await this.hookService.updateHook(grantHookAccessInput);
    if (grantAccessResponse.result.engine_result !== 'tesSUCCESS') {
      throw Error('Hook Grant access failed');
    }
    return response;
  }

  async acceptReturnOffer(uri: string, input: AcceptRentalOffer): Promise<SubmitResponse> {
    const tx: URITokenBuy = await this.prepareURITokenBuy(uri, input);
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
    const response: IAccountInfo = await this.xrpl.getAccountBasicInfo(input.account.address);
    const hook = await this.hookService.getAccountHook(input.destinationAccount);
    const hookParamFirst = new iHookParamEntry(
      new iHookParamName('FOREIGNACC'),
      new iHookParamValue(AccountID.from(input.destinationAccount).toHex(), true)
    );

    const hookParamSecond = new iHookParamEntry(
      new iHookParamName('FOREIGNNS'),
      new iHookParamValue(hook.Hook.HookNamespace, true)
    );
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
      HookParameters: [hookParamFirst.toXrpl(), hookParamSecond.toXrpl()],
    };
  }

  private async prepareSellOfferTxForFinish(input: ReturnURITokenInputDTO): Promise<URITokenCreateSellOffer> {
    const response: IAccountInfo = await this.xrpl.getAccountBasicInfo(input.account.address);
    const hookNamespace = await this.hookService.getNamespaceIfExistsOrDefault({
      accountNumber: input.destinationAccount,
      seed: '',
    });
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
      Fee: '1000',
      Sequence: response.Sequence,
      NetworkID: parseInt(process.env.NETWORK_ID),
      TransactionType: 'URITokenCreateSellOffer',
      URITokenID: input.uri,
      Amount: '0',
      Destination: input.destinationAccount,
      Memos: [...this.prepareMemosForLending(input)],
      HookParameters: [hookParamFirst.toXrpl(), hookParamSecond.toXrpl()],
    };
  }

  private async prepareURITokenBuy(uri: string, input: AcceptRentalOffer): Promise<URITokenBuy> {
    const response: IAccountInfo = await this.xrpl.getAccountBasicInfo(input.renterAccount.address);
    return {
      Account: input.renterAccount.address,
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
