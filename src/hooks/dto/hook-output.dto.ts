export type IAccountHookOutputDto = {
  hookHash?: string;
  hookGrants?: Array<{
    hookHash: string;
    authorize?: string;
  }>;
  hookNamespace?: string;
  flags?: number;
  hookState?: HookState[];
};

export interface HookState {
  index: string;
  key: string;
  data: string;
}
