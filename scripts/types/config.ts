export type target = 'ES5' | 'ES6' | 'ES2015' | 'ES2021';

export interface ConfigTarget {
  value: Lowercase<target>;
  label: target;
  hint?: string;
}
