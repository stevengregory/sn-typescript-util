/**
 * Common system fields returned by legacy ServiceNow record queries.
 * This convenience type does not describe a ServiceNow Fluent table schema.
 */
interface BaseTable {
  readonly sys_id?: string;
  readonly sys_created_on?: string;
  readonly sys_created_by?: string;
  readonly sys_mod_count?: number;
  readonly sys_updated_by?: string;
  readonly sys_updated_on?: string;
}
