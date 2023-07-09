//HookOn field in the SetHook tx describes four transaction types to be triggered on:
// URITOKEN_CREATE_SELL_OFFER
// URITOKEN_BUY
// SET_HOOK -> rejecting any updates, deleting of existing Hook if there are rentals in progress
// ACCOUNT_DELETE  -> same as for SET_HOOK, account cannot be removed if any rental is in progress
export const HOOK_ON = 'FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFE7FFFFFDFFFFF';

export enum SetHookType {
  INSTALL,
  UPDATE,
  RESET,
  DELETE,
}
