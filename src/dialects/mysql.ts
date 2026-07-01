import type { MySqlInsertBase } from "drizzle-orm/mysql-core";
import type { InferColumns, InferPrimaryColumns, InferTable, OnConflictDoUpdateOptions } from ".";
import { type SQL, sql } from "drizzle-orm/sql";

/**
 * Adds an ON CONFLICT DO UPDATE clause to a MySQL insert statement.
 * @template TInsert - The insert type
 * @param _ - Primary columns for conflict detection (used internally)
 * @param insert - The insert statement
 * @param options - Options containing the SET values
 * @returns The modified insert statement
 */
export function onConflictDoUpdate<TInsert extends MySqlInsertBase<any, any, any, any, any, any>>(
  _: InferPrimaryColumns<InferTable<TInsert>>,
  insert: TInsert,
  options: OnConflictDoUpdateOptions<TInsert>,
): TInsert | Omit<MySqlInsertBase<TInsert["_"]["table"], TInsert["_"]["queryResult"], TInsert["_"]["preparedQueryHKT"], TInsert["_"]["returning"], any, "$returning" | TInsert["_"]["excludedMethods"]>, "onDuplicateKeyUpdate" | TInsert["_"]["excludedMethods"]> {
  return insert.onDuplicateKeyUpdate({
    set: options.set,
  });
}

/**
 * Adds an ON CONFLICT DO NOTHING clause to a MySQL insert statement.
 * Uses ON DUPLICATE KEY UPDATE with the primary key values for equivalent behavior.
 * @template TInsert - The insert type
 * @param target - Primary columns for conflict detection
 * @param insert - The insert statement
 * @returns The modified insert statement
 */
export function onConflictDoNothing<TInsert extends MySqlInsertBase<any, any, any, any, any, any>>(
  target: InferPrimaryColumns<InferTable<TInsert>>,
  insert: TInsert,
): TInsert | Omit<MySqlInsertBase<TInsert["_"]["table"], TInsert["_"]["queryResult"], TInsert["_"]["preparedQueryHKT"], TInsert["_"]["returning"], any, "$returning" | TInsert["_"]["excludedMethods"]>, "onDuplicateKeyUpdate" | TInsert["_"]["excludedMethods"]> {
  const set = Object.fromEntries(
    Object.entries(target).map(([name, column]) => {
      return [name, sql`${column}`];
    }),
  ) as Record<keyof InferColumns<InferTable<TInsert>>, SQL>;

  return onConflictDoUpdate(target, insert, { set });
}

/**
 * Infers the table type from a MySQL insert statement.
 * @template T - The insert type
 */
export type InferMysqlTable<T extends MySqlInsertBase<any, any, any, any, any, any>> =
   T extends MySqlInsertBase<infer TTable, any, any, any, any, any> ? TTable : never;
