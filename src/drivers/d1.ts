import cloudflareD1Connector from "db0/connectors/cloudflare-d1";
import { defineDriver, type Schema } from ".";
import type { D1Database } from "@cloudflare/workers-types";
import type { DrizzleConfig, RelationalSchemaConfig, TablesRelationalConfig } from "drizzle-orm";
import {
  DefaultLogger,
  extractTablesRelationalConfig,
  createTableRelationsHelpers,
} from "drizzle-orm";
import { DrizzleD1Database, SQLiteD1Session, type AnyD1Database } from "drizzle-orm/d1";
import { SQLiteD1Dialect } from "./d1/dialect";
import { SELECT_1 } from "./internal/sql";

/**
 * Cloudflare D1 datasource driver.
 * @template TSchema - The schema type
 * @param options - Driver configuration options
 * @param schema - The Drizzle schema
 * @returns A Datasource instance
 */
export default defineDriver(async <TSchema extends Schema>(options: D1Options, schema: TSchema) => {
  const connector = cloudflareD1Connector({
    bindingName: options.binding,
  });
  const client = await connector.getInstance();
  const database = drizzle(client, { schema });
  return {
    dialect: "sqlite",
    database,
    schema,
    async waitReady() {
      await database.run(SELECT_1);
    },
    async close() {},
  };
});

/** Configuration options for the Cloudflare D1 driver. */
export type D1Options = {
  /** The binding name for the D1 database in Cloudflare Workers. */
  binding: string;
};

function drizzle<
  TSchema extends Record<string, unknown> = Record<string, never>,
  TClient extends AnyD1Database = AnyD1Database,
>(
  client: TClient,
  config: DrizzleConfig<TSchema> = {},
): DrizzleD1Database<TSchema> & {
  $client: TClient;
} {
  const dialect = new SQLiteD1Dialect({ casing: config.casing });
  let logger;
  if (config.logger === true) {
    logger = new DefaultLogger();
  } else if (config.logger !== false) {
    logger = config.logger;
  }

  let schema: RelationalSchemaConfig<TablesRelationalConfig> | undefined;
  if (config.schema) {
    const tablesConfig = extractTablesRelationalConfig(config.schema, createTableRelationsHelpers);
    schema = {
      fullSchema: config.schema,
      schema: tablesConfig.tables,
      tableNamesMap: tablesConfig.tableNamesMap,
    };
  }

  const session = new SQLiteD1Session(client as D1Database, dialect, schema, {
    logger,
    cache: config.cache,
  });
  const db = new DrizzleD1Database("async", dialect, session, schema) as DrizzleD1Database<TSchema>;
  (<any>db).$client = client;
  (<any>db).$cache = config.cache;
  if ((<any>db).$cache) {
    (<any>db).$cache["invalidate"] = config.cache?.onMutate;
  }

  return db as any;
}
