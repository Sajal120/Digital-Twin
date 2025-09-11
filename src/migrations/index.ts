import * as migration_20250909_132902_initial from './20250909_132902_initial';

export const migrations = [
  {
    up: migration_20250909_132902_initial.up,
    down: migration_20250909_132902_initial.down,
    name: '20250909_132902_initial'
  },
];
