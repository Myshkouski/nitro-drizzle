import {
  type AsyncRemoteCallback,
  type AsyncBatchRemoteCallback,
  SqliteRemoteDatabase,
  SQLiteRemoteSession,
  type RemoteCallback,
} from "drizzle-orm/sqlite-proxy";
import { defineDriver, type Schema } from ".";
import {
  type DrizzleConfig,
  DefaultLogger,
  type RelationalSchemaConfig,
  type TablesRelationalConfig,
  extractTablesRelationalConfig,
  createTableRelationsHelpers,
} from "drizzle-orm";
import { SQLiteD1Dialect } from "./internal/d1-dialect";
import { SELECT_1 } from "./internal/sql";

/**
 * Cloudflare D1 HTTP datasource driver for remote connections.
 * @template TSchema - The schema type
 * @param options - Driver configuration options
 * @param schema - The Drizzle schema
 * @returns A Datasource instance
 */
const driver = defineDriver(
  <TSchema extends Schema>(options: D1HttpOptions, schema: TSchema) => {
    const { callback, batchCallback } = d1HttpDriver(options);
    const database = drizzle(callback, batchCallback, { schema });
    return {
      database,
      schema,
      async waitReady() {
        await database.run(SELECT_1);
      },
      async close() {},
    };
  },
);

export default driver;

/** Configuration options for the Cloudflare D1 HTTP driver. */
type D1HttpOptions = {
  /** Cloudflare account ID. */
  accountId: string;
  /** D1 database ID. */
  databaseId: string;
  /** API token for authentication. */
  token: string;
};

/** Internal type for the HTTP driver callback functions. */
type D1HttpDriver = {
  callback: AsyncRemoteCallback;
  batchCallback: AsyncBatchRemoteCallback;
};

type D1Response =
  | {
      success: true;
      result: [Result, ...Result[]];
    }
  | {
      success: false;
      errors: { code: number; message: string }[];
    };

type Result = {
  results:
    | any[]
    | {
        columns: string[];
        rows: any[][];
      };
};

type D1HttpQuery = {
  sql: string;
  params: any[];
};

type FetchD1Body =
  | {
      batch: D1HttpQuery[];
    }
  | D1HttpQuery;

async function fetchD1(url: string | URL, body: FetchD1Body, options: D1HttpOptions) {
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${options.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const data = (await res.json()) as D1Response;

  if (!data.success) {
    throw new Error(data.errors.map((it) => `${it.code}: ${it.message}`).join("\n"));
  }

  const result = data.result[0].results;
  const rows = Array.isArray(result) ? result : result.rows;

  return { rows };
}

/**
 * Creates an HTTP driver for Cloudflare D1 API.
 * @param options - D1 HTTP configuration options
 * @returns Object containing callback and batchCallback functions
 * @see [Cloudflare API docs](https://developers.cloudflare.com/api/resources/d1/subresources/database/methods/raw/)
 */
export function d1HttpDriver(options: D1HttpOptions): D1HttpDriver {
  const url = new URL(
    `accounts/${options.accountId}/d1/database/${options.databaseId}/raw`,
    "https://api.cloudflare.com/client/v4/",
  );
  return {
    async callback(sql, params, _) {
      const body = { sql, params };
      const res = await fetchD1(url, body, options);
      return res;
    },
    async batchCallback(batch) {
      const body = {
        batch: batch.map(({ sql, params }) => {
          return {
            sql,
            params,
          };
        }),
      };
      const res = await fetchD1(url, body, options);
      return [res];
    },
  };
}

export function drizzle<TSchema extends Record<string, unknown> = Record<string, never>>(
  callback: RemoteCallback,
  config?: DrizzleConfig<TSchema>,
): SqliteRemoteDatabase<TSchema>;
export function drizzle<TSchema extends Record<string, unknown> = Record<string, never>>(
  callback: RemoteCallback,
  batchCallback?: AsyncBatchRemoteCallback,
  config?: DrizzleConfig<TSchema>,
): SqliteRemoteDatabase<TSchema>;
export function drizzle<TSchema extends Record<string, unknown> = Record<string, never>>(
  callback: RemoteCallback,
  batchCallback?: AsyncBatchRemoteCallback | DrizzleConfig<TSchema>,
  config?: DrizzleConfig<TSchema>,
): SqliteRemoteDatabase<TSchema> {
  const dialect = new SQLiteD1Dialect({ casing: config?.casing });
  let logger;
  let cache;
  let _batchCallback: AsyncBatchRemoteCallback | undefined;
  let _config: DrizzleConfig<TSchema> = {};

  if (batchCallback) {
    if (typeof batchCallback === "function") {
      _batchCallback = batchCallback as AsyncBatchRemoteCallback;
      _config = config ?? {};
    } else {
      _batchCallback = undefined;
      _config = batchCallback as DrizzleConfig<TSchema>;
    }

    if (_config.logger === true) {
      logger = new DefaultLogger();
    } else if (_config.logger !== false) {
      logger = _config.logger;
      cache = _config.cache;
    }
  }

  let schema: RelationalSchemaConfig<TablesRelationalConfig> | undefined;
  if (_config.schema) {
    const tablesConfig = extractTablesRelationalConfig(_config.schema, createTableRelationsHelpers);
    schema = {
      fullSchema: _config.schema,
      schema: tablesConfig.tables,
      tableNamesMap: tablesConfig.tableNamesMap,
    };
  }

  const session = new SQLiteRemoteSession(callback, dialect, schema, _batchCallback, {
    logger,
    cache,
  });
  const db = new SqliteRemoteDatabase(
    "async",
    dialect,
    session,
    schema,
  ) as SqliteRemoteDatabase<TSchema>;
  (<any>db).$cache = cache;
  if ((<any>db).$cache) {
    (<any>db).$cache["invalidate"] = cache?.onMutate;
  }
  return db;
}