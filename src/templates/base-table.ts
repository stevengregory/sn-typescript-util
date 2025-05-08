interface Column<Type = string, Default extends Type = Type> {
  default?: Default | string;
  maxLength?: number;
  label?: string;
  mandatory?: boolean;
  read_only?: boolean;
  active?: boolean;
  audit?: boolean;
  attributes?: Record<string, string | number | boolean>;
  function_definition?: `glidefunction:${string}`;
}

type StringColumn = Column<string>;
type IntegerColumn = Column<number>;
type GenericColumn<T> = Column<T> & { column_type: string };

interface BaseTable {
  sys_id?: GenericColumn<string>;
  sys_created_on?: GenericColumn<string>;
  sys_created_by?: StringColumn;
  sys_mod_count?: IntegerColumn;
  sys_updated_by?: StringColumn;
  sys_updated_on?: GenericColumn<string>;
}
