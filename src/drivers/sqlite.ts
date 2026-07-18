import sqlite3, { type Options as BetterSqlite3Options } from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { defineDriver, type Schema } from ".";
import { SELECT_1 } from "./internal/sql";

/**
 * SQLite datasource driver using better-sqlite3.
 * @template TSchema - The schema type
 * @param config - Driver configuration options
 * @param schema - The Drizzle schema
 * @returns A Datasource instance
 */
export default defineDriver(<TSchema extends Schema>(config: Options, schema: TSchema) => {
  const { url, ...options } = config;
  const sqlite = sqlite3(url, options);
  const database = drizzle(sqlite, { schema });
  return {
    dialect: "sqlite",
    database,
    schema,
    async waitReady() {
      if (!database.$client.open) {
        database.run(SELECT_1);
      }
    },
    async close() {
      database.$client.close();
    },
  };
});

/**
 * Configuration options for the SQLite driver.
 */
export type Options = {
  /** Database file path or URL. */
  url: string;
} & BetterSqlite3Options;
