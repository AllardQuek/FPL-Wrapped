import { test, expect } from 'vitest';
import { getPlayerById, getPlayerName } from '../../lib/fpl-api';
import type { FPLBootstrap } from '../../lib/types';

const bootstrap = {
  elements: [
    { id: 329, web_name: 'Wilson', element_type: 4 },
    { id: 252, web_name: 'SomePlayer', element_type: 3 },
  ],
  element_types: [],
  events: [],
} as unknown as FPLBootstrap;

test('getPlayerById finds id 329', async () => {
  const p = await getPlayerById(329, bootstrap);
  expect(p).toBeDefined();
  expect(p?.web_name).toBe('Wilson');
});

test('getPlayerName returns name for 329', async () => {
  const name = await getPlayerName(329, bootstrap);
  expect(name).toBe('Wilson');
});
