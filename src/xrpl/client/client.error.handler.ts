import { CONNECTION_ERRORS, XRPL_INTERNAL_ERRORS } from './client.constant';
import {
  BadGatewayException,
  ConflictException,
  GatewayTimeoutException,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { TimeoutError } from '@transia/xrpl/dist/npm/errors';
import { ValidationError } from '@transia/xrpl';
import { BaseTransaction } from '@transia/xrpl/dist/npm/models/transactions/common';
import { IResultCode, XRPL_RESPONSE_CODE, XRPL_RESULT_PREFIX } from './interfaces/xrpl.interface';
import { BaseRequest } from '@transia/xrpl/dist/npm/models/methods/baseMethod';

export class ClientErrorhandler {
  static handleRequestError<T extends BaseRequest>(err, requestInput: T) {
    if (XRPL_INTERNAL_ERRORS.includes(err.name)) {
      throw new NotFoundException(
        `XRPL resource: ${requestInput.command} not found: ${err?.message} Failure result code: ${err.data.error_code}`
      );
    } else if (CONNECTION_ERRORS.includes(err.name)) {
      throw new BadGatewayException(`XRPL network is not available: ${err.data.message}`);
    } else if (err.name === TimeoutError.name) {
      throw new GatewayTimeoutException();
    } else if (err.name === ValidationError.name) {
      throw new UnprocessableEntityException(
        `Request to XRPL network be cannot be validated to retrieve: ${requestInput.command} failed with code: ${err.data.error_code}`
      );
    }
  }

  static handleResponse<T extends BaseTransaction>(submitRes, tx: T): void {
    const formattedCode = this.formatResultCode(submitRes);
    if (formattedCode.prefix === XRPL_RESULT_PREFIX.SUCCESS.valueOf()) {
      Logger.log(`Transaction: ${tx.TransactionType} submitted successfully`);
    } else if (formattedCode.prefix === XRPL_RESULT_PREFIX.MALFORMED.valueOf()) {
      Logger.error(`Transaction: ${tx.TransactionType} is not valid: ${submitRes.response.engine_result}`);
      throw new UnprocessableEntityException(`Transaction: ${tx.TransactionType} is not valid`);
    } else if (formattedCode.prefix === XRPL_RESULT_PREFIX.RETRY) {
      Logger.error(
        `Transaction: ${tx.TransactionType} could not be applied, retry: ${submitRes.response.engine_result}`
      );
      throw new ServiceUnavailableException(`Transaction: ${tx.TransactionType} could not be applied, retry.`);
    } else if (formattedCode.code === XRPL_RESPONSE_CODE.HOOK_REJECTED) {
      Logger.error(`Transaction: ${tx.TransactionType} was rejected by the hook: ${submitRes.response.engine_result}`);
      throw new ConflictException(`Transaction: ${tx.TransactionType} rejected by the hook`);
    } else if (formattedCode.prefix === XRPL_RESULT_PREFIX.CLAIMED_COST_ONLY.valueOf()) {
      Logger.error(
        `Transaction: ${tx.TransactionType} did not achieve its intended purpose: ${submitRes.response.engine_result}`
      );
      throw new ServiceUnavailableException(
        `Transaction: ${tx.TransactionType} did not manage to achieve its intended purpose`
      );
    } else {
      Logger.error(`Transaction: ${tx.TransactionType} submission failed: ${submitRes.response.engine_result}`);
      throw new ServiceUnavailableException(`Transaction: ${tx.TransactionType} submission failed`);
    }
  }

  static formatResultCode(submitRes): IResultCode {
    return {
      prefix: submitRes.response.engine_result.slice(0, 3),
      code: submitRes.response.engine_result,
    };
  }
}
