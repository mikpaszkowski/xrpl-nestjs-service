import { HookState } from '../src/hooks/dto/hook-output.dto';

export const doesHookStateHasEntry = (state: HookState[], { key, data }: Omit<HookState, 'index'>) => {
  const doesEntryExist = state.find((entryItem) => entryItem.key === key && entryItem.data === data);
  expect(doesEntryExist).toBeTruthy();
};

export const doesHookStateHasNoEntry = (state: HookState[], { key, data }: Omit<HookState, 'index'>) => {
  const doesEntryExist = state.find((entryItem) => entryItem.key === key && entryItem.data === data);
  expect(doesEntryExist).toBeFalsy();
};
