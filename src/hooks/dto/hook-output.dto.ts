export type IAccountHookOutputDto = {
  hookHash?: string;
  hookGrants?: Array<{
    hookHash: string;
    authorize?: string;
  }>;
  hookNamespace?: string;
  flags?: number;
};
