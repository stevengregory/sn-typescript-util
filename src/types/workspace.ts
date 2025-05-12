import type { Metadata } from './metadata.js';

export interface Workspace {
  readonly ALL_APPLICATIONS: {
    [appName: string]: Metadata;
  };
  readonly ACTIVE_APPLICATION: string;
}
