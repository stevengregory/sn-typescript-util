export type Target = 'ES5' | 'ES6' | 'ES2015' | 'ES2021';

/** @deprecated Use `Target` instead. */
export type target = Target;

export interface ConfigTarget {
  value: Lowercase<Target>;
  label: Target;
  hint?: string;
}
