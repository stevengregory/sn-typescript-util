export interface Options {
  build: () => Promise<void>;
  compile: () => Promise<void>;
  help: () => void;
  remove: () => Promise<void>;
  sync: () => Promise<void>;
  default: () => void;
}
