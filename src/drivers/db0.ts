import { useDatabase } from "nitropack/runtime";
import { defineDriver, type Schema } from ".";
import { drizzle } from "db0/integrations/drizzle";
import { SELECT_1 } from "./internal/sql";

/**
 * DB0 datasource driver for Nitro's built-in database configuration.
 * @template TSchema - The schema type
 * @returns A Datasource instance using Nitro's database configuration
 */
export default defineDriver(<TSchema extends Schema>(options: Options, schema: TSchema) => {
  const db0 = useDatabase(options.name);
  const database = drizzle<TSchema>(db0);
  return {
    database,
    schema,
    close: async () => {
      await db0.dispose();
    },
    waitReady: async () => {
      await db0.exec(SELECT_1);
    },
  };
});

export type Options = {
  name?: string;
};
