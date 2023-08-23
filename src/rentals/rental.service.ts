import { Injectable, InternalServerErrorException, Logger, UnprocessableEntityException } from '@nestjs/common';
import { XrplService } from '../xrpl/client/client.service';
import { SubmitResponse, URITokenBuy, URITokenCancelSellOffer, URITokenCreateSellOffer } from '@transia/xrpl';
import { OfferType } from './retnals.constants';
import { HookService } from '../hooks/hook.service';
import { AcceptRentalOffer, CancelRentalOfferDTO, ReturnURITokenInputDTO, URITokenInputDTO } from './dto/rental.dto';
import { HookInputDTO } from '../hooks/dto/hook-input.dto';
import { RentalsTransactionFactory } from './rentals.transactionFactory';
import { URITokenService } from '../uriToken/uri-token-service.service';

@Injectable()
export class RentalService {
  constructor(
    private readonly xrpl: XrplService,
    private readonly hookService: HookService,
    private readonly transactionFactory: RentalsTransactionFactory,
    private readonly tokenService: URITokenService
  ) {}

  async createOffer(type: OfferType, input: URITokenInputDTO): Promise<SubmitResponse> {
    const token = await this.tokenService.findToken(input.account.address, input.uri);
    if (token && token.flags === 1) {
      throw new UnprocessableEntityException('Cannot create the offer for a URIToken with a flag: tfBurnable');
    }
    if (type === OfferType.START) {
      return await this.lendURIToken(input);
    }
    return await this.finishRental(input);
  }

  private async lendURIToken(input: URITokenInputDTO): Promise<SubmitResponse> {
    const tx: URITokenCreateSellOffer = await this.transactionFactory.prepareSellOfferTxForStart(input);
    const grantAccessResult = await this.grantAccessToHook(input);
    if (grantAccessResult.response.engine_result !== 'tesSUCCESS') {
      throw new InternalServerErrorException('Hook Grant access failed');
    }
    return this.xrpl.submitTransaction(tx, input.account);
  }

  private async grantAccessToHook(input: URITokenInputDTO) {
    const hook = await this.hookService.getAccountRentalHook(input.account.address);
    const hookNamespace = await this.hookService.getNamespaceIfExistsOrDefault(input.account.address);
    const grantHookAccessInput: HookInputDTO = {
      address: input.account.address,
      secret: input.account.secret,
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
    const response: any = await this.hookService.updateHook(grantHookAccessInput);
    console.log(response);
    return response;
  }

  private async finishRental(input: ReturnURITokenInputDTO): Promise<SubmitResponse> {
    const tx = await this.transactionFactory.prepareSellOfferTxForFinish(input);
    return this.xrpl.submitTransaction(tx, input.account);
  }

  async cancelRentalOffer(index: string, input: CancelRentalOfferDTO): Promise<SubmitResponse> {
    const tx: URITokenCancelSellOffer = await this.transactionFactory.prepareURITokenCancelOffer(index, input);
    return this.xrpl.submitTransaction(tx, input.account);
  }

  async acceptRentalOffer(index: string, input: AcceptRentalOffer): Promise<SubmitResponse> {
    const tx: URITokenBuy = await this.transactionFactory.prepareURITokenBuy(index, input);
    return this.xrpl.submitTransaction(tx, input.renterAccount);
  }

  async acceptReturnOffer(index: string, input: AcceptRentalOffer): Promise<SubmitResponse> {
    const tx: URITokenBuy = await this.transactionFactory.prepareURITokenBuy(index, input);
    return this.xrpl.submitTransaction(tx, input.renterAccount);
  }
}
