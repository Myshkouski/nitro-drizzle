import { drizzle } from "drizzle-orm/pglite";
import { PGlite, type PGliteOptions } from "@electric-sql/pglite";
import { defineDriver, type Schema } from ".";

/**
 * PGlite datasource driver for PostgreSQL in the browser.
 * @template TSchema - The schema type
 * @param options - PGlite configuration options
 * @param schema - The Drizzle schema
 * @returns A Datasource instance
 */
export default defineDriver(<TSchema extends Schema>(options: PGliteOptions, schema: TSchema) => {
  const connector = new PGlite(options);
  const database = drizzle(connector, { schema });
  return {
    database,
    schema,
    async waitReady() {
      await database.$client.waitReady;
    },
    async close() {
      await database.$client.close();
    },
  };
});
