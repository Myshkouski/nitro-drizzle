import { drizzle } from "drizzle-orm/postgres-js";
import createPostgres, { type Options as PostgresOptions } from "postgres";
import { defineDriver } from ".";
import { SELECT_1 } from "./internal/sql";

/**
 * PostgreSQL datasource driver using postgres.js.
 * @template TSchema - The schema type
 * @param options - Driver configuration options
 * @param schema - The Drizzle schema
 * @returns A Datasource instance
 */
export default defineDriver(
   <TSchema extends Record<string, any>>(options: Options, schema: TSchema) => {
     const { url, ...other } = options;
     const client = url ? createPostgres(url, other) : createPostgres(other);
     const database = drizzle(client, { schema });
     return {
       database,
       schema,
       async waitReady() {
         await database.execute(SELECT_1);
       },
       async close() {
         await database.$client.end();
       },
     };
   },
);

/**
 * Configuration options for the PostgreSQL driver.
 */
export type Options = PostgresOptions<Record<string, createPostgres.PostgresType>> & {
   /** Connection URL string (optional if connection config is provided). */
   url?: string;
};