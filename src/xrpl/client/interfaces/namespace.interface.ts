export interface IHookNamespaceInfo {
  id: number;
  result: INamespaceResult;
  type: string;
}

export interface INamespaceResult {
  account: string;
  ledger_current_index: number;
  namespace_entries: INamespaceEntry[];
  namespace_id: string;
  validated: boolean;
}

export interface INamespaceEntry {
  Flags: number;
  HookStateData: string;
  HookStateKey: string;
  LedgerEntryType: string;
  OwnerNode: string;
  index: string;
}
