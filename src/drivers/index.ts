/**
 * Schema type representing database tables.
 */
export type Schema = Record<string, any>;

/**
 * Factory function type for creating Drizzle datasource instances.
 * @template TDatabase - The database type
 */
export type DatasourceDriver<TDatabase> = <TSchema extends Schema>(
  config: any,
  schema: TSchema,
) => Datasource<TDatabase, TSchema> | Promise<Datasource<TDatabase, TSchema>>;

/**
 * Defines a driver factory function.
 * @template TFactory - The driver factory type
 * @param create - The driver factory function
 * @returns The same driver factory function
 */
export function defineDriver<TFactory extends DatasourceDriver<any>>(create: TFactory): TFactory {
  return create;
}

/**
 * Datasource interface representing a connected database with schema.
 * @template TDatabase - The database client type
 * @template TSchema - The schema type
 */
export interface Datasource<TDatabase, TSchema extends Schema> {
  /** The database client instance. */
  database: TDatabase;
  /** The schema definition. */
  schema: TSchema;
  /** Waits for the database connection to be ready. */
  waitReady: () => Promise<void>;
  /** Closes the database connection. */
  close: () => Promise<void>;
}
