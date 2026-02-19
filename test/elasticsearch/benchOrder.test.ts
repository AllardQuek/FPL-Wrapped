import { test, expect } from 'vitest';
import { transformToGameweekDecision } from '../../lib/elasticsearch/transformer';

// Minimal bootstrap and live payloads for the test
const bootstrap = {
  elements: [
    { id: 101, web_name: 'A', element_type: 3 },
    { id: 102, web_name: 'B', element_type: 3 },
    { id: 103, web_name: 'C', element_type: 3 },
    { id: 104, web_name: 'D', element_type: 3 },
  ],
  element_types: [{ id: 3, singular_name_short: 'MID' }],
} as any;

const liveGW = {
  elements: [
    { id: 101, stats: { total_points: 1 } },
    { id: 102, stats: { total_points: 2 } },
    { id: 103, stats: { total_points: 3 } },
    { id: 104, stats: { total_points: 4 } },
  ],
} as any;

// picks deliberately out-of-position order (API order != ascending position)
const picks = {
  picks: [
    { element: 101, position: 13, multiplier: 0, is_captain: false, is_vice_captain: false },
    { element: 102, position: 12, multiplier: 0, is_captain: false, is_vice_captain: false },
    { element: 103, position: 15, multiplier: 0, is_captain: false, is_vice_captain: false },
    { element: 104, position: 14, multiplier: 0, is_captain: false, is_vice_captain: false },
  ],
  entry_history: { points: 0, overall_rank: 0, bank: 0, value: 0, event_transfers_cost: 0 },
  active_chip: null,
} as any;

const managerInfo = { player_first_name: 'X', player_last_name: 'Y', name: 'Team' } as any;

test('transform preserves picks order for bench (demonstrates unsorted result)', () => {
  const doc = transformToGameweekDecision(1, managerInfo, 1, picks, [], liveGW, bootstrap, []);
  // After sorting by position the bench should be in slot order 12..15
  const benchPositions = doc.bench.map(b => b.position_index);
  expect(benchPositions).toEqual([12, 13, 14, 15]);

  // Sorted order maps to elements [102,101,104,103] -> names [B,A,D,C] and points [2,1,4,3]
  expect(doc.bench.map(b => b.name)).toEqual(['B', 'A', 'D', 'C']);
  expect(doc.bench.map(b => b.points)).toEqual([2, 1, 4, 3]);
});
