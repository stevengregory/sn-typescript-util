export type VersionType = 'patch' | 'minor' | 'major';

export interface Version {
  value: VersionType;
  label: Capitalize<VersionType>;
}
