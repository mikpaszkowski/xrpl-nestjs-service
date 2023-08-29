import { ConnectionError, NotConnectedError, NotFoundError, RippledError } from '@transia/xrpl';
import {
  DisconnectedError,
  ResponseFormatError,
  RippledNotInitializedError,
  UnexpectedError,
} from '@transia/xrpl/dist/npm/errors';

export const CONNECTION_ERRORS: string[] = [
  NotConnectedError.name,
  DisconnectedError.name,
  RippledNotInitializedError.name,
  ResponseFormatError.name,
  ConnectionError.name,
  UnexpectedError.name,
];

export const XRPL_INTERNAL_ERRORS: string[] = [NotFoundError.name, RippledError.name];
