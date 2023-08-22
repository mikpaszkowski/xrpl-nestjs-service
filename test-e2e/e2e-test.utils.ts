import { HookState } from '../src/hooks/dto/hook-output.dto';

export const doesHookStateHasEntry = (state: HookState[], { key, data }: Omit<HookState, 'index'>) => {
  const doesEntryExist = state.filter((entryItem) => entryItem.key === key && entryItem.data === data);
  expect(doesEntryExist).toBeTruthy();
};
