import { drizzle } from "drizzle-orm/mysql2";
import { createConnection } from "mysql2/promise";
import { defineDriver, type Schema } from ".";
import { SELECT_1 } from "./internal/sql";

/**
 * MySQL datasource driver using mysql2.
 * @template TSchema - The schema type
 * @param config - Driver configuration options
 * @param schema - The Drizzle schema
 * @returns A Datasource instance
 */
export default defineDriver(async <TSchema extends Schema>(config: Options, schema: TSchema) => {
  const connection = await createConnection(config.url);
  const database = drizzle(connection, { schema, mode: "default" });
  return {
    dialect: "mysql",
    database,
    schema,
    waitReady: async () => {
      await database.execute(SELECT_1);
    },
    close: async () => {
      await database.$client.end();
    },
  };
});

/**
 * Configuration options for the MySQL driver.
 */
export type Options = {
  /** Database connection URL. */
  url: string;
};
